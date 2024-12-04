use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::env;
use std::fs;
use std::path::PathBuf;
use serde_json::Value as JsonValue;

#[derive(Debug, Serialize, Deserialize)]
pub struct ClaudeConfig {
    #[serde(rename = "mcpServers")]
    pub mcp_servers: HashMap<String, HashMap<String, JsonValue>>,
    #[serde(rename = "globalShortcut")]
    pub global_shortcut: String,
}

#[tauri::command]
pub fn get_claude_config() -> Result<ClaudeConfig, String> {
    let config_path = if cfg!(target_os = "macos") {
        let home = env::var("HOME").map_err(|_| "Could not find home directory".to_string())?;
        PathBuf::from(home)
            .join("Library")
            .join("Application Support")
            .join("Claude")
            .join("claude_desktop_config.json")
    } else if cfg!(target_os = "windows") {
        let app_data =
            env::var("APPDATA").map_err(|_| "Could not find APPDATA directory".to_string())?;
        PathBuf::from(app_data)
            .join("Claude")
            .join("claude_desktop_config.json")
    } else {
        let home = env::var("HOME").map_err(|_| "Could not find home directory".to_string())?;
        PathBuf::from(home)
            .join(".config")
            .join("Claude")
            .join("claude_desktop_config.json")
    };

    let config_str = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config file: {}", e))?;

    serde_json::from_str(&config_str).map_err(|e| format!("Failed to parse config: {}", e))
}

#[tauri::command]
pub fn get_config_path() -> String {
    if cfg!(target_os = "macos") {
        let home = env::var("HOME").unwrap_or_default();
        format!(
            "{}/Library/Application Support/Claude/claude_desktop_config.json",
            home
        )
    } else if cfg!(target_os = "windows") {
        let app_data = env::var("APPDATA").unwrap_or_default();
        format!("{}/Claude/claude_desktop_config.json", app_data)
    } else {
        let home = env::var("HOME").unwrap_or_default();
        format!("{}/.config/Claude/claude_desktop_config.json", home)
    }
}

#[tauri::command]
pub fn save_claude_config(config: ClaudeConfig) -> Result<(), String> {
    let config_path = if cfg!(target_os = "macos") {
        let home = env::var("HOME").map_err(|_| "Could not find home directory".to_string())?;
        PathBuf::from(home)
            .join("Library")
            .join("Application Support")
            .join("Claude")
            .join("claude_desktop_config.json")
    } else if cfg!(target_os = "windows") {
        let app_data =
            env::var("APPDATA").map_err(|_| "Could not find APPDATA directory".to_string())?;
        PathBuf::from(app_data)
            .join("Claude")
            .join("claude_desktop_config.json")
    } else {
        let home = env::var("HOME").map_err(|_| "Could not find home directory".to_string())?;
        PathBuf::from(home)
            .join(".config")
            .join("Claude")
            .join("claude_desktop_config.json")
    };

    let config_str = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    fs::write(&config_path, config_str)
        .map_err(|e| format!("Failed to write config file: {}", e))?;

    Ok(())
}

// 备份配置文件
pub fn backup_config() -> Result<(), String> {
    let config_path = if cfg!(target_os = "macos") {
        let home = env::var("HOME").map_err(|_| "Could not find home directory".to_string())?;
        PathBuf::from(home)
            .join("Library")
            .join("Application Support")
            .join("Claude")
            .join("claude_desktop_config.json")
    } else if cfg!(target_os = "windows") {
        let app_data =
            env::var("APPDATA").map_err(|_| "Could not find APPDATA directory".to_string())?;
        PathBuf::from(app_data)
            .join("Claude")
            .join("claude_desktop_config.json")
    } else {
        let home = env::var("HOME").map_err(|_| "Could not find home directory".to_string())?;
        PathBuf::from(home)
            .join(".config")
            .join("Claude")
            .join("claude_desktop_config.json")
    };

    let backup_path = config_path.with_extension("json.backup");

    // 如果原配置文件存在，就创建备份
    if config_path.exists() {
        fs::copy(&config_path, &backup_path)
            .map_err(|e| format!("Failed to create backup: {}", e))?;
    }

    Ok(())
}

// 添加这个函数来恢复备份
#[tauri::command]
pub fn restore_config_backup() -> Result<(), String> {
    let config_path = if cfg!(target_os = "macos") {
        let home = env::var("HOME").map_err(|_| "Could not find home directory".to_string())?;
        PathBuf::from(home)
            .join("Library")
            .join("Application Support")
            .join("Claude")
            .join("claude_desktop_config.json")
    } else if cfg!(target_os = "windows") {
        let app_data =
            env::var("APPDATA").map_err(|_| "Could not find APPDATA directory".to_string())?;
        PathBuf::from(app_data)
            .join("Claude")
            .join("claude_desktop_config.json")
    } else {
        let home = env::var("HOME").map_err(|_| "Could not find home directory".to_string())?;
        PathBuf::from(home)
            .join(".config")
            .join("Claude")
            .join("claude_desktop_config.json")
    };

    let backup_path = config_path.with_extension("json.backup");

    if backup_path.exists() {
        fs::copy(&backup_path, &config_path)
            .map_err(|e| format!("Failed to restore backup: {}", e))?;
        fs::remove_file(&backup_path)
            .map_err(|e| format!("Failed to remove backup file: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn update_global_shortcut_command(shortcut: String) -> Result<(), String> {
    // 在修改之前创建备份
    backup_config()?;

    let mut config = get_claude_config()?;
    
    // 更新快捷键
    config.global_shortcut = shortcut;
    
    // 保存更新后的配置
    if let Err(e) = save_claude_config(config) {
        // 如果保存失败，尝试恢复备份
        restore_config_backup()?;
        return Err(e);
    }

    Ok(())
}
