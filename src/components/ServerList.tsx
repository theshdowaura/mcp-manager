import { AvailableServerCard } from "./AvailableServerCard";
import { McpServerTemplate, EnvInputs } from "../types";

interface ServerListProps {
  availableServers: McpServerTemplate[];
  selectedPath: Record<string, string>;
  envInputs: EnvInputs;
  onSelectDirectory: (name: string) => void;
  onEnvInput: (serverName: string, key: string, value: string) => void;
  onInstallServer: (template: McpServerTemplate) => void;
}

export function ServerList({
  availableServers,
  selectedPath,
  envInputs,
  onSelectDirectory,
  onEnvInput,
  onInstallServer,
}: ServerListProps) {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 auto-rows-fr">
      {availableServers.map((template) => (
        <AvailableServerCard
          key={template.name}
          name={template.name}
          description={template.description}
          command={template.command}
          args={template.args}
          installed={template.installed || false}
          env={template.env}
          selectedPath={selectedPath[template.name]}
          envInputs={envInputs}
          onSelectDirectory={() => onSelectDirectory(template.name)}
          onEnvInput={(key, value) => onEnvInput(template.name, key, value)}
          onInstall={() => onInstallServer(template)}
        />
      ))}
    </div>
  );
}
