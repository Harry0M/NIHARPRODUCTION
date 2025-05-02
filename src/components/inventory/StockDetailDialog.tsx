
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Edit, Trash2 } from "lucide-react";
import { DeleteStockDialog } from "./dialogs/DeleteStockDialog";
import { StockInfoGrid } from "./stock-detail/StockInfoGrid";
import { useStockDetail } from "@/hooks/inventory/useStockDetail";

interface StockDetailDialogProps {
  stockId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StockDetailDialog = ({ stockId, isOpen, onClose }: StockDetailDialogProps) => {
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { stockItem, handleDelete, isDeleting } = useStockDetail({ 
    stockId, 
    onClose: () => {
      console.log("Stock detail onClose callback triggered");
      setIsDeleteDialogOpen(false);
      onClose();
    } 
  });

  // Effect to safely close delete dialog if main dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsDeleteDialogOpen(false);
    }
  }, [isOpen]);

  const handleEdit = () => {
    if (stockId) {
      console.log(`Navigating to edit page for stock ID: ${stockId}`);
      // First close the dialog, then navigate
      onClose();
      // Small delay to ensure dialog is closed before navigation
      setTimeout(() => {
        navigate(`/inventory/stock/${stockId}`);
      }, 100);
    }
  };

  const openDeleteDialog = () => {
    console.log("Opening delete confirmation dialog");
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (stockId) {
      console.log(`Confirming deletion of stock ID: ${stockId}`);
      handleDelete(stockId);
      // Dialog will be closed by the onSuccess callback in the mutation
    }
  };

  const handleCloseDeleteDialog = (open: boolean) => {
    // Only allow closing if we're not in the middle of deleting
    if (!isDeleting || !open) {
      console.log(`Closing delete dialog, isDeleting: ${isDeleting}`);
      setIsDeleteDialogOpen(open);
    }
  };

  const handleCloseMainDialog = (open: boolean) => {
    // Only allow closing if we're not in the middle of deleting
    if (!isDeleting || !open) {
      console.log(`Closing main dialog, isDeleting: ${isDeleting}`);
      onClose();
    }
  };

  if (!stockItem && stockId) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleCloseMainDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{stockItem?.material_type}</DialogTitle>
            <DialogDescription>
              Stock details and information
            </DialogDescription>
          </DialogHeader>
          
          {stockItem && <StockInfoGrid stockItem={stockItem} />}
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose} disabled={isDeleting}>
              Close
            </Button>
            <Button variant="destructive" onClick={openDeleteDialog} disabled={isDeleting}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button onClick={handleEdit} disabled={isDeleting}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <DeleteStockDialog 
        isOpen={isDeleteDialogOpen}
        onOpenChange={handleCloseDeleteDialog}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};
