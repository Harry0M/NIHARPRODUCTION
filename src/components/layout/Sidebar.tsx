import { useState, useEffect } from "react";
// Using NavLink for client-side routing without page refreshes
import { Link, useLocation } from "react-router-dom";
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
  Building,
  BarChart,
  TrendingUp,
  UserCog
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { RoleDisplay } from "@/components/RoleDisplay";

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, permission: "canAccessDashboard" },
  { name: "Orders", path: "/orders", icon: Package, permission: "canAccessOrders" },
  { name: "Job Cards", path: "/production/job-cards", icon: FileText, permission: "canAccessJobCards" },
  { name: "Vendor/Supplier", path: "/partners", icon: Users, permission: "canAccessPartners" },
  { name: "Sells Party", path: "/companies", icon: Building, permission: "canAccessCompanies" },
  { name: "Purchases", path: "/purchases", icon: ShoppingCart, permission: "canAccessPurchases" },
  { name: "Sells", path: "/sells", icon: TrendingUp, permission: "canAccessSells" },
  { name: "Inventory", path: "/inventory", icon: Database, permission: "canAccessInventory" },
  { name: "Production", path: "/production", icon: Factory, permission: "canAccessJobCards", subItems: [
    { name: "Printing", path: "/production/printing", permission: "canAccessPrintingJobs" },
    { name: "Cutting", path: "/production/cutting", permission: "canAccessCuttingJobs" },
    { name: "Stitching", path: "/production/stitching", permission: "canAccessStitchingJobs" }
  ]},
  { name: "Analysis", path: "/analysis", icon: BarChart, permission: "canAccessAnalysis" },
  { name: "Dispatch", path: "/dispatch", icon: Truck, permission: "canAccessJobCards" },
  { name: "User Management", path: "/settings/users", icon: UserCog, permission: "canManageUsers", adminOnly: true },
  { name: "Settings", path: "/settings", icon: Settings, permission: "canAccessDashboard" },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { signOut } = useAuth();
  const { hasPermission, isAdmin } = usePermissions();
  const location = useLocation();

  return (
    <div
      className={cn(
        "bg-sidebar/95 backdrop-blur-sm text-sidebar-foreground border-r border-border flex flex-col transition-all duration-300 shadow-lg",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        <h1 className={cn("font-bold text-lg transition-opacity", collapsed ? "opacity-0 w-0" : "opacity-100")}>
          Nihar
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
          {navItems.map((item) => {
            // Check if current path matches this navigation item using react-router's location
            const isActive = location.pathname.startsWith(item.path);
            
            // Check if user has permission for this nav item
            const hasRequiredPermission = hasPermission(item.permission as any);
            const isAdminOnlyItem = item.adminOnly && !isAdmin();
            
            // Hide nav item if user doesn't have permission or it's admin-only and user isn't admin
            if (!hasRequiredPermission || isAdminOnlyItem) {
              return null;
            }
            
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md transition-all duration-200",
                    isActive
                      ? "bg-sidebar-accent/80 text-sidebar-accent-foreground font-medium shadow-sm"
                      : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:shadow-sm"
                  )}
                >
                  <item.icon size={20} className={cn("flex-shrink-0", collapsed ? "mr-0" : "mr-3")} />
                  <span className={cn("transition-opacity", collapsed ? "opacity-0 w-0" : "opacity-100")}>
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className={cn("flex flex-col space-y-3", collapsed ? "items-center" : "")}>
          {!collapsed && (
            <div className="flex items-center justify-center">
              <RoleDisplay />
            </div>
          )}
          <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-2 ring-primary/20">
              <span className="font-medium text-sm">BM</span>
            </div>
            {!collapsed && (
              <div className="ml-3">
                <button 
                  onClick={signOut}
                  className="text-sm text-sidebar-foreground/80 hover:text-primary transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
