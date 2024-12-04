use crate::tray::update_tray_status;
use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::io::{BufRead, BufReader};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::thread;
use tauri::AppHandle;

// 存储运行中的 servers 和它们的状态
static RUNNING_SERVERS: Lazy<Mutex<HashMap<String, Child>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

pub fn start_mcp_server(
    name: &str,
    command: &str,
    args: &[String],
    env: Option<&HashMap<String, String>>,
) -> Result<(), String> {
    println!(
        "Starting MCP server: {} with command: {} {}",
        name,
        command,
        args.join(" ")
    );

    let mut command = Command::new(command);
    command
        .args(args)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    if let Some(env_vars) = env {
        for (key, value) in env_vars {
            command.env(key, value);
        }
    }

    match command.spawn() {
        Ok(mut child) => {
            // 获取进程的输出流
            let stdout = child
                .stdout
                .take()
                .ok_or_else(|| "Failed to capture stdout".to_string())?;
            let stderr = child
                .stderr
                .take()
                .ok_or_else(|| "Failed to capture stderr".to_string())?;

            let name_clone = name.to_string();
            // 在新线程中监控输出
            thread::spawn(move || {
                let reader = BufReader::new(stdout);
                for line in reader.lines() {
                    if let Ok(line) = line {
                        println!("[{}] stdout: {}", name_clone, line);
                    }
                }
            });

            let name_clone = name.to_string();
            thread::spawn(move || {
                let reader = BufReader::new(stderr);
                for line in reader.lines() {
                    if let Ok(line) = line {
                        eprintln!("[{}] stderr: {}", name_clone, line);
                    }
                }
            });

            // 等待一小段时间检查进程是否存活
            thread::sleep(std::time::Duration::from_millis(500));

            match child.try_wait() {
                Ok(Some(status)) => {
                    return Err(format!(
                        "MCP server failed to start: process exited with status {}",
                        status
                    ));
                }
                Ok(None) => {
                    println!("Successfully started MCP server: {}", name);
                    let mut servers = RUNNING_SERVERS
                        .lock()
                        .map_err(|e| format!("Failed to lock servers: {}", e))?;
                    servers.insert(name.to_string(), child);
                    Ok(())
                }
                Err(e) => Err(format!("Failed to check process status: {}", e)),
            }
        }
        Err(e) => {
            let error = format!("Failed to start MCP server: {}", e);
            eprintln!("{}", error);
            Err(error)
        }
    }
}

pub fn stop_mcp_server(name: &str) -> Result<(), String> {
    let mut servers = RUNNING_SERVERS
        .lock()
        .map_err(|e| format!("Failed to lock servers: {}", e))?;

    if let Some(mut child) = servers.remove(name) {
        // 先尝试优雅地终止进程
        if let Err(e) = child.kill() {
            eprintln!("Failed to kill process: {}", e);
            // 如果 kill 失败，尝试强制终止
            #[cfg(unix)]
            {
                let _ = std::process::Command::new("kill")
                    .arg("-9")
                    .arg(child.id().to_string())
                    .spawn();
            }
            #[cfg(windows)]
            {
                let _ = std::process::Command::new("taskkill")
                    .args(&["/F", "/PID", &child.id().to_string()])
                    .spawn();
            }
        }

        // 等待进程完全退出
        match child.wait() {
            Ok(status) => {
                println!("Server {} stopped with status: {}", name, status);
            }
            Err(e) => {
                eprintln!("Error waiting for process to exit: {}", e);
            }
        }
    }

    Ok(())
}

pub fn stop_all_servers() -> Result<(), String> {
    let mut servers = RUNNING_SERVERS
        .lock()
        .map_err(|e| format!("Failed to lock servers: {}", e))?;

    for (name, mut child) in servers.drain() {
        if let Err(e) = child.kill() {
            eprintln!("Failed to stop MCP server {}: {}", name, e);
        }
    }

    Ok(())
}

#[tauri::command]
pub fn get_server_status(name: &str) -> bool {
    if let Ok(mut servers) = RUNNING_SERVERS.lock() {
        // 先检查服务器是否存在
        if !servers.contains_key(name) {
            return false;
        }

        // 尝试检查进程状态并根据需要移除
        let should_remove = if let Some(child) = servers.get_mut(name) {
            match child.try_wait() {
                Ok(None) => false,   // 进程运行中，不需要移除
                Ok(Some(_)) => true, // 进程已退出，需要移除
                Err(_) => true,      // 检查失败，需要移除
            }
        } else {
            false
        };

        // 如果需要移除，就移除进程
        if should_remove {
            servers.remove(name);
            false
        } else {
            true
        }
    } else {
        false
    }
}

#[tauri::command]
pub async fn start_server(app_handle: AppHandle, name: String) -> Result<(), String> {
    let config = crate::claude_config::get_claude_config()?;
    let server_config = config
        .mcp_servers
        .get(&name)
        .ok_or_else(|| format!("Server {} not found", name))?;

    // 从 HashMap 中获取命令
    let command = server_config
        .get("command")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "Command not found in config".to_string())?;

    // 从 HashMap 中获取参数数组
    let args = server_config
        .get("args")
        .and_then(|v| v.as_array())
        .ok_or_else(|| "Args not found in config".to_string())?
        .iter()
        .filter_map(|v| v.as_str().map(String::from))
        .collect::<Vec<String>>();

    println!("Starting server: {} with command: {}", name, command,);

    // 启动服务器
    start_mcp_server(&name, command, &args, None)
        .and_then(|()| update_tray_status(app_handle).map_err(|e| e.to_string()))
}

#[tauri::command]
pub async fn stop_server(app_handle: AppHandle, name: String) -> Result<(), String> {
    stop_mcp_server(&name).and_then(|()| update_tray_status(app_handle).map_err(|e| e.to_string()))
}

#[tauri::command]
pub fn restart_claude_app() -> Result<(), String> {
    // 先终止 Claude 进程
    let kill_status = Command::new("killall")
        .arg("Claude")
        .status()
        .map_err(|e| format!("Failed to kill Claude: {}", e))?;

    if !kill_status.success() {
        return Err("Failed to kill Claude process".to_string());
    }

    // 短暂延迟确保进程完全终止
    thread::sleep(std::time::Duration::from_millis(500));

    // 重新启动 Claude
    let open_status = Command::new("open")
        .arg("-a")
        .arg("Claude")
        .status()
        .map_err(|e| format!("Failed to start Claude: {}", e))?;

    if !open_status.success() {
        return Err("Failed to start Claude".to_string());
    }

    Ok(())
}
