import { ServerCard } from "./ServerCard";
import type { ClaudeConfig, ServerStatus } from "../types";

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
  serverStatus,
  selectedPath,
  onSelectDirectory,
  onControlServer,
  onUninstallServer,
}: ClaudeConfigProps) {
  const sortedServers = Object.entries(claudeConfig.mcpServers).sort(
    ([a], [b]) => a.localeCompare(b)
  );

  return (
    <div className="grid gap-4">
      {sortedServers.map(([name, config]) => (
        <ServerCard
          key={name}
          name={name}
          command={config.command}
          args={config.args}
          status={serverStatus[name]}
          onStart={() =>
            onControlServer(name, serverStatus[name] ? "stop" : "start")
          }
          onDelete={() => onUninstallServer(name)}
          onSelectDirectory={
            name === "filesystem" ? () => onSelectDirectory(name) : undefined
          }
          currentPath={
            name === "filesystem"
              ? config.args[config.args.length - 1]
              : undefined
          }
          selectedPath={name === "filesystem" ? selectedPath[name] : undefined}
        />
      ))}
    </div>
  );
}
