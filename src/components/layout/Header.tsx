import { Bell, Search, Plus, Keyboard, Building, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { KeyboardShortcutsDialog } from "@/components/keyboard/KeyboardShortcutsDialog";
import { useState } from "react";
import { KeyboardShortcutsHelp } from "@/components/keyboard/KeyboardShortcutsHelp";
import { NavigationHistory } from "@/components/navigation/NavigationHistory";
import { useNavigationHistory } from "@/hooks/useNavigationHistory";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { KeyboardShortcut } from "@/components/ui/keyboard-shortcut";
import DatabaseSwitcher from "@/components/database/DatabaseSwitcher";

const Header = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [gstCopied, setGstCopied] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const { goBack, goForward, canGoBack, canGoForward } = useNavigationHistory();
  
  const copyToClipboard = async (text: string, setCopied: (value: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied to clipboard",
        description: "Text has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

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
      
      // Navigation history shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === "ArrowLeft" && canGoBack) {
        e.preventDefault();
        goBack();
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === "ArrowRight" && canGoForward) {
        e.preventDefault();
        goForward();
      }
      
      // Alt + Left/Right for back/forward (like browsers)
      if (e.altKey && e.key === "ArrowLeft" && canGoBack) {
        e.preventDefault();
        goBack();
      }
      
      if (e.altKey && e.key === "ArrowRight" && canGoForward) {
        e.preventDefault();
        goForward();
      }
      
      // Navigation shortcuts (g + key)
      if (e.key === "g") {
        const handleSecondKey = (e2: KeyboardEvent) => {
          if (e2.key === "d") navigate("/dashboard");
          if (e2.key === "o") navigate("/orders");
          if (e2.key === "p") navigate("/production");
          if (e2.key === "j") navigate("/production/job-cards");
          
          document.removeEventListener("keydown", handleSecondKey);
        };
        
        // Listen for the second key
        document.addEventListener("keydown", handleSecondKey, { once: true });
      }
      
      // Create new shortcuts (n + key)
      if (e.key === "n") {
        const handleSecondKey = (e2: KeyboardEvent) => {
          if (e2.key === "o") navigate("/orders/new");
          if (e2.key === "j") navigate("/production/job-cards/new");
          
          document.removeEventListener("keydown", handleSecondKey);
        };
        
        // Listen for the second key
        document.addEventListener("keydown", handleSecondKey, { once: true });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [canGoBack, canGoForward, goBack, goForward, navigate]);

  const getActionButton = () => {
    // Removed the duplicate "New Job Card" button from the production/job-cards page
    // since it already exists in the JobCardListHeader component
    
    if (location.pathname === '/vendors') {
      return (
        <Button 
          size="sm" 
          className="gap-1"
          onClick={() => { navigate('/vendors/new'); }}
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
          onClick={() => { navigate('/suppliers/new'); }}
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
          onClick={() => { navigate('/inventory/new'); }}
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="font-semibold text-lg">
              Nihar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-80">
            <DropdownMenuLabel>Company Details</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">GST Number</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard("24IWNPS6583R1Z2", setGstCopied)}
                >
                  {gstCopied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">24IWNPS6583R1Z2</p>
            </div>
            <div className="px-2 py-1.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Address</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(
                    "30, yamuna industrial estate, opp. neo plast, G.I.D.C, phase -1 vatva, ahmedabad, gujarat, 382445",
                    setAddressCopied
                  )}
                >
                  {addressCopied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                30, yamuna industrial estate,{'\n'}
                opp. neo plast, G.I.D.C,{'\n'}
                phase -1 vatva,{'\n'}
                ahmedabad, gujarat,{'\n'}
                382445
              </p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
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
        <NavigationHistory />
        <DatabaseSwitcher />
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
