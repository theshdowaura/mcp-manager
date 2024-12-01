import { Button } from "./ui/button";
import { Play, Trash2, FolderOpen } from "lucide-react";

interface ServerControlsProps {
  status: boolean;
  onStart: () => void;
  onDelete: () => void;
  onSelectDirectory?: () => void;
  showDirectorySelect?: boolean;
}

export function ServerControls({
  status,
  onStart,
  onDelete,
  onSelectDirectory,
  showDirectorySelect,
}: ServerControlsProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant={status ? "destructive" : "default"}
        size="sm"
        onClick={onStart}
      >
        <Play className="h-4 w-4 mr-2" />
        {status ? "停止" : "启动"}
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        删除
      </Button>
      {showDirectorySelect && !status && onSelectDirectory && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onSelectDirectory}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          选择目录
        </Button>
      )}
    </div>
  );
} 