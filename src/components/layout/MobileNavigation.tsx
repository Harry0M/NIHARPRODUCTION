
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  FileText,
  Layers,
  MoreHorizontal,
  Users,
  Building,
  ShoppingCart,
  Settings
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MobileNavigation = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border h-16 px-4 md:hidden">
      <nav className="h-full max-w-lg mx-auto">
        <ul className="grid grid-cols-5 gap-1 h-full">
          <li className="flex items-center justify-center">
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => `flex flex-col items-center justify-center w-full py-1 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="text-xs mt-1">Dashboard</span>
            </NavLink>
          </li>
          <li className="flex items-center justify-center">
            <NavLink 
              to="/orders" 
              className={({ isActive }) => `flex flex-col items-center justify-center w-full py-1 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Package className="h-5 w-5" />
              <span className="text-xs mt-1">Orders</span>
            </NavLink>
          </li>
          <li className="flex items-center justify-center">
            <NavLink 
              to="/production/job-cards" 
              className={({ isActive }) => `flex flex-col items-center justify-center w-full py-1 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs mt-1">Jobs</span>
            </NavLink>
          </li>
          <li className="flex items-center justify-center">
            <NavLink 
              to="/inventory" 
              className={({ isActive }) => `flex flex-col items-center justify-center w-full py-1 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Layers className="h-5 w-5" />
              <span className="text-xs mt-1">Inventory</span>
            </NavLink>
          </li>
          <li className="flex items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex flex-col items-center justify-center w-full py-1 text-muted-foreground focus:outline-none">
                <MoreHorizontal className="h-5 w-5" />
                <span className="text-xs mt-1">More</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" className="w-48 mb-2">
                <DropdownMenuItem asChild>
                  <NavLink to="/vendors" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Vendors</span>
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <NavLink to="/companies" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span>Companies</span>
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <NavLink to="/suppliers" className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    <span>Suppliers</span>
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <NavLink to="/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </NavLink>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default MobileNavigation;
