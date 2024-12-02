import { McpServerTemplate, EnvInputs } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <PageLayout title="Available Servers">
      <div className="space-y-4">
        {availableServers.map((template) => (
          <Card key={template.name} className="border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-1">{template.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                </div>
                {template.installed ? (
                  <div className="text-sm text-muted-foreground px-4 py-2 bg-accent rounded-md">
                    Installed
                  </div>
                ) : (
                  <Button
                    onClick={() => onInstallServer(template)}
                    disabled={
                      template.env &&
                      Object.keys(template.env).some(
                        (key) => !envInputs[`${template.name}_${key}`]
                      )
                    }
                  >
                    Install Server
                  </Button>
                )}
              </div>

              {!template.installed && (
                <div className="space-y-4">
                  {template.name === "filesystem" && (
                    <div className="flex gap-2">
                      <Input
                        value={selectedPath[template.name] || "/Users/default/Desktop"}
                        placeholder="Select directory"
                        readOnly
                      />
                      <Button variant="outline" onClick={() => onSelectDirectory(template.name)}>
                        Browse
                      </Button>
                    </div>
                  )}

                  {template.env && (
                    <div className="space-y-2">
                      {Object.entries(template.env).map(([key, defaultValue]) => (
                        <div key={key} className="flex gap-2 items-center">
                          <label className="text-sm font-medium min-w-[120px]">
                            {key}:
                          </label>
                          <Input
                            value={envInputs[`${template.name}_${key}`] || ""}
                            onChange={(e) =>
                              onEnvInput(template.name, key, e.target.value)
                            }
                            placeholder={defaultValue}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </PageLayout>
  );
}
