import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface ServerCardProps {
  name: string;
  command: string;
  args: string[];
  status: boolean;
  onStart: () => void;
  onDelete: () => void;
  onSelectDirectory?: () => void;
  currentPath?: string;
  selectedPath?: string;
}

export function ServerCard({
  name,
  command,
  args,
  status,
  onStart,
  onDelete,
  onSelectDirectory,
  currentPath,
  selectedPath,
}: ServerCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">{name}</CardTitle>
        <Badge variant={status ? "success" : "secondary"}>
          {status ? "运行中" : "已停止"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">Command:</p>
            <p className="text-sm text-muted-foreground">{command}</p>
          </div>
          {currentPath && (
            <div>
              <p className="text-sm font-medium">当前目录:</p>
              <p className="text-sm text-muted-foreground">{currentPath}</p>
              {selectedPath && !status && (
                <p className="text-sm text-muted-foreground mt-1">
                  新选择的目录: {selectedPath}
                </p>
              )}
            </div>
          )}
          <div>
            <p className="text-sm font-medium">Args:</p>
            <p className="text-sm text-muted-foreground">{args.join(" ")}</p>
          </div>
          <div className="flex space-x-2">
            {onSelectDirectory && !status && (
              <Button variant="outline" onClick={onSelectDirectory}>
                选择目录
              </Button>
            )}
            <Button
              variant={status ? "destructive" : "default"}
              onClick={onStart}
            >
              {status ? "停止" : "启动"}
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              删除
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 