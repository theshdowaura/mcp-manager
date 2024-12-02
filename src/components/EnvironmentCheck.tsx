import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

interface EnvironmentCheckProps {
  pythonPath: string;
  nodePath: string;
  uvPath: string;
  claudeInstalled: string;
  installing: Record<string, boolean>;
  onInstall: (type: string) => Promise<void>;
  installMessage: string;
}

export function EnvironmentCheck({
  pythonPath,
  nodePath,
  uvPath,
  claudeInstalled,
  installing,
  onInstall,
  installMessage,
}: EnvironmentCheckProps) {
  const environments = [
    { 
      name: "Python", 
      path: pythonPath, 
      type: "python",
      isInstalled: pythonPath.includes("Python")
    },
    { 
      name: "Node.js", 
      path: nodePath, 
      type: "node",
      isInstalled: nodePath.includes("v")
    },
    { 
      name: "UV", 
      path: uvPath, 
      type: "uv",
      isInstalled: uvPath.includes("uv")
    },
    { 
      name: "Claude", 
      path: claudeInstalled, 
      type: "claude",
      isInstalled: claudeInstalled !== "未安装"
    },
  ];

  return (
    <div className="space-y-4">
      {environments.map(({ name, path, type, isInstalled }) => (
        <Card key={type} className="border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-1">{name}</h3>
                <p className="text-sm text-muted-foreground">
                  {path || "Not installed"}
                </p>
              </div>
              {!isInstalled && (
                <Button
                  onClick={() => onInstall(type)}
                  disabled={installing[type]}
                >
                  {installing[type] ? "Installing..." : `Install ${name}`}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      
      {installing && Object.values(installing).some(Boolean) && (
        <p className="text-sm text-muted-foreground mt-2">
          {installMessage}
        </p>
      )}
    </div>
  );
}
