
import { Bell, Search, Plus, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "react-router-dom";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { KeyboardShortcutsDialog } from "@/components/keyboard/KeyboardShortcutsDialog";
import { useState } from "react";
import { KeyboardShortcutsHelp } from "@/components/keyboard/KeyboardShortcutsHelp";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { KeyboardShortcut } from "@/components/ui/keyboard-shortcut";

const Header = () => {
  const { user } = useAuth();
  const location = useLocation();
  const searchRef = useRef<HTMLInputElement>(null);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  
  // Setup keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not in an input/textarea
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Search shortcut
      if (e.key === "/" && searchRef.current) {
        e.preventDefault();
        searchRef.current.focus();
      }
      
      // Show keyboard shortcuts help
      if (e.key === "?") {
        e.preventDefault();
        setShowKeyboardShortcuts(true);
      }
      
      // Navigation shortcuts (g + key)
      if (e.key === "g") {
        const handleSecondKey = (e2: KeyboardEvent) => {
          if (e2.key === "d") window.location.href = "/dashboard";
          if (e2.key === "o") window.location.href = "/orders";
          if (e2.key === "p") window.location.href = "/production";
          if (e2.key === "j") window.location.href = "/production/job-cards";
          
          document.removeEventListener("keydown", handleSecondKey);
        };
        
        // Listen for the second key
        document.addEventListener("keydown", handleSecondKey, { once: true });
      }
      
      // Create new shortcuts (n + key)
      if (e.key === "n") {
        const handleSecondKey = (e2: KeyboardEvent) => {
          if (e2.key === "o") window.location.href = "/orders/new";
          if (e2.key === "j") window.location.href = "/production/job-cards/new";
          
          document.removeEventListener("keydown", handleSecondKey);
        };
        
        // Listen for the second key
        document.addEventListener("keydown", handleSecondKey, { once: true });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getActionButton = () => {
    if (location.pathname === '/orders') {
      return (
        <Button 
          size="sm" 
          className="gap-1"
          onClick={() => { window.location.href = '/orders/new'; }}
        >
          <Plus size={16} />
          New Order
        </Button>
      );
    }
    
    if (location.pathname === '/production/job-cards') {
      return (
        <Button 
          size="sm" 
          className="gap-1"
          onClick={() => { window.location.href = '/production/job-cards/new'; }}
        >
          <Plus size={16} />
          New Job Card
        </Button>
      );
    }
    
    if (location.pathname === '/vendors') {
      return (
        <Button 
          size="sm" 
          className="gap-1"
          onClick={() => { window.location.href = '/vendors/new'; }}
        >
          <Plus size={16} />
          New Vendor
        </Button>
      );
    }
    
    if (location.pathname === '/suppliers') {
      return (
        <Button 
          size="sm" 
          className="gap-1"
          onClick={() => { window.location.href = '/suppliers/new'; }}
        >
          <Plus size={16} />
          New Supplier
        </Button>
      );
    }
    
    if (location.pathname === '/inventory') {
      return (
        <Button 
          size="sm" 
          className="gap-1"
          onClick={() => { window.location.href = '/inventory/new'; }}
        >
          <Plus size={16} />
          New Item
        </Button>
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
            ref={searchRef}
            type="text"
            placeholder="Search Nihar orders, jobs... (Press / to focus)"
            className="h-9 w-full rounded-md border border-input px-9 py-2 text-sm bg-background/50"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <KeyboardShortcut keys={["/"]} size="sm" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {getActionButton()}
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          onClick={() => setShowKeyboardShortcuts(true)}
        >
          <Keyboard className="h-5 w-5" />
        </Button>
        <ThemeSwitcher />
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
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => toast({
                  title: "All notifications marked as read",
                  description: "You have no unread notifications"
                })}
              >
                Mark all as read
              </Button>
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
      
      <KeyboardShortcutsHelp 
        open={showKeyboardShortcuts} 
        onOpenChange={setShowKeyboardShortcuts} 
      />
    </header>
  );
};

export default Header;
