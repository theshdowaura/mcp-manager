use crate::{claude_config, mcp_runner};
use std::time::Duration;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, Runtime,
};

// 创建状态菜单
fn create_status_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Menu<R>> {
    let mut menu_items = Vec::new();

    // 添加服务状态
    if let Ok(config) = claude_config::get_claude_config() {
        let mut services: Vec<_> = config.mcp_servers.keys().collect();
        services.sort();

        for name in services {
            let status_icon = if mcp_runner::get_server_status(name) {
                "运行中"
            } else {
                "已停止"
            };

            let service_item = MenuItem::with_id(
                app,
                format!("service_{}", name),
                format!("{} {}", name, status_icon),
                false, // 设为不可点击
                None::<&str>,
            )?;
            menu_items.push(service_item);
        }
    }

    // 添加 Show App 菜单项
    let show_app = MenuItem::with_id(app, "show_app", "Show App", true, None::<&str>)?;
    menu_items.push(show_app);

    // 添加 Quit 菜单项
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    menu_items.push(quit);

    let menu_item_refs: Vec<&dyn tauri::menu::IsMenuItem<R>> = menu_items
        .iter()
        .map(|item| item as &dyn tauri::menu::IsMenuItem<R>)
        .collect();
    Menu::with_items(app, &menu_item_refs)
}

// 创建托盘
pub fn create_tray<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let menu = create_status_menu(app)?;

    let tray = TrayIconBuilder::with_id("tray")
        .menu(&menu)
        .tooltip("tauri")
        .icon(app.default_window_icon().unwrap().clone())
        .on_menu_event(|app, event| {
            let id = event.id;
            if id == "show_app" {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            } else if id == "quit" {
                if let Err(e) = mcp_runner::stop_all_servers() {
                    eprintln!("Error stopping servers during shutdown: {}", e);
                }
                app.exit(0);
            }
        })
        .on_tray_icon_event(|tray, event| match event {
            TrayIconEvent::Click {
                id: _,
                position,
                rect: _,
                button,
                button_state: _,
            } => match button {
                MouseButton::Right => {
                    tray.app_handle()
                        .emit("tray_contextmenu", position)
                        .unwrap();
                }
                _ => {}
            },
            TrayIconEvent::Enter {
                id: _,
                position,
                rect: _,
            } => {
                tray.app_handle().emit("tray_mouseenter", position).unwrap();
            }
            TrayIconEvent::Leave {
                id: _,
                position,
                rect: _,
            } => {
                tray.app_handle().emit("tray_mouseleave", position).unwrap();
            }
            _ => {}
        })
        .build(app)?;

    // 添加定时刷新
    let app_handle = app.clone();
    let tray_handle = tray.clone();
    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_secs(5));
        if let Ok(new_menu) = create_status_menu(&app_handle) {
            let _ = tray_handle.set_menu(Some(new_menu));
        }
    });

    Ok(())
}

#[tauri::command]
pub fn update_tray_status<R: Runtime>(app: AppHandle<R>) -> tauri::Result<()> {
    if let Ok(new_menu) = create_status_menu(&app) {
        if let Some(tray) = app.tray_by_id("tray") {
            tray.set_menu(Some(new_menu))?;
        }
    }
    Ok(())
}
