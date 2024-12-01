import { ClaudeConfig, ServerStatus } from '../types';
import { ServerCard } from "./ServerCard";

interface ServerListForConfigProps {
  mcpServers: ClaudeConfig['mcpServers'];
  serverStatus: ServerStatus;
  selectedPath: Record<string, string>;
  onSelectDirectory: (name: string) => void;
  onControlServer: (name: string, action: "start" | "stop") => void;
  onUninstallServer: (name: string) => void;
}

export function ServerListForConfig({
  mcpServers,
  serverStatus,
  selectedPath,
  onSelectDirectory,
  onControlServer,
  onUninstallServer,
}: ServerListForConfigProps) {
  return (
    <div className="grid gap-4">
      {Object.entries(mcpServers).map(([name, config]) => (
        <ServerCard
          key={name}
          name={name}
          command={config.command}
          args={config.args}
          status={serverStatus[name]}
          onStart={() => onControlServer(name, serverStatus[name] ? "stop" : "start")}
          onDelete={() => onUninstallServer(name)}
          onSelectDirectory={name === "filesystem" ? () => onSelectDirectory(name) : undefined}
          currentPath={name === "filesystem" ? config.args[config.args.length - 1] : undefined}
          selectedPath={name === "filesystem" ? selectedPath[name] : undefined}
        />
      ))}
    </div>
  );
} 