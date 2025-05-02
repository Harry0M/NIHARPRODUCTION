
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2 } from "lucide-react";

interface StockDetailDialogProps {
  stockId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StockDetailDialog = ({ stockId, isOpen, onClose }: StockDetailDialogProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const { data: stockItem } = useQuery({
    queryKey: ["stock-detail", stockId],
    queryFn: async () => {
      if (!stockId) return null;
      
      const { data, error } = await supabase
        .from("inventory")
        .select("*, suppliers(name)")
        .eq("id", stockId)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!stockId && isOpen,
  });

  const deleteStockMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("inventory")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({
        title: "Stock deleted",
        description: "The stock item has been removed from inventory",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Error deleting stock:", error);
      toast({
        title: "Error",
        description: "Failed to delete stock item. It might be referenced by other records.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = () => {
    if (stockId) {
      navigate(`/inventory/stock/${stockId}`);
      onClose();
    }
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (stockId) {
      deleteStockMutation.mutate(stockId);
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
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-sm">Material Type</h3>
                <p>{stockItem.material_type}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-sm">Color</h3>
                <p>{stockItem.color || "N/A"}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-sm">GSM</h3>
                <p>{stockItem.gsm || "N/A"}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-sm">Quantity</h3>
                <p>{stockItem.quantity} {stockItem.unit}</p>
              </div>
              
              {stockItem.alternate_unit && (
                <div>
                  <h3 className="font-medium text-sm">Alternate Unit</h3>
                  <p>
                    {(stockItem.quantity * (stockItem.conversion_rate || 1)).toFixed(2)} {stockItem.alternate_unit}
                  </p>
                </div>
              )}
              
              {stockItem.track_cost && (
                <>
                  <div>
                    <h3 className="font-medium text-sm">Purchase Price</h3>
                    <p>{stockItem.purchase_price ? `₹${stockItem.purchase_price}` : "N/A"}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Selling Price</h3>
                    <p>{stockItem.selling_price ? `₹${stockItem.selling_price}` : "N/A"}</p>
                  </div>
                </>
              )}
              
              <div>
                <h3 className="font-medium text-sm">Supplier</h3>
                <p>{stockItem.suppliers?.name || "N/A"}</p>
              </div>
              
              {stockItem.reorder_level && (
                <div>
                  <h3 className="font-medium text-sm">Reorder Level</h3>
                  <p>{stockItem.reorder_level}</p>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
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
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this inventory item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
