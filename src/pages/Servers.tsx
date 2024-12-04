import { McpServerTemplate, EnvInputs } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { LoadingIndicator } from "@/components/LoadingIndicator";

interface ServersPageProps {
  selectedPath: Record<string, string>;
  envInputs: EnvInputs;
  onSelectDirectory: (name: string) => void;
  onEnvInput: (serverName: string, key: string, value: string) => void;
  onInstallServer: (template: McpServerTemplate) => Promise<void>;
}

export function ServersPage({
  selectedPath,
  envInputs,
  onSelectDirectory,
  onEnvInput,
  onInstallServer,
}: ServersPageProps) {
  const [servers, setServers] = useState<McpServerTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [installedServers, setInstalledServers] = useState<Record<string, boolean>>({});
  const [installing, setInstalling] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching servers...');
      const response = await invoke<{total: number, list: McpServerTemplate[]}>('get_mcp_server_templates', {
        params: {
          page: 1,
          page_size: 100,
          keyword: null,
          require_file_path: null
        }
      });
      
      console.log('Server response:', response);

      if (!response) {
        throw new Error('Empty response from server');
      }

      if (!response.list) {
        throw new Error('Invalid response format: missing list property');
      }

      const installed: Record<string, boolean> = {};
      await Promise.all(response.list.map(async (server) => {
        try {
          const isInstalled = await invoke<boolean>('is_mcp_server_installed', { name: server.name });
          installed[server.name] = isInstalled;
        } catch (e) {
          console.error(`Failed to check installation status for ${server.name}:`, e);
          installed[server.name] = false;
        }
      }));

      console.log('Installation status:', installed);
      setInstalledServers(installed);
      setServers(response.list);
    } catch (error) {
      console.error('Failed to load servers:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to load servers');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (template: McpServerTemplate) => {
    try {
      setInstalling(prev => ({ ...prev, [template.name]: true }));
      
      let installTemplate = { ...template };

      if (template.require_file_path) {
        const path = selectedPath[template.name] || template.args[template.args.length - 1];
        console.log('Using path for installation:', path);
        installTemplate.args = [...template.args.slice(0, -1), path];
      }

      if (template.env) {
        installTemplate.env = {};
        Object.keys(template.env).forEach(key => {
          installTemplate.env![key] = envInputs[`${template.name}_${key}`] || template.env![key];
        });
      }

      console.log('Installing server with config:', installTemplate);
      
      await onInstallServer(installTemplate);
      
      await loadServers();
    } catch (error) {
      console.error('Failed to install server:', error);
    } finally {
      setInstalling(prev => ({ ...prev, [template.name]: false }));
    }
  };

  const isInstallDisabled = (template: McpServerTemplate) => {
    if (installing[template.name]) {
      return true;
    }

    if (installedServers[template.name]) {
      return true;
    }

    if (template.env) {
      return Object.keys(template.env).some(key => {
        const userInput = envInputs[`${template.name}_${key}`];
        const defaultValue = template.env![key];
        return !userInput && !defaultValue;
      });
    }

    return false;
  };

  if (loading) {
    return <PageLayout title="Available Servers">Loading servers...</PageLayout>;
  }

  if (error) {
    return (
      <PageLayout title="Available Servers">
        <div className="text-red-500">Error: {error}</div>
        <Button onClick={loadServers} className="mt-4">
          Retry
        </Button>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Available Servers">
      <div className="space-y-4 w-full max-w-5xl mx-auto">
        {servers.map((template) => (
          <Card key={template.id} className="border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold mb-1 truncate">{template.name}</h3>
                    <p className="text-sm text-muted-foreground break-words">
                      {template.description}
                    </p>
                  </div>
                  <div className="sm:ml-4 sm:flex-shrink-0 sm:w-32 flex items-center justify-end">
                    {loading ? (
                      <LoadingIndicator />
                    ) : installedServers[template.name] ? (
                      <div className="text-sm text-muted-foreground px-4 py-2 bg-accent rounded-md text-center">
                        Installed
                      </div>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => {
                          console.log('Install button clicked for:', template.name);
                          handleInstall(template);
                        }}
                        disabled={isInstallDisabled(template)}
                      >
                        {installing[template.name] ? 'Installing...' : 'Install Server'}
                      </Button>
                    )}
                  </div>
                </div>

                {!installedServers[template.name] && (
                  <div className="space-y-4">
                    {template.require_file_path && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          className="flex-1"
                          value={selectedPath[template.name] || template.args[template.args.length - 1]}
                          placeholder="Select directory"
                          readOnly
                        />
                        <Button 
                          variant="outline" 
                          className="sm:w-24"
                          onClick={() => {
                            console.log('Selecting directory for:', template.name);
                            onSelectDirectory(template.name);
                          }}
                        >
                          Browse
                        </Button>
                      </div>
                    )}

                    {template.env && (
                      <div className="space-y-2">
                        {Object.entries(template.env).map(([key, defaultValue]) => (
                          <div key={key} className="flex flex-col sm:flex-row gap-2 sm:items-center">
                            <label className="text-sm font-medium sm:w-48 flex-shrink-0">
                              {key}:
                            </label>
                            <Input
                              className="flex-1"
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageLayout>
  );
}
