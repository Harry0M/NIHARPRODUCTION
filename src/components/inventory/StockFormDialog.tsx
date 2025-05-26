import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StockForm } from "./StockForm";

interface StockFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStockCreated?: (stockId: string) => void;
}

export const StockFormDialog = ({
  open,
  onOpenChange,
  onStockCreated,
}: StockFormDialogProps) => {
  // Prevent form submission from bubbling up to parent forms
  const handleDialogClick = (e: React.MouseEvent) => {
    // Stop click events from reaching parent forms
    e.stopPropagation();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto" 
        onClick={handleDialogClick}
      >
        <DialogHeader>
          <DialogTitle>Create New Stock Item</DialogTitle>
        </DialogHeader>
        {/* Wrap StockForm in a div with onSubmit that prevents propagation */}
        <div onSubmit={(e) => e.stopPropagation()}>
          <StockForm 
            onSuccess={(stockId) => {
              if (onStockCreated) {
                onStockCreated(stockId);
              }
              onOpenChange(false);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}; 