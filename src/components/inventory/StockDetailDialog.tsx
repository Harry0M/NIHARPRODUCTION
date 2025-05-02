
import { useState } from "react";
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
  const { stockItem, handleDelete } = useStockDetail({ stockId, onClose });

  const handleEdit = () => {
    if (stockId) {
      navigate(`/inventory/stock/${stockId}`);
      onClose();
    }
  };

  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (stockId) {
      handleDelete(stockId);
    }
    setIsDeleteDialogOpen(false);
  };

  if (!stockItem) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{stockItem.material_type}</DialogTitle>
            <DialogDescription>
              Stock details and information
            </DialogDescription>
          </DialogHeader>
          
          <StockInfoGrid stockItem={stockItem} />
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button variant="destructive" onClick={openDeleteDialog}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <DeleteStockDialog 
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </>
  );
};
