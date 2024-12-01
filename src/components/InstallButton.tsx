import { Button } from "./ui/button";
import { Download } from "lucide-react";

interface InstallButtonProps {
  title: string;
  installing: boolean;
  onClick: () => void;
}

export function InstallButton({ title, installing, onClick }: InstallButtonProps) {
  return (
    <Button
      variant="default"
      className="relative overflow-hidden"
      disabled={installing}
      onClick={onClick}
    >
      <span className="flex items-center relative z-10">
        <Download className="mr-2 h-4 w-4" />
        {installing ? "安装中..." : `安装 ${title}`}
      </span>
      {installing && (
        <span className="absolute inset-0 overflow-hidden rounded-md">
          <span className="absolute inset-0 animate-progress-indeterminate bg-white/10" />
        </span>
      )}
    </Button>
  );
} 