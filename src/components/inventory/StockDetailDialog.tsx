
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { StockInfoGrid } from "./stock-detail/StockInfoGrid";
import { useStockDetail } from "@/hooks/inventory/useStockDetail";

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

  const { stockItem, linkedComponents, isLoading } = useStockDetail({
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
          <div className="flex justify-center py-8">Loading...</div>
        ) : stockItem ? (
          <StockInfoGrid stockItem={stockItem} linkedComponents={linkedComponents} />
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            No stock information found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
