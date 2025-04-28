
import { useState } from "react";
import { ProductionMetricsChart } from "@/components/dashboard/ProductionMetricsChart";
import { Button } from "@/components/ui/button";
import { KeyboardShortcutsHelp } from "@/components/keyboard/KeyboardShortcutsHelp";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { OfflineStatusIndicator } from "@/components/ui/offline-status-indicator";

const Dashboard = () => {
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  
  const { defineNavigationShortcuts } = useKeyboardShortcuts({
    ignoreInputFields: true,
    preventDefault: true
  });

  // Define keyboard shortcuts for dashboard
  const shortcuts = {
    ...defineNavigationShortcuts(),
    'h': () => document.getElementById('dashboard-header')?.focus(),
    'c': () => document.getElementById('production-chart')?.focus()
  };

  // Use keyboard shortcuts
  useKeyboardShortcuts(shortcuts);

  return (
    <div className="space-y-6">
      <div>
        <h1 
          id="dashboard-header" 
          className="text-3xl font-bold tracking-tight" 
          tabIndex={0}
        >
          Dashboard
        </h1>
        <p className="text-muted-foreground">Overview of your production metrics and status</p>
        
        <div className="mt-4 flex items-center gap-2">
          <KeyboardShortcutsHelp 
            open={showKeyboardHelp} 
            onOpenChange={setShowKeyboardHelp} 
          />
          <Button 
            variant="outline" 
            className="text-sm"
            aria-label="View accessibility settings"
          >
            Accessibility Settings
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6">
        <div id="production-chart" tabIndex={0}>
          <ProductionMetricsChart />
        </div>
      </div>
      
      <OfflineStatusIndicator />
    </div>
  );
};

export default Dashboard;
