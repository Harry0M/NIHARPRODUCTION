
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  FileText,
  Layers,
  Settings 
} from "lucide-react";

const MobileNavigation = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border h-16 px-4 md:hidden">
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
            <NavLink 
              to="/settings" 
              className={({ isActive }) => `flex flex-col items-center justify-center w-full py-1 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Settings className="h-5 w-5" />
              <span className="text-xs mt-1">Settings</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default MobileNavigation;
