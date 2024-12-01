mod claude_config;
mod env_check;
mod mcp_runner;
mod mcp_servers;
mod tray;

use claude_config::{
    get_claude_config, get_config_path, restore_config_backup, save_claude_config,
    update_global_shortcut_command,
};
use env_check::{
    check_claude_installed, get_node_path, get_python_path, get_uv_path, install_environment,
};
use mcp_runner::{get_server_status, start_server, stop_server};
use mcp_servers::{
    get_mcp_server_templates, install_mcp_server, is_mcp_server_installed, select_folder,
    uninstall_mcp_server, update_mcp_server_config,
};
use std::time::Duration;
use tauri::Runtime;
use tauri::{AppHandle, Manager, WindowEvent};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_handle = app.handle();
            let main_window = app_handle.get_webview_window("main").unwrap();

            // 设置窗口关闭事件
            main_window.on_window_event(move |event| {
                if let WindowEvent::CloseRequested { .. } = event {
                    if let Err(e) = mcp_runner::stop_all_servers() {
                        eprintln!("Error stopping servers during shutdown: {}", e);
                    }
                }
            });

            // 创建系统托盘
            if let Err(e) = tray::create_tray(&app_handle) {
                eprintln!("Failed to create tray: {}", e);
            }

            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_python_path,
            get_node_path,
            get_uv_path,
            get_claude_config,
            get_config_path,
            check_claude_installed,
            get_mcp_server_templates,
            install_mcp_server,
            uninstall_mcp_server,
            is_mcp_server_installed,
            restore_config_backup,
            save_claude_config,
            get_server_status,
            start_server,
            stop_server,
            select_folder,
            update_mcp_server_config,
            install_environment,
            update_global_shortcut_command,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
pub fn setup_status_checker<R: Runtime>(app_handle: AppHandle<R>) {
    std::thread::spawn(move || loop {
        if let Err(e) = tray::update_tray_status(app_handle.clone()) {
            eprintln!("Failed to update tray status: {}", e);
        }
        std::thread::sleep(Duration::from_secs(30));
    });
}
