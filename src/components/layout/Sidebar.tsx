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
  ShoppingCart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { hasPermission } from "@/utils/roleAccess";

const getNavItems = (userRole: string) => {
  const allNavItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Orders", path: "/orders", icon: Package, feature: "orders" },
    { name: "Production", path: "/production", icon: Factory, feature: "production" },
    { name: "Job Cards", path: "/production/job-cards", icon: FileText, feature: "production" },
    { name: "Vendors", path: "/vendors", icon: Users, feature: "vendors" },
    { name: "Suppliers", path: "/suppliers", icon: ShoppingCart, feature: "suppliers" },
    { name: "Dispatch", path: "/dispatch", icon: Truck, feature: "orders" },
    { name: "Inventory", path: "/inventory", icon: Database, feature: "inventory" },
    { name: "Settings", path: "/settings", icon: Settings, feature: "settings" },
  ];

  return allNavItems.filter(item => !item.feature || hasPermission(userRole, item.feature));
};

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { signOut, user } = useAuth();
  const navItems = getNavItems(user?.role || 'production');

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
          {navItems.map((item) => (
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
            <div className="ml-3">
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
