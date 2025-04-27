
import { Bell, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const { user } = useAuth();
  const location = useLocation();

  const getActionButton = () => {
    if (location.pathname === '/orders') {
      return (
        <Link to="/orders/new">
          <Button size="sm" className="gap-1">
            <Plus size={16} />
            New Order
          </Button>
        </Link>
      );
    }
    
    if (location.pathname === '/production/job-cards') {
      return (
        <Link to="/production/job-cards/new">
          <Button size="sm" className="gap-1">
            <Plus size={16} />
            New Job Card
          </Button>
        </Link>
      );
    }
    
    if (location.pathname === '/vendors') {
      return (
        <Link to="/vendors/new">
          <Button size="sm" className="gap-1">
            <Plus size={16} />
            New Vendor
          </Button>
        </Link>
      );
    }
    
    if (location.pathname === '/suppliers') {
      return (
        <Link to="/suppliers/new">
          <Button size="sm" className="gap-1">
            <Plus size={16} />
            New Supplier
          </Button>
        </Link>
      );
    }
    
    if (location.pathname === '/inventory') {
      return (
        <Link to="/inventory/new">
          <Button size="sm" className="gap-1">
            <Plus size={16} />
            New Item
          </Button>
        </Link>
      );
    }
    
    return null;
  };

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur-sm px-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3 w-full max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search Nihar orders, jobs..."
            className="h-9 w-full rounded-md border border-input px-9 py-2 text-sm bg-background/50"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        {getActionButton()}
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive"></span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <h3 className="font-medium">Notifications</h3>
              <Button variant="ghost" size="sm">Mark all as read</Button>
            </div>
            <div className="py-2 max-h-80 overflow-y-auto">
              <div className="px-4 py-3 hover:bg-muted cursor-pointer">
                <p className="text-sm font-medium">Order #2023-045 is ready for dispatch</p>
                <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
              </div>
              <div className="px-4 py-3 hover:bg-muted cursor-pointer">
                <p className="text-sm font-medium">Printing job completed for Job Card #JC-2023-012</p>
                <p className="text-xs text-muted-foreground mt-1">5 hours ago</p>
              </div>
            </div>
            <div className="border-t px-4 py-2">
              <Button variant="outline" size="sm" className="w-full">View all notifications</Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {user && (
          <span className="text-sm hidden md:inline-block">
            {user.email}
          </span>
        )}
      </div>
    </header>
  );
};

export default Header;
