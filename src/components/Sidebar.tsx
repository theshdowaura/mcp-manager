import { NavLink } from "react-router-dom";
import { Home, Settings, Database } from "lucide-react";

export function Sidebar() {
  return (
    <div className="w-48 min-h-screen bg-muted/40 border-r">
      <div className="p-4">
        <h1 className="text-xl font-bold">MCP Manager</h1>
      </div>
      <nav className="space-y-1 px-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
              isActive
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`
          }
        >
          <Home size={18} />
          Status
        </NavLink>
        <NavLink
          to="/config"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
              isActive
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`
          }
        >
          <Settings size={18} />
          Config
        </NavLink>
        <NavLink
          to="/servers"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
              isActive
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`
          }
        >
          <Database size={18} />
          Servers
        </NavLink>
      </nav>
    </div>
  );
}
