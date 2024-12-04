use serde::{Deserialize, Serialize};
use serde_json;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{AppHandle, Wry};
use tauri_plugin_store::{Store, StoreBuilder};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InstalledMcpServer {
    pub id: String,
    pub name: String,
    pub command: String,
    pub args: Vec<String>,
    pub env: Option<HashMap<String, String>>,
    pub require_file_path: bool,
    pub repo_url: String,
}

const STORE_PATH: &str = ".mcp.servers.dat";
const SERVERS_KEY: &str = "installed_servers";

fn get_store(app: &AppHandle) -> Result<Arc<Store<Wry>>, String> {
    let path = PathBuf::from(STORE_PATH);
    StoreBuilder::new(app, path)
        .build()
        .map_err(|e| format!("Failed to create store: {}", e))
}

fn save_store(store: &Store<Wry>) -> Result<(), String> {
    store
        .save()
        .map_err(|e| format!("Failed to save store: {}", e))
}

#[tauri::command]
pub async fn save_installed_server(
    app: AppHandle,
    server: InstalledMcpServer,
) -> Result<(), String> {
    let store = get_store(&app)?;

    let mut servers: HashMap<String, InstalledMcpServer> = store
        .get(SERVERS_KEY)
        .and_then(|v| serde_json::from_value(v.clone()).ok())
        .unwrap_or_default();

    servers.insert(server.name.clone(), server);

    store.set(SERVERS_KEY.to_string(), serde_json::json!(servers));
    save_store(&store)?;

    Ok(())
}

#[tauri::command]
pub async fn get_installed_server(
    app: AppHandle,
    name: String,
) -> Result<Option<InstalledMcpServer>, String> {
    let store = get_store(&app)?;

    let servers: HashMap<String, InstalledMcpServer> = store
        .get(SERVERS_KEY)
        .and_then(|v| serde_json::from_value(v.clone()).ok())
        .unwrap_or_default();

    Ok(servers.get(&name).cloned())
}

#[tauri::command]
pub async fn remove_installed_server(app: AppHandle, name: String) -> Result<(), String> {
    let store = get_store(&app)?;

    let mut servers: HashMap<String, InstalledMcpServer> = store
        .get(SERVERS_KEY)
        .and_then(|v| serde_json::from_value(v.clone()).ok())
        .unwrap_or_default();

    servers.remove(&name);

    store.set(SERVERS_KEY.to_string(), serde_json::json!(servers));
    save_store(&store)?;

    Ok(())
}
