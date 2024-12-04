export interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string> | null;
}

export interface ClaudeConfig {
  mcpServers: Record<string, McpServerConfig>;
  globalShortcut: string;
}

export interface McpServerArgs {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface McpServerTemplate {
  id: string;
  name: string;
  description: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  require_file_path: boolean;
  repo_url: string;
  created_at: string;
  updated_at: string;
  downloads: number;
  total_usage_time: number;
  installed?: boolean;
}

export interface EnvInputs {
  [key: string]: string;
}

export interface ServerStatus {
  [key: string]: boolean;
}

export interface EnvCheckResult {
  is_installed: boolean;
  version: string;
  install_url: string;
}

export interface ClaudeCheckResult {
  is_installed: boolean;
  install_url: string;
}

export interface InstallResult {
  success: boolean;
  pythonPath: string;
  nodePath: string;
  uvPath: string;
  message?: string;
}

export interface InstalledMcpServer {
  id: string;
  name: string;
  command: string;
  args: string[];
  env: Record<string, string> | null;
  require_file_path: boolean;
  repo_url: string;
} 