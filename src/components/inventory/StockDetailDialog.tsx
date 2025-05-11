import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, AlertCircle, RefreshCcw, History, Bell, Plus, Database } from "lucide-react";
import { StockInfoGrid } from "./stock-detail/StockInfoGrid";
import { useStockDetail } from "@/hooks/inventory/useStockDetail";
import { Skeleton } from "@/components/ui/skeleton";
import { StockTransactionHistory } from "./stock-detail/StockTransactionHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showToast } from "@/components/ui/enhanced-toast";
import { Badge } from "@/components/ui/badge";

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
  const isFirstRender = useRef(true);

  const { 
    stockItem, 
    linkedComponents, 
    transactions,
    transactionLogs,
    isLoading, 
    refreshTransactions,
    isRefreshing,
    isTransactionsLoading,
    errorMessage,
    createTestTransaction
  } = useStockDetail({
    stockId,
    onClose: handleClose,
  });
  
  // Check for any recent inventory updates when dialog opens
  useEffect(() => {
    if (open && stockId) {
      console.log(`StockDetailDialog opened for item: ${stockId}`);
      
      // Check if we should view transactions for this material
      const viewTransactionsFor = localStorage.getItem('view_transactions_for_material');
      if (viewTransactionsFor === stockId) {
        console.log("Auto-switching to transactions tab due to view_transactions_for_material flag");
        setActiveTab("transactions");
        localStorage.removeItem('view_transactions_for_material');
      }
      
      // Check if this material had recent updates
      const checkForInventoryUpdate = () => {
        try {
          const lastUpdate = localStorage.getItem('last_inventory_update');
          const updatedMaterialIds = localStorage.getItem('updated_material_ids');
          
          if (lastUpdate && updatedMaterialIds) {
            const materialIds = JSON.parse(updatedMaterialIds);
            const updateTime = new Date(lastUpdate).getTime();
            const currentTime = new Date().getTime();
            const timeDiff = currentTime - updateTime;
            
            // If update is less than 30 seconds ago and affects this material
            if (timeDiff < 30000 && materialIds.includes(stockId)) {
              console.log("Recent inventory update detected for this material, refreshing transactions");
              refreshTransactions();
              setActiveTab("transactions");
              
              // Get specific details about this update if available
              const materialUpdateKey = `material_update_${stockId}`;
              const materialUpdateDetails = localStorage.getItem(materialUpdateKey);
              
              if (materialUpdateDetails) {
                try {
                  const details = JSON.parse(materialUpdateDetails);
                  const changeAmount = Math.abs(details.previous - details.new).toFixed(2);
                  const changeDirection = details.new > details.previous ? "increased" : "decreased";
                  
                  showToast({
                    title: "Inventory Updated",
                    description: `Quantity ${changeDirection} by ${changeAmount} units. Check transaction history for details.`,
                    type: "info"
                  });
                  
                  // Clear this specific update after showing
                  localStorage.removeItem(materialUpdateKey);
                } catch (e) {
                  console.error("Error parsing material update details:", e);
                }
              } else {
                showToast({
                  title: "Inventory Updated",
                  description: "This material was recently updated. Showing transaction history.",
                  type: "info"
                });
              }
            }
          }
        } catch (e) {
          console.error("Error checking for inventory update:", e);
        }
      };
      
      // Check immediately
      checkForInventoryUpdate();
      
      // Only set the timer on first render
      if (isFirstRender.current) {
        isFirstRender.current = false;
        
        // Refresh once after opening
        const timer = setTimeout(() => {
          refreshTransactions();
        }, 500);
        
        return () => {
          clearTimeout(timer);
          isFirstRender.current = true; // Reset for next time dialog opens
        };
      }
    }
  }, [open, stockId]); // Removed refreshTransactions from dependencies

  // Use a ref to track if we've already refreshed for this dialog opening
  const hasRefreshedRef = useRef(false);
  
  useEffect(() => {
    // Auto-switch to transactions tab when this dialog opens if that tab was specified
    if (open && initialTab === "transactions") {
      console.log("Auto-switching to transactions tab based on initialTab prop");
      setActiveTab("transactions");
      
      // Only refresh once when the dialog opens
      if (!hasRefreshedRef.current) {
        console.log("Refreshing transactions once for initialTab=transactions");
        refreshTransactions();
        hasRefreshedRef.current = true;
      }
    }
    
    // Reset the ref when dialog closes
    if (!open) {
      hasRefreshedRef.current = false;
    }
  }, [open, initialTab]); // Removed refreshTransactions from dependencies
  
  // Handle manual refresh with toast feedback
  const handleRefresh = async () => {
    try {
      showToast({
        title: "Refreshing transactions",
        description: "Checking for latest transaction data",
        type: "info"
      });
      
      await refreshTransactions();
      
      const totalCount = (transactions?.length || 0) + (transactionLogs?.length || 0);
      showToast({
        title: "Refreshed",
        description: totalCount > 0 
          ? `Found ${totalCount} transaction records` 
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

  // Function to handle creating a test transaction for debugging
  const handleCreateTestTransaction = async () => {
    if (!stockId) return;
    
    try {
      await createTestTransaction();
    } catch (error) {
      console.error("Error in handleCreateTestTransaction:", error);
    }
  };

  // Calculate if there are any transactions to show
  const hasTransactions = (transactions && transactions.length > 0) ||
                         (transactionLogs && transactionLogs.length > 0);
  const transactionCount = (transactions?.length || 0) + (transactionLogs?.length || 0);

  // Store user's manually selected tab
  const userSelectedTabRef = useRef<string | null>(null);

  // Auto-switch to transactions tab only on initial load if transactions exist
  useEffect(() => {
    // Only auto-switch if user hasn't manually selected a tab yet
    if (hasTransactions && isRefreshing === false && userSelectedTabRef.current === null) {
      console.log("Auto-switching to transactions tab on initial load");
      setActiveTab("transactions");
    }
  }, [hasTransactions, isRefreshing]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center justify-between">
            <div className="flex items-center">
              <span>{stockItem?.material_name || "Stock Details"}</span>
              {hasTransactions && (
                <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                  <History className="mr-1 h-3 w-3" />
                  {transactionCount} transactions
                </span>
              )}
            </div>
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
            onValueChange={(value) => {
              // Track that user has manually selected a tab
              userSelectedTabRef.current = value;
              setActiveTab(value);
            }} 
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
                  <Database className="h-4 w-4" />
                  Transactions
                  {hasTransactions && (
                    <span className="ml-1 inline-flex items-center justify-center rounded-full bg-primary w-5 h-5 text-[10px] text-primary-foreground">
                      {transactionCount}
                    </span>
                  )}
                  {hasTransactions && (
                    <span className="absolute -right-1 -top-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
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
              {hasTransactions && (
                <div className="mt-8 flex justify-center">
                  <Button
                    variant="default"
                    onClick={() => setActiveTab("transactions")}
                    className="flex items-center gap-2"
                    size="lg"
                  >
                    <History className="h-5 w-5" />
                    View {transactionCount} Transaction{transactionCount !== 1 ? 's' : ''}
                  </Button>
                </div>
              )}
              
              {/* Add option to manually create test transaction if no transactions found */}
              {!hasTransactions && stockItem && (
                <div className="mt-8 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={handleCreateTestTransaction}
                    className="flex items-center gap-2"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    Create Test Transaction
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="transactions">
              <div className="mb-4 flex justify-between items-center">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  {hasTransactions ? (
                    <>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Bell className="h-3.5 w-3.5" />
                        {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
                      </Badge>
                      {errorMessage && (
                        <span className="text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {errorMessage}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="flex items-center gap-1">
                      {errorMessage ? (
                        <>
                          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                          <span className="text-destructive">{errorMessage}</span>
                        </>
                      ) : (
                        "No transactions found"
                      )}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleCreateTestTransaction}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Test Transaction
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-1"
                  >
                    <RefreshCcw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </div>
              </div>
              <StockTransactionHistory 
                transactions={transactions || []} 
                transactionLogs={transactionLogs || []}
                onRefresh={refreshTransactions}
                isLoading={isRefreshing || isTransactionsLoading}
                materialId={stockId || undefined}
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
