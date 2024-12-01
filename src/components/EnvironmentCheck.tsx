import { Button } from "./ui/button";
import { Download } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "./ui/card";

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
  const handleInstall = async (type: string) => {
    try {
      await onInstall(type);
    } catch (error) {
      console.error(`Failed to install ${type}:`, error);
    }
  };

  return (
    <div className="space-y-6">
      {installMessage && (
        <div
          className={`rounded-md p-4 ${
            installMessage.includes("失败")
              ? "bg-destructive/10 text-destructive"
              : "bg-green-500/10 text-green-500"
          }`}
        >
          {installMessage}
        </div>
      )}

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Python 状态</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <p className="text-muted-foreground">{pythonPath}</p>
            {!pythonPath.includes("Python") && (
              <Button
                variant="outline"
                className="relative bg-[#1f1f1f] text-white border-2 border-[#1f1f1f] shadow-md hover:bg-[#2f2f2f] hover:border-[#2f2f2f] overflow-hidden"
                disabled={installing["python"]}
                onClick={() => handleInstall("python")}
              >
                <span className="flex items-center relative z-10">
                  <Download className="mr-2 h-4 w-4" />
                  {installing["python"] ? "安装中..." : "安装 Python"}
                </span>
                {installing["python"] && (
                  <span className="absolute inset-0">
                    <span className="absolute inset-0 animate-progress-indeterminate bg-white/10" />
                  </span>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Node.js 状态</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <p className="text-muted-foreground">{nodePath}</p>
            {!nodePath.includes("v") && (
              <Button
                variant="outline"
                className="relative bg-[#1f1f1f] text-white border-2 border-[#1f1f1f] shadow-md hover:bg-[#2f2f2f] hover:border-[#2f2f2f] overflow-hidden"
                disabled={installing["node"]}
                onClick={() => handleInstall("node")}
              >
                <span className="flex items-center relative z-10">
                  <Download className="mr-2 h-4 w-4" />
                  {installing["node"] ? "安装中..." : "安装 Node.js"}
                </span>
                {installing["node"] && (
                  <span className="absolute inset-0">
                    <span className="absolute inset-0 animate-progress-indeterminate bg-white/10" />
                  </span>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>UV 状态</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <p className="text-muted-foreground">{uvPath}</p>
            {!uvPath.includes("uv") && (
              <Button
                variant="outline"
                className="relative bg-[#1f1f1f] text-white border-2 border-[#1f1f1f] shadow-md hover:bg-[#2f2f2f] hover:border-[#2f2f2f] overflow-hidden"
                disabled={installing["uv"]}
                onClick={() => handleInstall("uv")}
              >
                <span className="flex items-center relative z-10">
                  <Download className="mr-2 h-4 w-4" />
                  {installing["uv"] ? "安装中..." : "安装 UV"}
                </span>
                {installing["uv"] && (
                  <span className="absolute inset-0">
                    <span className="absolute inset-0 animate-progress-indeterminate bg-white/10" />
                  </span>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Claude 状态</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <p className="text-muted-foreground">{claudeInstalled}</p>
            {claudeInstalled === "未安装" && (
              <Button
                variant="outline"
                className="relative bg-[#1f1f1f] text-white border-2 border-[#1f1f1f] shadow-md hover:bg-[#2f2f2f] hover:border-[#2f2f2f] overflow-hidden"
                disabled={installing["claude"]}
                onClick={() => handleInstall("claude")}
              >
                <span className="flex items-center relative z-10">
                  <Download className="mr-2 h-4 w-4" />
                  {installing["claude"] ? "安装中..." : "安装 Claude"}
                </span>
                {installing["claude"] && (
                  <span className="absolute inset-0">
                    <span className="absolute inset-0 animate-progress-indeterminate bg-white/10" />
                  </span>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
