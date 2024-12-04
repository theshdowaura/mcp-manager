import type { ClaudeConfig, ServerStatus } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { InstalledMcpServer } from "../types";

interface ClaudeConfigProps {
  claudeConfig: ClaudeConfig;
  serverStatus: ServerStatus;
  selectedPath: Record<string, string>;
  onSelectDirectory: (name: string) => void;
  onControlServer: (name: string, action: "start" | "stop") => void;
  onUninstallServer: (name: string) => void;
}

export function ClaudeConfig({
  claudeConfig,
  serverStatus: initialServerStatus,
  selectedPath,
  onSelectDirectory,
  onControlServer,
  onUninstallServer,
}: ClaudeConfigProps) {
  const [serverConfigs, setServerConfigs] = useState<Record<string, InstalledMcpServer>>({});
  const [envInputs, setEnvInputs] = useState<Record<string, string>>({});
  const [localServerStatus, setLocalServerStatus] = useState<ServerStatus>(initialServerStatus);

  // 先声明 sortedServers
  const sortedServers = Object.entries(claudeConfig.mcpServers).sort(
    ([a], [b]) => a.localeCompare(b)
  );

  // 然后在 useEffect 中使用
  useEffect(() => {
    const loadServerConfigs = async () => {
      try {
        const configs: Record<string, InstalledMcpServer> = {};
        for (const [name] of sortedServers) {
          const config = await invoke<InstalledMcpServer | null>(
            "get_installed_server",
            { name }
          );
          if (config) {
            configs[name] = config;
          }
        }
        setServerConfigs(configs);
      } catch (error) {
        console.error("Failed to load server configs:", error);
      }
    };

    loadServerConfigs();
  }, [sortedServers]);

  // 当父组件的状态变化时，更新本地状态
  useEffect(() => {
    setLocalServerStatus(initialServerStatus);
  }, [initialServerStatus]);

  const handleEnvChange = async (serverName: string, key: string, value: string) => {
    try {
      // 更新本地状态
      setEnvInputs(prev => ({
        ...prev,
        [`${serverName}_${key}`]: value
      }));

      // 获取当前服务器配置
      const serverConfig = serverConfigs[serverName];
      if (!serverConfig?.env) return;

      // 更新环境变量
      const newEnv = {
        ...serverConfig.env,
        [key]: value
      };

      // 创建新的配置
      const newConfig = {
        command: serverConfig.command,
        args: serverConfig.args,
        env: newEnv
      };

      // 保存到后端
      await invoke('update_mcp_server_config', {
        name: serverName,
        config: newConfig
      });
    } catch (error) {
      console.error('Failed to update env:', error);
    }
  };

  const handleControlServer = async (name: string, action: "start" | "stop") => {
    try {
      if (action === "stop") {
        // 先更新 UI 状态
        setLocalServerStatus(prev => ({
          ...prev,
          [name]: false
        }));
        
        // 停止服务器
        await invoke('stop_server', { name });
        
        // 等待一段时间确保服务器已停止
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 再次检查状态
        const status = await invoke<boolean>('get_server_status', { name });
        if (status) {
          console.error(`Server ${name} failed to stop`);
          // 恢复 UI 状态
          setLocalServerStatus(prev => ({
            ...prev,
            [name]: true
          }));
        }
      } else {
        await invoke('start_server', { name });
        setLocalServerStatus(prev => ({
          ...prev,
          [name]: true
        }));
      }

      // 通知父组件状态变化
      onControlServer(name, action);
    } catch (error) {
      console.error(`Failed to ${action} server:`, error);
    }
  };

  if (!claudeConfig || !claudeConfig.mcpServers) {
    return <div>No servers configured</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">MCP Servers</h2>
      <div className="space-y-4">
        {sortedServers.map(([name, config]) => {
          const serverConfig = serverConfigs[name];
          return (
            <Card key={name}>
              <CardContent className="p-6">
                <div className="flex flex-col space-y-4">
                  {/* 服务器名称和控制按钮 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold truncate">{name}</h3>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:w-auto">
                      <Button
                        variant={localServerStatus[name] ? "destructive" : "default"}
                        onClick={() =>
                          handleControlServer(
                            name,
                            localServerStatus[name] ? "stop" : "start"
                          )
                        }
                        className="w-full sm:w-24"
                      >
                        {localServerStatus[name] ? "Stop" : "Start"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => onUninstallServer(name)}
                        className="w-full sm:w-24"
                      >
                        Uninstall
                      </Button>
                    </div>
                  </div>

                  {/* 命令和参数显示 */}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                      <label className="text-sm font-medium sm:w-24 flex-shrink-0">
                        Command:
                      </label>
                      <div className="flex-1 bg-muted px-3 py-1 rounded-md text-sm break-all">
                        {config.command}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
                      <label className="text-sm font-medium sm:w-24 flex-shrink-0 sm:pt-1">
                        Args:
                      </label>
                      <div className="flex-1 bg-muted px-3 py-1 rounded-md text-sm break-all">
                        {config.args}
                      </div>
                    </div>

                    {/* 文件路径选择器 */}
                    {serverConfig?.require_file_path && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <label className="text-sm font-medium sm:w-24 flex-shrink-0">
                          Path:
                        </label>
                        <div className="flex-1 flex gap-2">
                          <Input
                            className="flex-1"
                            value={selectedPath[name] || config.args[config.args.length - 1]}
                            placeholder="Select directory"
                            readOnly
                          />
                          <Button 
                            variant="outline" 
                            className="sm:w-24"
                            onClick={() => onSelectDirectory(name)}
                          >
                            Browse
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* 环境变��编辑 */}
                    {config.env && (
                      <div className="space-y-2">
                        {Object.entries(config.env).map(([key, defaultValue]) => (
                          <div key={key} className="flex flex-col sm:flex-row gap-2 sm:items-center">
                            <label className="text-sm font-medium sm:w-48 flex-shrink-0">
                              {key}:
                            </label>
                            <Input
                              className="flex-1"
                              value={envInputs[`${name}_${key}`] || defaultValue}
                              onChange={(e) => handleEnvChange(name, key, e.target.value)}
                              placeholder={defaultValue}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
