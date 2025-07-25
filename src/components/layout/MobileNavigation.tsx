// Mobile navigation component using React Router
import { 
  LayoutDashboard, 
  Package, 
  FileText,
  Factory,
  MoreHorizontal,
  Users,
  Truck,
  Database,
  ShoppingCart,
  BarChart,
  Building,
  Settings,
  TrendingUp
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MobileNavigation = () => {
  const location = useLocation();
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border h-16 px-4 md:hidden z-50">
      <nav className="h-full max-w-lg mx-auto">
        <ul className="grid grid-cols-5 gap-1 h-full">
          <li className="flex items-center justify-center">
            <Link 
              to="/dashboard"
              className={`flex flex-col items-center justify-center w-full py-1 ${
                location.pathname === "/dashboard" ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <LayoutDashboard className="h-6 w-6 mb-1" />
              <span className="text-xs">Dashboard</span>
            </Link>
          </li>
          <li className="flex items-center justify-center">
            <Link 
              to="/orders"
              className={`flex flex-col items-center justify-center w-full py-1 ${
                location.pathname.startsWith("/orders") ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Package className="h-6 w-6 mb-1" />
              <span className="text-xs">Orders</span>
            </Link>
          </li>
          <li className="flex items-center justify-center">
            <Link 
              to="/production/job-cards"
              className={`flex flex-col items-center justify-center w-full py-1 ${
                location.pathname.startsWith("/production/job-cards") ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <FileText className="h-6 w-6 mb-1" />
              <span className="text-xs">Job Cards</span>
            </Link>
          </li>
          <li className="flex items-center justify-center">
            <Link 
              to="/partners"
              className={`flex flex-col items-center justify-center w-full py-1 ${
                location.pathname.startsWith("/partners") ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Users className="h-6 w-6 mb-1" />
              <span className="text-xs">Partners</span>
            </Link>
          </li>
          <li className="flex items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex flex-col items-center justify-center w-full py-1 text-muted-foreground focus:outline-none">
                <MoreHorizontal className="h-6 w-6 mb-1" />
                <span className="text-xs">More</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" className="w-56 mb-2">
                <DropdownMenuItem>
                  <Link 
                    to="/companies"
                    className="flex items-center gap-2 py-2 w-full"
                  >
                    <Building className="h-4 w-4" />
                    Companies
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link 
                    to="/purchases"
                    className="flex items-center gap-2 py-2 w-full"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Purchases
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link 
                    to="/sells"
                    className="flex items-center gap-2 py-2 w-full"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Sells
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link 
                    to="/inventory"
                    className="flex items-center gap-2 py-2 w-full"
                  >
                    <Database className="h-4 w-4" />
                    Inventory
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link 
                    to="/production"
                    className="flex items-center gap-2 py-2 w-full"
                  >
                    <Factory className="h-4 w-4" />
                    Production
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link 
                    to="/analysis"
                    className="flex items-center gap-2 py-2 w-full"
                  >
                    <BarChart className="h-4 w-4" />
                    Analysis
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link 
                    to="/dispatch"
                    className="flex items-center gap-2 py-2 w-full"
                  >
                    <Truck className="h-4 w-4" />
                    Dispatch
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link 
                    to="/settings"
                    className="flex items-center gap-2 py-2 w-full"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
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
