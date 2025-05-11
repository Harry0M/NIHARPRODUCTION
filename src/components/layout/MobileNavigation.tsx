
// Using regular anchor tags for navigation to ensure full page refreshes
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
            <a 
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "/dashboard";
              }}
              className={`flex flex-col items-center justify-center w-full py-1 ${
                window.location.pathname === "/dashboard" ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <LayoutDashboard className="h-6 w-6 mb-1" />
              <span className="text-xs">Dashboard</span>
            </a>
          </li>
          <li className="flex items-center justify-center">
            <a 
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "/orders";
              }}
              className={`flex flex-col items-center justify-center w-full py-1 ${
                window.location.pathname.startsWith("/orders") ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Package className="h-6 w-6 mb-1" />
              <span className="text-xs">Orders</span>
            </a>
          </li>
          <li className="flex items-center justify-center">
            <a 
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "/production";
              }}
              className={`flex flex-col items-center justify-center w-full py-1 ${
                window.location.pathname === "/production" ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Factory className="h-6 w-6 mb-1" />
              <span className="text-xs">Production</span>
            </a>
          </li>
          <li className="flex items-center justify-center">
            <a 
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = "/production/job-cards";
              }}
              className={`flex flex-col items-center justify-center w-full py-1 ${
                window.location.pathname.startsWith("/production/job-cards") ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <FileText className="h-6 w-6 mb-1" />
              <span className="text-xs">Jobs</span>
            </a>
          </li>
          <li className="flex items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex flex-col items-center justify-center w-full py-1 text-muted-foreground focus:outline-none">
                <MoreHorizontal className="h-6 w-6 mb-1" />
                <span className="text-xs">More</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" className="w-56 mb-2">
                <DropdownMenuItem>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = "/partners";
                    }}
                    className="flex items-center gap-2 py-2 w-full"
                  >
                    Partners
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = "/inventory";
                    }}
                    className="flex items-center gap-2 py-2 w-full"
                  >
                    Inventory
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = "/settings";
                    }}
                    className="flex items-center gap-2 py-2 w-full"
                  >
                    Settings
                  </a>
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
