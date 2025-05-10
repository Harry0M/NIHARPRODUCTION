
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  FileText,
  Factory,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MobileNavigation = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border h-16 px-4 md:hidden z-50">
      <nav className="h-full max-w-lg mx-auto">
        <ul className="grid grid-cols-5 gap-1 h-full">
          <li className="flex items-center justify-center">
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => `flex flex-col items-center justify-center w-full py-1 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <LayoutDashboard className="h-6 w-6 mb-1" />
              <span className="text-xs">Dashboard</span>
            </NavLink>
          </li>
          <li className="flex items-center justify-center">
            <NavLink 
              to="/orders" 
              className={({ isActive }) => `flex flex-col items-center justify-center w-full py-1 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Package className="h-6 w-6 mb-1" />
              <span className="text-xs">Orders</span>
            </NavLink>
          </li>
          <li className="flex items-center justify-center">
            <NavLink 
              to="/production" 
              className={({ isActive }) => `flex flex-col items-center justify-center w-full py-1 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Factory className="h-6 w-6 mb-1" />
              <span className="text-xs">Production</span>
            </NavLink>
          </li>
          <li className="flex items-center justify-center">
            <NavLink 
              to="/production/job-cards" 
              className={({ isActive }) => `flex flex-col items-center justify-center w-full py-1 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <FileText className="h-6 w-6 mb-1" />
              <span className="text-xs">Jobs</span>
            </NavLink>
          </li>
          <li className="flex items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex flex-col items-center justify-center w-full py-1 text-muted-foreground focus:outline-none">
                <MoreHorizontal className="h-6 w-6 mb-1" />
                <span className="text-xs">More</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" className="w-56 mb-2">
                <DropdownMenuItem asChild>
                  <NavLink to="/partners" className="flex items-center gap-2 py-2">
                    Partners
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <NavLink to="/inventory" className="flex items-center gap-2 py-2">
                    Inventory
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <NavLink to="/settings" className="flex items-center gap-2 py-2">
                    Settings
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
