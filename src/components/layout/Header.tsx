
import { Bell, Search, Plus, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Get user's role, default to 'production' if not set
  const userRole = user?.role || 'production';
  
  // Check if user has permissions to create resources
  const canCreateResources = ['admin', 'manager'].includes(userRole);
  
  // Check if user has specialized role for specific production stages
  const isCuttingSpecialist = userRole === 'cutting';
  const isPrintingSpecialist = userRole === 'printing';
  const isStitchingSpecialist = userRole === 'stitching';

  const getActionButton = () => {
    // Only show action buttons if user has appropriate permissions
    if (!canCreateResources && 
        !(location.pathname === '/production' && (isCuttingSpecialist || isPrintingSpecialist || isStitchingSpecialist))) {
      return null;
    }
    
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
    
    // Production specialists can quickly create jobs in their specialty
    if (location.pathname === '/production') {
      if (isCuttingSpecialist) {
        return (
          <Link to="/production/cutting/new">
            <Button size="sm" className="gap-1">
              <Plus size={16} />
              New Cutting Job
            </Button>
          </Link>
        );
      }
      
      if (isPrintingSpecialist) {
        return (
          <Link to="/production/printing/new">
            <Button size="sm" className="gap-1">
              <Plus size={16} />
              New Printing Job
            </Button>
          </Link>
        );
      }
      
      if (isStitchingSpecialist) {
        return (
          <Link to="/production/stitching/new">
            <Button size="sm" className="gap-1">
              <Plus size={16} />
              New Stitching Job
            </Button>
          </Link>
        );
      }
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
    
    if (location.pathname === '/inventory' && userRole === 'admin') {
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
    <header className="h-16 border-b border-border bg-background px-4 flex items-center justify-between">
      <div className="flex items-center gap-3 w-full max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search orders, jobs..."
            className="h-9 w-full rounded-md border border-input px-9 py-2 text-sm bg-background"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        {getActionButton()}
        
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
            {userRole && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </span>
            )}
          </span>
        )}
      </div>
    </header>
  );
};

export default Header;
