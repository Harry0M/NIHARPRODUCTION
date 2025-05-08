
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, AlertCircle } from "lucide-react";
import { StockInfoGrid } from "./stock-detail/StockInfoGrid";
import { useStockDetail } from "@/hooks/inventory/useStockDetail";
import { Skeleton } from "@/components/ui/skeleton";
import { StockTransactionHistory } from "./stock-detail/StockTransactionHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
          <Tabs defaultValue="details">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details">
              <StockInfoGrid 
                stockItem={stockItem} 
                linkedComponents={linkedComponents} 
              />
            </TabsContent>
            
            <TabsContent value="transactions">
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
