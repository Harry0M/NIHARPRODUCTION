
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { 
  Package, 
  Layers, 
  LayoutDashboard, 
  Users, 
  Truck, 
  Database, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Factory,
  FileText,
  ShoppingCart,
  Scissors,
  Printer,
  Needle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

// Define nav items with role-based access
const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ['admin', 'manager', 'production', 'vendor', 'cutting', 'printing', 'stitching'] },
  { name: "Orders", path: "/orders", icon: Package, roles: ['admin', 'manager', 'production', 'vendor', 'cutting', 'printing', 'stitching'] },
  
  // Production section
  { name: "Production", path: "/production", icon: Factory, roles: ['admin', 'manager', 'production', 'cutting', 'printing', 'stitching'] },
  { name: "Job Cards", path: "/production/job-cards", icon: FileText, roles: ['admin', 'manager', 'production', 'cutting', 'printing', 'stitching'] },
  
  // Stage-specific shortcuts for specialized roles
  { name: "Cutting Jobs", path: "/production?tab=cutting", icon: Scissors, roles: ['admin', 'manager', 'production', 'cutting'] },
  { name: "Printing Jobs", path: "/production?tab=printing", icon: Printer, roles: ['admin', 'manager', 'production', 'printing'] },
  { name: "Stitching Jobs", path: "/production?tab=stitching", icon: Needle, roles: ['admin', 'manager', 'production', 'stitching'] },
  
  { name: "Vendors", path: "/vendors", icon: Users, roles: ['admin', 'manager'] },
  { name: "Suppliers", path: "/suppliers", icon: ShoppingCart, roles: ['admin', 'manager'] },
  { name: "Dispatch", path: "/dispatch", icon: Truck, roles: ['admin', 'manager', 'production'] },
  { name: "Inventory", path: "/inventory", icon: Database, roles: ['admin'] },
  { name: "Settings", path: "/settings", icon: Settings, roles: ['admin'] },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { signOut, user } = useAuth();
  
  // Get user's role, default to 'production' if not set
  const userRole = user?.role || 'production';
  
  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <div
      className={cn(
        "bg-sidebar text-sidebar-foreground border-r border-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        <h1 className={cn("font-bold text-lg transition-opacity", collapsed ? "opacity-0 w-0" : "opacity-100")}>
          BagMaster Pro
        </h1>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {filteredNavItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-3 py-2 rounded-md transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80"
                  )
                }
              >
                <item.icon size={20} className={cn("flex-shrink-0", collapsed ? "mr-0" : "mr-3")} />
                <span className={cn("transition-opacity", collapsed ? "opacity-0 w-0" : "opacity-100")}>
                  {item.name}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-border">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <span className="font-medium text-sm">BM</span>
          </div>
          {!collapsed && (
            <div className="ml-3 flex flex-col">
              {user && (
                <span className="text-xs font-medium text-sidebar-foreground mb-1">
                  Role: {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </span>
              )}
              <button 
                onClick={signOut}
                className="text-sm text-sidebar-foreground hover:text-primary transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
