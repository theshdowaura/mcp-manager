import { McpServerTemplate, EnvInputs } from "../types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";

interface ServersPageProps {
  availableServers: McpServerTemplate[];
  selectedPath: Record<string, string>;
  envInputs: EnvInputs;
  onSelectDirectory: (name: string) => void;
  onEnvInput: (serverName: string, key: string, value: string) => void;
  onInstallServer: (template: McpServerTemplate) => void;
}

export function ServersPage({
  availableServers,
  selectedPath,
  envInputs,
  onSelectDirectory,
  onEnvInput,
  onInstallServer,
}: ServersPageProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">可用的 MCP Servers</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {availableServers.map((template) => (
          <Card key={template.name} className="flex flex-col">
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                {template.description}
              </p>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Command:</p>
                  <p className="text-sm text-muted-foreground">
                    {template.command}
                  </p>
                </div>
                {template.name === "filesystem" && (
                  <div>
                    <p className="text-sm font-medium mb-2">选择目录:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 bg-background border rounded-md"
                        value={
                          selectedPath[template.name] ||
                          "/Users/default/Desktop"
                        }
                        readOnly
                        placeholder="点击选择目录"
                      />
                      <button
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        onClick={() => onSelectDirectory(template.name)}
                      >
                        选择
                      </button>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">Args:</p>
                  <p className="text-sm text-muted-foreground break-all">
                    {template.args
                      .map((arg) =>
                        arg === "/Users/default/Desktop" &&
                        template.name === "filesystem"
                          ? selectedPath[template.name] || arg
                          : arg
                      )
                      .join(" ")}
                  </p>
                </div>
                {template.env && (
                  <div>
                    <p className="text-sm font-medium mb-2">环境变量配置:</p>
                    <div className="space-y-2">
                      {Object.entries(template.env).map(
                        ([key, defaultValue]) => (
                          <div
                            key={key}
                            className="grid grid-cols-3 gap-2 items-center"
                          >
                            <label
                              htmlFor={`${template.name}_${key}`}
                              className="text-sm"
                            >
                              {key}:
                            </label>
                            <input
                              id={`${template.name}_${key}`}
                              className="col-span-2 px-3 py-2 bg-background border rounded-md"
                              placeholder={defaultValue}
                              value={envInputs[`${template.name}_${key}`] || ""}
                              onChange={(e) =>
                                onEnvInput(template.name, key, e.target.value)
                              }
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <div className="p-6 pt-0">
              {template.installed ? (
                <div className="text-sm text-muted-foreground text-center py-2 bg-accent rounded-md">
                  已安装
                </div>
              ) : (
                <button
                  className="w-full py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                  onClick={() => onInstallServer(template)}
                  disabled={
                    template.env &&
                    Object.keys(template.env).some(
                      (key) => !envInputs[`${template.name}_${key}`]
                    )
                  }
                >
                  安装此 Server
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
