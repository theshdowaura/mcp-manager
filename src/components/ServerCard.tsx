import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

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
  args,
  status,
  onStart,
  onDelete,
  onSelectDirectory,
  currentPath,
  selectedPath,
}: ServerCardProps) {
  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold mb-1">{name}</h3>
            <p className="text-sm text-muted-foreground">
              Path: {currentPath || args[args.length - 1]}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={status ? "destructive" : "default"}
              onClick={onStart}
            >
              {status ? "Stop" : "Start"}
            </Button>
            <Button variant="outline" onClick={onDelete}>
              Uninstall
            </Button>
          </div>
        </div>

        {onSelectDirectory && !status && (
          <div className="flex gap-2 mt-4">
            <Input
              value={selectedPath || ""}
              placeholder="Select directory"
              readOnly
            />
            <Button variant="outline" onClick={onSelectDirectory}>
              Browse
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
