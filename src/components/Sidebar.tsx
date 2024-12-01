import { NavLink } from "react-router-dom";
import { Home, Settings, Server } from "lucide-react";
import { cn } from "../lib/utils";

export function Sidebar() {
  return (
    <div className="w-64 h-screen bg-card border-r">
      <div className="p-6">
        <h1 className="text-xl font-semibold text-card-foreground">
          MCP Manager
        </h1>
      </div>
      <nav className="space-y-1 px-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              "flex items-center px-4 py-2 text-sm rounded-md transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )
          }
        >
          <Home className="mr-3 h-4 w-4" />
          状态
        </NavLink>
        <NavLink
          to="/config"
          className={({ isActive }) =>
            cn(
              "flex items-center px-4 py-2 text-sm rounded-md transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )
          }
        >
          <Settings className="mr-3 h-4 w-4" />
          Mcp 配置
        </NavLink>
        <NavLink
          to="/servers"
          className={({ isActive }) =>
            cn(
              "flex items-center px-4 py-2 text-sm rounded-md transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )
          }
        >
          <Server className="mr-3 h-4 w-4" />
          全部 MCP
        </NavLink>
      </nav>
    </div>
  );
}
