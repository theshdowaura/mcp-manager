use crate::claude_config::McpServerConfig;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::mpsc;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_fs::FsExt;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct McpServerTemplate {
    pub name: String,
    pub description: String,
    pub command: String,
    pub args: Vec<String>,
    pub env: Option<HashMap<String, String>>,
}

pub fn get_available_mcp_servers() -> Vec<McpServerTemplate> {
    vec![
        McpServerTemplate {
            name: "filesystem".to_string(),
            description: "文件系统访问，可配置访问路径".to_string(),
            command: "npx".to_string(),
            args: vec![
                "-y".to_string(),
                "@modelcontextprotocol/server-filesystem".to_string(),
                "/Users/default/Desktop".to_string(),
            ],
            env: None,
        },
        McpServerTemplate {
            name: "fetch".to_string(),
            description: "HTTP 请求，支持配置端点和请求参数".to_string(),
            command: "uvx".to_string(),
            args: vec!["mcp-server-fetch".to_string()],
            env: None,
        },
        McpServerTemplate {
            name: "postgres".to_string(),
            description: "PostgreSQL 数据库访问，支持 SQL 查询".to_string(),
            command: "npx".to_string(),
            args: vec![
                "-y".to_string(),
                "@modelcontextprotocol/server-postgres".to_string(),
            ],
            env: Some(HashMap::from([(
                "DATABASE_URL".to_string(),
                "postgresql://user:pass@localhost:5432/db".to_string(),
            )])),
        },
        McpServerTemplate {
            name: "git".to_string(),
            description: "Git 仓库访问，支持克隆、提交等操作".to_string(),
            command: "npx".to_string(),
            args: vec![
                "-y".to_string(),
                "@modelcontextprotocol/server-git".to_string(),
            ],
            env: None,
        },
        McpServerTemplate {
            name: "memory".to_string(),
            description: "内存数据存储，用于临时数据缓存".to_string(),
            command: "npx".to_string(),
            args: vec![
                "-y".to_string(),
                "@modelcontextprotocol/server-memory".to_string(),
            ],
            env: None,
        },
        McpServerTemplate {
            name: "brave-search".to_string(),
            description: "Brave 搜索 API，支持网络搜索".to_string(),
            command: "npx".to_string(),
            args: vec![
                "-y".to_string(),
                "@modelcontextprotocol/server-brave-search".to_string(),
            ],
            env: Some(HashMap::from([(
                "BRAVE_API_KEY".to_string(),
                "your-api-key".to_string(),
            )])),
        },
        McpServerTemplate {
            name: "shell".to_string(),
            description: "命令行执行，支持运行系统命令".to_string(),
            command: "npx".to_string(),
            args: vec![
                "-y".to_string(),
                "@modelcontextprotocol/server-shell".to_string(),
            ],
            env: None,
        },
        McpServerTemplate {
            name: "openapi".to_string(),
            description: "OpenAPI/Swagger API 访问".to_string(),
            command: "npx".to_string(),
            args: vec![
                "-y".to_string(),
                "@modelcontextprotocol/server-openapi".to_string(),
            ],
            env: None,
        },
    ]
}

#[tauri::command]
pub fn get_mcp_server_templates() -> Vec<McpServerTemplate> {
    get_available_mcp_servers()
}

#[tauri::command]
pub fn install_mcp_server(template: McpServerTemplate) -> Result<(), String> {
    // 在修改之前创建备份
    crate::claude_config::backup_config()?;

    let mut config = crate::claude_config::get_claude_config()?;

    // 将模板转换为配置并添加到 mcp_servers 中
    config.mcp_servers.insert(
        template.name.clone(),
        McpServerConfig {
            command: template.command.clone(),
            args: template.args.clone(),
        },
    );

    // 保存更新后的配置
    if let Err(e) = crate::claude_config::save_claude_config(config) {
        // 如果保存失败，尝试恢复备份
        crate::claude_config::restore_config_backup()?;
        return Err(e);
    }

    // // 启动 MCP server
    // crate::mcp_runner::start_mcp_server(
    //     &template.name,
    //     &template.command,
    //     &template.args,
    //     template.env.as_ref(),
    // )?;

    Ok(())
}

#[tauri::command]
pub fn is_mcp_server_installed(name: String) -> Result<bool, String> {
    let config = crate::claude_config::get_claude_config()?;
    Ok(config.mcp_servers.contains_key(&name))
}

#[tauri::command]
pub fn uninstall_mcp_server(name: String) -> Result<(), String> {
    // 在修改之前创建备份
    crate::claude_config::backup_config()?;

    // 停止运行中的 server
    crate::mcp_runner::stop_mcp_server(&name)?;

    let mut config = crate::claude_config::get_claude_config()?;

    // 检查服务器是否存在
    if !config.mcp_servers.contains_key(&name) {
        return Err(format!("MCP server '{}' not found", name));
    }

    // 删除服务器
    config.mcp_servers.remove(&name);

    // 保存更新后的配置
    if let Err(e) = crate::claude_config::save_claude_config(config) {
        // 如果保存失败，尝试恢复备份
        crate::claude_config::restore_config_backup()?;
        return Err(e);
    }

    Ok(())
}

#[tauri::command]
pub async fn select_folder(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let (tx, rx) = mpsc::channel();

    app.dialog().file().pick_folders(move |folders| {
        if let Some(folders) = folders {
            if let Some(first) = folders.first() {
                let _ = tx.send(Some(first.to_string()));
                return;
            }
        }
        let _ = tx.send(None);
    });

    let result = rx
        .recv()
        .map_err(|e| format!("Failed to receive result: {}", e))?;

    if let Some(path) = &result {
        let fs = app.fs_scope();
        fs.allow_directory(path, true);
    }

    Ok(result)
}

#[tauri::command]
pub fn update_mcp_server_config(name: String, config: McpServerConfig) -> Result<(), String> {
    // 在修改之前创建备份
    crate::claude_config::backup_config()?;

    let mut claude_config = crate::claude_config::get_claude_config()?;

    // 更新配置
    claude_config.mcp_servers.insert(name, config);

    // 保存更新后的配置
    if let Err(e) = crate::claude_config::save_claude_config(claude_config) {
        // 如果保存失败，尝试恢复备份
        crate::claude_config::restore_config_backup()?;
        return Err(e);
    }

    Ok(())
}
