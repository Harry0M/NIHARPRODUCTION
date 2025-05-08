
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, AlertCircle, RefreshCcw } from "lucide-react";
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
}

export const StockDetailDialog = ({
  stockId,
  open,
  onOpenChange,
  onEdit = () => {},
  onDelete = () => {},
}: StockDetailDialogProps) => {
  const handleClose = () => onOpenChange(false);
  const [activeTab, setActiveTab] = useState<string>("details");

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
  
  // Handle manual refresh with toast feedback
  const handleRefresh = async () => {
    try {
      showToast({
        title: "Refreshing transactions",
        description: "Checking for latest transaction data"
      });
      
      await refreshTransactions();
      
      showToast({
        title: "Refreshed",
        description: transactions && transactions.length > 0 
          ? `Found ${transactions.length} transactions` 
          : "No transactions found"
      });
    } catch (error) {
      console.error("Error refreshing transactions:", error);
      showToast({
        title: "Refresh failed",
        description: "Could not refresh transaction data",
        variant: "destructive"
      });
    }
  };

  // Calculate if there are any transactions to show
  const hasTransactions = transactions && transactions.length > 0;

  // Auto-switch to transactions tab if transactions appear after refresh
  React.useEffect(() => {
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
                className="relative"
                onClick={() => hasTransactions === false && handleRefresh()}
              >
                Transactions
                {hasTransactions && (
                  <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-primary w-5 h-5 text-[10px] text-primary-foreground">
                    {transactions.length}
                  </span>
                )}
                {(isRefreshing || isTransactionsLoading) && (
                  <RefreshCcw className="ml-2 h-3 w-3 animate-spin" />
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details">
              <StockInfoGrid 
                stockItem={stockItem} 
                linkedComponents={linkedComponents} 
              />
              
              {/* Add a button to view transactions */}
              {!hasTransactions && (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActiveTab("transactions");
                      handleRefresh();
                    }}
                    className="flex items-center gap-1"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Check for Transactions
                  </Button>
                </div>
              )}
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
