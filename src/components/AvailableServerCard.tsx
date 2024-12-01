import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Download } from "lucide-react";

interface AvailableServerCardProps {
  name: string;
  description: string;
  command: string;
  args: string[];
  installed: boolean;
  env?: Record<string, string>;
  selectedPath?: string;
  envInputs: Record<string, string>;
  onSelectDirectory?: () => void;
  onEnvInput?: (key: string, value: string) => void;
  onInstall: () => void;
}

export function AvailableServerCard({
  name,
  description,
  command,
  args,
  installed,
  env,
  selectedPath,
  envInputs,
  onSelectDirectory,
  onEnvInput,
  onInstall,
}: AvailableServerCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-none">
        <div>
          <CardTitle className="text-xl font-bold">{name}</CardTitle>
          <CardDescription className="line-clamp-2">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-4 flex-1">
          <div className="grid gap-2">
            <div>
              <p className="text-sm font-medium">Command:</p>
              <p className="text-sm text-muted-foreground truncate">{command}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Args:</p>
              <p className="text-sm text-muted-foreground break-all">
                {args.map((arg) =>
                  arg === "/Users/default/Desktop" && name === "filesystem"
                    ? selectedPath || arg
                    : arg
                ).join(" ")}
              </p>
            </div>
          </div>

          {name === "filesystem" && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">选择目录:</p>
              <div className="flex space-x-2">
                <Input
                  value={selectedPath || "/Users/default/Desktop"}
                  readOnly
                  placeholder="点击选择目录"
                />
                <Button variant="outline" onClick={onSelectDirectory}>
                  选择
                </Button>
              </div>
            </div>
          )}

          {env && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">环境变量配置:</p>
              {Object.entries(env).map(([key, defaultValue]) => (
                <div key={key} className="grid grid-cols-3 gap-2 items-center">
                  <label htmlFor={`${name}_${key}`} className="text-sm truncate">
                    {key}:
                  </label>
                  <Input
                    id={`${name}_${key}`}
                    className="col-span-2"
                    placeholder={defaultValue}
                    value={envInputs[`${name}_${key}`] || ""}
                    onChange={(e) => onEnvInput?.(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          className="w-full mt-6"
          onClick={onInstall}
          disabled={installed || (
            env &&
            Object.keys(env).some(
              (key) => !envInputs[`${name}_${key}`]
            )
          )}
        >
          {installed ? (
            <span className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              已安装
            </span>
          ) : (
            "安装此 Server"
          )}
        </Button>
      </CardContent>
    </Card>
  );
} 