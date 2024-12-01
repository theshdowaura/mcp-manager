import { useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { ClaudeConfig } from '../types';

export function useClaudeConfig(
  onSelectDirectory: (templateName: string, selectedPath: string) => void
) {
  const checkClaudeConfig = useCallback(async () => {
    try {
      const config = await invoke<ClaudeConfig>("get_claude_config");
      return config;
    } catch (error) {
      console.error("Error loading Claude config:", error);
      return null;
    }
  }, []);

  const getConfigPath = useCallback(async () => {
    try {
      return await invoke<string>("get_config_path");
    } catch (error) {
      console.error("Error getting config path:", error);
      return "";
    }
  }, []);

  const selectDirectory = useCallback(async (templateName: string) => {
    try {
      const selected = await invoke<string | null>("select_folder");
      if (selected) {
        onSelectDirectory(templateName, selected);

        const config = await invoke<ClaudeConfig>("get_claude_config");
        if (config?.mcpServers[templateName]) {
          const serverConfig = config.mcpServers[templateName];
          const newArgs = serverConfig.args.map((arg) =>
            arg === "/Users/default/Desktop" ||
            arg === serverConfig.args[serverConfig.args.length - 1]
              ? selected
              : arg
          );

          await invoke("update_mcp_server_config", {
            name: templateName,
            config: {
              ...serverConfig,
              args: newArgs,
            },
          });

          await checkClaudeConfig();
        }
      }
    } catch (error) {
      console.error("Failed to select directory:", error);
    }
  }, [checkClaudeConfig, onSelectDirectory]);

  return {
    checkClaudeConfig,
    getConfigPath,
    selectDirectory,
  };
} 