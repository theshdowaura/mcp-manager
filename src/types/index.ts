export interface McpServerConfig {
  command: string;
  args: string[];
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
  name: string;
  description: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
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