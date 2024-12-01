import { HotkeyInput } from "../components/HotkeyInput";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { ClaudeConfig as ClaudeConfigComponent } from "../components/ClaudeConfig";
import type { ClaudeConfig, ServerStatus } from "../types";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useClaudeConfig } from "../hooks/useClaudeConfig";

interface ConfigPageProps {
  claudeConfig: ClaudeConfig | null;
  configPath: string;
  serverStatus: ServerStatus;
  selectedPath: Record<string, string>;
  onSelectDirectory: (name: string) => void;
  onControlServer: (name: string, action: "start" | "stop") => void;
  onUninstallServer: (name: string) => void;
  onConfigChange: (config: ClaudeConfig | null) => void;
}

export function ConfigPage({
  claudeConfig,
  configPath,
  serverStatus,
  selectedPath,
  onSelectDirectory,
  onControlServer,
  onUninstallServer,
  onConfigChange,
}: ConfigPageProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { checkClaudeConfig } = useClaudeConfig((templateName) => {
    onSelectDirectory(templateName);
  });

  const handleHotkeyChange = async (hotkey: string) => {
    try {
      setIsUpdating(true);
      await invoke("update_global_shortcut_command", { shortcut: hotkey });
      const newConfig = await checkClaudeConfig();
      onConfigChange(newConfig);
    } catch (error) {
      console.error("Failed to update global shortcut:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>配置文件路径</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground break-all">
              {configPath}
            </p>
          </CardContent>
        </Card>
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>全局快捷键</CardTitle>
          </CardHeader>
          <CardContent>
            <HotkeyInput
              value={claudeConfig?.globalShortcut || ""}
              onChange={handleHotkeyChange}
              disabled={isUpdating}
            />
            {isUpdating && (
              <p className="text-sm text-muted-foreground mt-2">
                正在更新快捷键...
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {claudeConfig && (
        <div className="mt-8">
          <ClaudeConfigComponent
            claudeConfig={claudeConfig}
            serverStatus={serverStatus}
            selectedPath={selectedPath}
            onSelectDirectory={onSelectDirectory}
            onControlServer={onControlServer}
            onUninstallServer={onUninstallServer}
          />
        </div>
      )}
    </div>
  );
}
