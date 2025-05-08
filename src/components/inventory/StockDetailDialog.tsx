
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, AlertCircle, RefreshCcw, History } from "lucide-react";
import { StockInfoGrid } from "./stock-detail/StockInfoGrid";
import { useStockDetail } from "@/hooks/inventory/useStockDetail";
import { Skeleton } from "@/components/ui/skeleton";
import { StockTransactionHistory } from "./stock-detail/StockTransactionHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showToast } from "@/components/ui/enhanced-toast";

interface StockDetailDialogProps {
  stockId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  initialTab?: string;
}

export const StockDetailDialog = ({
  stockId,
  open,
  onOpenChange,
  onEdit = () => {},
  onDelete = () => {},
  initialTab = "details",
}: StockDetailDialogProps) => {
  const handleClose = () => onOpenChange(false);
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const { 
    stockItem, 
    linkedComponents, 
    transactions, 
    isLoading, 
    refreshTransactions,
    isRefreshing,
    isTransactionsLoading
  } = useStockDetail({
    stockId,
    onClose: handleClose,
  });
  
  // Check for any recent inventory updates
  useEffect(() => {
    if (open && stockId) {
      const checkForInventoryUpdate = () => {
        try {
          const lastUpdate = localStorage.getItem('last_inventory_update');
          const updatedMaterialIds = localStorage.getItem('updated_material_ids');
          
          if (lastUpdate && updatedMaterialIds) {
            const materialIds = JSON.parse(updatedMaterialIds);
            const updateTime = new Date(lastUpdate).getTime();
            const currentTime = new Date().getTime();
            const timeDiff = currentTime - updateTime;
            
            // If update is less than 10 seconds ago and affects this material
            if (timeDiff < 10000 && materialIds.includes(stockId)) {
              console.log("Recent inventory update detected for this material, refreshing transactions");
              refreshTransactions();
              setActiveTab("transactions");
              
              // Clear the localStorage values to avoid repeated refreshing
              localStorage.removeItem('last_inventory_update');
              localStorage.removeItem('updated_material_ids');
              
              showToast({
                title: "Inventory Updated",
                description: "This material was recently used in an order. Showing transaction history.",
                type: "info"
              });
            }
          }
        } catch (e) {
          console.error("Error checking for inventory update:", e);
        }
      };
      
      // Check immediately and also after a short delay to ensure any new localStorage values are captured
      checkForInventoryUpdate();
      const timer = setTimeout(checkForInventoryUpdate, 500);
      return () => clearTimeout(timer);
    }
  }, [open, stockId, refreshTransactions]);
  
  // Handle manual refresh with toast feedback
  const handleRefresh = async () => {
    try {
      showToast({
        title: "Refreshing transactions",
        description: "Checking for latest transaction data",
        type: "info"
      });
      
      await refreshTransactions();
      
      showToast({
        title: "Refreshed",
        description: transactions && transactions.length > 0 
          ? `Found ${transactions.length} transactions` 
          : "No transactions found",
        type: "info"
      });
    } catch (error) {
      console.error("Error refreshing transactions:", error);
      showToast({
        title: "Refresh failed",
        description: "Could not refresh transaction data",
        type: "error"
      });
    }
  };

  // Calculate if there are any transactions to show
  const hasTransactions = transactions && transactions.length > 0;

  // Auto-switch to transactions tab if transactions appear after refresh
  useEffect(() => {
    if (hasTransactions && isRefreshing === false && activeTab === "details") {
      // Only switch if we just finished refreshing and found transactions
      setActiveTab("transactions");
    }
  }, [hasTransactions, isRefreshing, activeTab]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center justify-between">
            <span>{stockItem?.material_name || "Stock Details"}</span>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
          {stockItem?.color && (
            <DialogDescription>
              Color: {stockItem.color}
              {stockItem.gsm ? ` | GSM: ${stockItem.gsm}` : ""}
            </DialogDescription>
          )}
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : stockItem ? (
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            defaultValue="details"
          >
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger 
                value="transactions" 
                className={`relative ${hasTransactions ? 'font-medium text-primary' : ''}`}
                onClick={() => hasTransactions === false && handleRefresh()}
              >
                <div className="flex items-center gap-1.5">
                  <History className="h-4 w-4" />
                  Transactions
                  {hasTransactions && (
                    <span className="ml-1 inline-flex items-center justify-center rounded-full bg-primary w-5 h-5 text-[10px] text-primary-foreground">
                      {transactions.length}
                    </span>
                  )}
                  {(isRefreshing || isTransactionsLoading) && (
                    <RefreshCcw className="ml-2 h-3 w-3 animate-spin" />
                  )}
                </div>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details">
              <StockInfoGrid 
                stockItem={stockItem} 
                linkedComponents={linkedComponents} 
              />
              
              {/* Make the button to view transactions more prominent when transactions exist */}
              <div className="mt-8 flex justify-center">
                <Button
                  variant={hasTransactions ? "default" : "outline"}
                  onClick={() => {
                    setActiveTab("transactions");
                    if (!hasTransactions) handleRefresh();
                  }}
                  className="flex items-center gap-2"
                  size="lg"
                >
                  <History className="h-5 w-5" />
                  {hasTransactions 
                    ? `View ${transactions.length} Transaction${transactions.length !== 1 ? 's' : ''}`
                    : "Check Transaction History"}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="transactions">
              <div className="mb-4 flex justify-end">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-1"
                >
                  <RefreshCcw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh Transactions'}
                </Button>
              </div>
              <StockTransactionHistory 
                transactions={transactions || []} 
                onRefresh={refreshTransactions}
                isLoading={isRefreshing || isTransactionsLoading}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="py-8 text-center flex flex-col items-center gap-2">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <p className="text-lg font-medium">No stock information found</p>
            <p className="text-sm text-muted-foreground">
              There was an issue loading the stock details. Please try again.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
