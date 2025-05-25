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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Stock Item</DialogTitle>
        </DialogHeader>
        <StockForm 
          onSuccess={(stockId) => {
            if (onStockCreated) {
              onStockCreated(stockId);
            }
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}; 