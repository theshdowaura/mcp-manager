use serde::Serialize;
use std::env;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;

#[derive(Serialize)]
pub struct EnvCheckResult {
    pub is_installed: bool,
    pub version: String,
    pub install_url: String,
}

#[tauri::command]
pub async fn get_python_path(app_handle: AppHandle) -> EnvCheckResult {
    let shell = app_handle.shell();

    #[cfg(windows)]
    let python_exec = "python";
    #[cfg(not(windows))]
    let python_exec = "python3";

    match shell
        .command(python_exec)
        .args(&["--version"])
        .output()
        .await
    {
        Ok(output) if output.status.success() => EnvCheckResult {
            is_installed: true,
            version: String::from_utf8_lossy(&output.stdout).trim().to_string(),
            install_url: "https://www.python.org/downloads/".to_string(),
        },
        _ => EnvCheckResult {
            is_installed: false,
            version: "未安装".to_string(),
            install_url: "https://www.python.org/downloads/".to_string(),
        },
    }
}

#[tauri::command]
pub async fn get_node_path(app_handle: AppHandle) -> EnvCheckResult {
    let shell = app_handle.shell();

    match shell.command("node").args(&["--version"]).output().await {
        Ok(output) if output.status.success() => EnvCheckResult {
            is_installed: true,
            version: String::from_utf8_lossy(&output.stdout).trim().to_string(),
            install_url: "https://nodejs.org/".to_string(),
        },
        _ => EnvCheckResult {
            is_installed: false,
            version: "未安装".to_string(),
            install_url: "https://nodejs.org/".to_string(),
        },
    }
}

#[tauri::command]
pub async fn get_uv_path(app_handle: AppHandle) -> EnvCheckResult {
    let shell = app_handle.shell();

    match shell.command("uv").args(&["--version"]).output().await {
        Ok(output) if output.status.success() => EnvCheckResult {
            is_installed: true,
            version: String::from_utf8_lossy(&output.stdout).trim().to_string(),
            install_url: "https://github.com/astral-sh/uv".to_string(),
        },
        _ => EnvCheckResult {
            is_installed: false,
            version: "未安装".to_string(),
            install_url: "https://github.com/astral-sh/uv".to_string(),
        },
    }
}

#[tauri::command]
pub async fn install_environment(
    app_handle: AppHandle,
    env_type: &str,
) -> Result<EnvCheckResult, String> {
    let shell = app_handle.shell();

    match env_type {
        "python" => {
            #[cfg(target_os = "macos")]
            {
                match shell
                    .command("brew")
                    .args(&["install", "python@3.11"])
                    .output()
                    .await
                {
                    Ok(output) if output.status.success() => {
                        // 安装成功后，重新检查状态
                        Ok(get_python_path(app_handle).await)
                    }
                    _ => Err("安装失败".to_string()),
                }
            }
            #[cfg(not(target_os = "macos"))]
            {
                Err("暂不支持此系统的自动安装".to_string())
            }
        }
        "node" => {
            #[cfg(target_os = "macos")]
            {
                match shell
                    .command("brew")
                    .args(&["install", "node@20"])
                    .output()
                    .await
                {
                    Ok(output) if output.status.success() => {
                        // 安装成功后，重新检查状态
                        Ok(get_node_path(app_handle).await)
                    }
                    _ => Err("安装失败".to_string()),
                }
            }
            #[cfg(not(target_os = "macos"))]
            {
                Err("暂不支持此系统的自动安装".to_string())
            }
        }
        "uv" => {
            #[cfg(target_os = "macos")]
            {
                match shell
                    .command("brew")
                    .args(&["install", "uv"])
                    .output()
                    .await
                {
                    Ok(output) if output.status.success() => {
                        // 安装成功后，重新检查状态
                        Ok(get_uv_path(app_handle).await)
                    }
                    _ => Err("安装失败".to_string()),
                }
            }
            #[cfg(not(target_os = "macos"))]
            {
                Err("暂不支持此系统的自动安装".to_string())
            }
        }
        _ => Err("不支持的环境类型".to_string()),
    }
}

#[derive(Serialize)]
pub struct ClaudeCheckResult {
    is_installed: bool,
    install_url: String,
}

#[tauri::command]
pub fn check_claude_installed() -> ClaudeCheckResult {
    let is_installed = if cfg!(target_os = "macos") {
        let app_path = PathBuf::from("/Applications/Claude.app");
        let user_app_path = PathBuf::from(format!(
            "{}/Applications/Claude.app",
            env::var("HOME").unwrap_or_default()
        ));
        app_path.exists() || user_app_path.exists()
    } else if cfg!(target_os = "windows") {
        let program_files = env::var("ProgramFiles").unwrap_or_default();
        let app_path = PathBuf::from(format!("{}/Claude/Claude.exe", program_files));
        app_path.exists()
    } else {
        // Linux
        let app_path = PathBuf::from("/usr/bin/claude");
        let local_app_path = PathBuf::from(format!(
            "{}/.local/bin/claude",
            env::var("HOME").unwrap_or_default()
        ));
        app_path.exists() || local_app_path.exists()
    };

    ClaudeCheckResult {
        is_installed,
        install_url: "https://claude.ai/download".to_string(),
    }
}
