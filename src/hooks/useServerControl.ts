import { useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import type { McpServerTemplate } from '../types';

export function useServerControl(
  onConfigUpdate: () => Promise<void>,
  onServersUpdate: () => Promise<void>,
  onTemplatesUpdate: () => Promise<void>,
  envInputs: Record<string, string>
) {
  const installServer = useCallback(
    async (template: McpServerTemplate) => {
      try {
        if (template.name === "filesystem") {
          const selectedPath = await invoke<string | null>("select_folder");
          if (!selectedPath) {
            return;
          }
          template.args = template.args.map((arg: string) =>
            arg === "/Users/default/Desktop" ? selectedPath : arg
          );
        }

        const serverEnv: Record<string, string> = {};
        if (template.env) {
          Object.keys(template.env).forEach((key) => {
            const value = envInputs[`${template.name}_${key}`];
            if (value) {
              serverEnv[key] = value;
            }
          });
        }

        await invoke("install_mcp_server", {
          template: {
            ...template,
            env: template.env ? serverEnv : undefined,
          },
        });

        await Promise.all([
          onConfigUpdate(),
          onServersUpdate(),
          onTemplatesUpdate(),
        ]);

        console.log(`Successfully installed ${template.name}`);
      } catch (error) {
        console.error("Error installing MCP server:", error);
        console.error(`Failed to install ${template.name}`);
      }
    },
    [onConfigUpdate, onServersUpdate, onTemplatesUpdate, envInputs]
  );

  const uninstallServer = useCallback(
    async (name: string) => {
      try {
        await invoke("uninstall_mcp_server", { name });
        await Promise.all([
          onConfigUpdate(),
          onServersUpdate(),
          onTemplatesUpdate(),
        ]);
        console.log(`Successfully uninstalled ${name}`);
      } catch (error) {
        console.error("Error uninstalling MCP server:", error);
      }
    },
    [onConfigUpdate, onServersUpdate, onTemplatesUpdate]
  );

  const controlServer = useCallback(
    async (name: string, action: "start" | "stop") => {
      try {
        if (action === "start") {
          await invoke("start_server", { name });
          await new Promise(resolve => setTimeout(resolve, 500));
          const status = await invoke<boolean>("get_server_status", { name });
          if (!status) {
            throw new Error("Server failed to start");
          }
        } else {
          await invoke("stop_server", { name });
        }
        await onConfigUpdate();
      } catch (error) {
        console.error(`Error ${action}ing server:`, error);
      }
    },
    [onConfigUpdate]
  );

  return {
    installServer,
    uninstallServer,
    controlServer,
  };
} 