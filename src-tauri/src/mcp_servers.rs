use crate::store::InstalledMcpServer;
use reqwest;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::mpsc;
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_fs::FsExt;
use serde_json::Value as JsonValue;

// 新的数据结构匹配 API 返回
#[derive(Debug, Serialize, Deserialize)]
struct ApiResponse {
    code: i32,
    msg: String,
    data: ApiData,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiData {
    total: i32,
    list: Vec<McpServerTemplate>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct McpServerTemplate {
    pub id: String,
    pub name: String,
    pub description: String,
    pub command: String,
    pub args: Vec<String>,
    pub env: Option<HashMap<String, String>>,
    pub require_file_path: bool,
    pub repo_url: String,
    pub created_at: String,
    pub updated_at: String,
    pub downloads: i32,
    pub total_usage_time: i32,
}

// 分页参数结构
#[derive(Debug, Serialize, Deserialize)]
pub struct PaginationParams {
    pub page: u32,
    pub page_size: u32,
    pub keyword: Option<String>,
    pub require_file_path: Option<bool>,
}

// 修改获取模板的函数
#[tauri::command]
pub async fn get_mcp_server_templates(params: PaginationParams) -> Result<ApiData, String> {
    println!("Fetching templates with params: {:?}", params);

    let client = reqwest::Client::new();

    // 构建查询参数
    let mut query = vec![
        ("page", params.page.to_string()),
        ("page_size", params.page_size.to_string()),
    ];

    if let Some(keyword) = params.keyword {
        query.push(("keyword", keyword));
    }

    if let Some(require_file_path) = params.require_file_path {
        query.push(("require_file_path", require_file_path.to_string()));
    }

    println!("Sending request with query: {:?}", query);

    // 发送请求
    let response = client
        .get("http://127.0.0.1:3988/api/v1/templates")
        .query(&query)
        .send()
        .await
        .map_err(|e| {
            println!("Request failed: {}", e);
            format!("Failed to fetch templates: {}", e)
        })?;

    println!("Received response status: {}", response.status());

    // 解析响应
    let api_response: ApiResponse = response.json().await.map_err(|e| {
        println!("Failed to parse response: {}", e);
        format!("Failed to parse response: {}", e)
    })?;

    // println!("Parsed response: {:?}", api_response);

    if api_response.code != 0 {
        println!("API error: {}", api_response.msg);
        return Err(api_response.msg);
    }

    Ok(api_response.data)
}

#[tauri::command]
pub async fn install_mcp_server(app: AppHandle, template: McpServerTemplate) -> Result<(), String> {
    // 在修改之前创建备份
    crate::claude_config::backup_config()?;

    // 保存到 store
    crate::store::save_installed_server(
        app.clone(),
        InstalledMcpServer {
            id: template.id.clone(),
            name: template.name.clone(),
            command: template.command.clone(),
            args: template.args.clone(),
            env: template.env.clone(),
            require_file_path: template.require_file_path,
            repo_url: template.repo_url.clone(),
        },
    )
    .await?;

    // 获取当前配置
    let mut claude_config = crate::claude_config::get_claude_config()?;

    // 创建新的服务器配置
    let mut server_config = HashMap::new();
    server_config.insert("command".to_string(), serde_json::json!(template.command));
    server_config.insert("args".to_string(), serde_json::json!(template.args));
    
    // 只在 env 存在且不为空时才添加
    if let Some(env) = template.env {
        if !env.is_empty() {
            server_config.insert("env".to_string(), serde_json::json!(env));
        }
    }

    println!("Installing server with config: {:?}", &server_config);
    
    // 更新配置
    claude_config.mcp_servers.insert(template.name, server_config);

    // 保存配置
    crate::claude_config::save_claude_config(claude_config)?;

    println!("Server installed successfully");

    Ok(())
}

#[tauri::command]
pub fn is_mcp_server_installed(name: String) -> Result<bool, String> {
    let config = crate::claude_config::get_claude_config()?;
    Ok(config.mcp_servers.contains_key(&name))
}

#[tauri::command]
pub async fn uninstall_mcp_server(app: AppHandle, name: String) -> Result<(), String> {
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

    // 从 store 中删除服务器配置
    crate::store::remove_installed_server(app, name).await?;

    Ok(())
}

#[tauri::command]
pub async fn select_folder(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let (tx, rx) = mpsc::channel();

    app.dialog().file().pick_folders(move |folders| {
        if let Some(folders) = folders {
            if let Some(first) = folders.first() {
                println!("Selected folder: {:?}", first);
                let _ = tx.send(Some(first.to_string()));
                return;
            }
        }
        println!("No folder selected");
        let _ = tx.send(None);
    });

    let result = rx
        .recv()
        .map_err(|e| format!("Failed to receive result: {}", e))?;

    if let Some(path) = &result {
        println!("Allowing directory access: {}", path);
        let fs = app.fs_scope();
        fs.allow_directory(path, true);
    }

    Ok(result)
}

#[tauri::command]
pub fn update_mcp_server_config(
    name: String, 
    config: HashMap<String, JsonValue>
) -> Result<(), String> {
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
