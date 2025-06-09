import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { reversePurchaseCompletion } from "@/utils/purchaseInventoryUtils";

export const usePurchaseDeletion = (onPurchaseDeleted: (purchaseId: string) => void) => {
  const navigate = useNavigate();
  const [purchaseToDelete, setPurchaseToDelete] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteClick = (purchaseId: string) => {
    setPurchaseToDelete(purchaseId);
    setDeleteDialogOpen(true);
  };

  const handleDeletePurchase = async () => {
    if (!purchaseToDelete) return;

    setDeleteLoading(true);
    
    try {
      console.log("Starting deletion process for purchase ID:", purchaseToDelete);
      
      // First, fetch the purchase details to check status and handle inventory reversal
      const { data: purchase, error: fetchError } = await supabase
        .from('purchases')
        .select(`
          *,
          suppliers(name),
          purchase_items(
            id,
            material_id,
            quantity,
            unit_price,
            line_total,
            actual_meter,
            material:inventory(
              id,
              material_name,
              conversion_rate,
              unit
            )
          )
        `)
        .eq('id', purchaseToDelete)
        .single();

      if (fetchError) {
        console.error("Error fetching purchase for deletion:", fetchError);
        throw new Error(fetchError.message);
      }

      if (!purchase) {
        throw new Error("Purchase not found");
      }

      console.log("Purchase to delete:", purchase.purchase_number, "Status:", purchase.status);

      // If purchase is completed, reverse inventory changes first
      if (purchase.status === 'completed') {
        console.log("Purchase is completed, reversing inventory changes...");
        
        const reversalResult = await reversePurchaseCompletion({
          id: purchase.id,
          purchase_number: purchase.purchase_number,
          purchase_items: purchase.purchase_items.map(item => ({
            id: item.id,
            material_id: item.material_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            line_total: item.line_total,
            actual_meter: item.actual_meter || 0,
            material: {
              id: item.material.id,
              material_name: item.material.material_name,
              conversion_rate: item.material.conversion_rate,
              unit: item.material.unit
            }
          }))
        });

        if (!reversalResult.success) {
          console.warn("Inventory reversal had issues:", reversalResult.error);
          // Continue with deletion even if reversal had issues - user should be warned
        } else {
          console.log("Successfully reversed inventory changes");
        }
      }

      // Delete purchase items first (foreign key constraint)
      const { error: itemsDeleteError } = await supabase
        .from('purchase_items')
        .delete()
        .eq('purchase_id', purchaseToDelete);

      if (itemsDeleteError) {
        console.error("Failed to delete purchase items:", itemsDeleteError);
        throw new Error(`Failed to delete purchase items: ${itemsDeleteError.message}`);
      }

      console.log("Successfully deleted purchase items");

      // Delete the main purchase record
      const { error: deleteError } = await supabase
        .from('purchases')
        .delete()
        .eq('id', purchaseToDelete);

      if (deleteError) {
        console.error("Purchase deletion failed:", deleteError);
        throw new Error(deleteError.message);
      }
      
      // Final verification
      const { data: checkPurchase } = await supabase
        .from('purchases')
        .select('id')
        .eq('id', purchaseToDelete)
        .maybeSingle();
      
      if (checkPurchase) {
        throw new Error("Purchase still exists after deletion attempt");
      }
      
      console.log("Purchase deleted successfully");
      
      // First close the dialog and clean up state
      setDeleteDialogOpen(false);
      setPurchaseToDelete(null);
      
      // Show success message
      toast({
        title: "Purchase deleted",
        description: `Purchase ${purchase.purchase_number} has been successfully deleted.`,
      });
      
      // Call the callback to refresh data
      onPurchaseDeleted(purchaseToDelete);
      
    } catch (error) {
      console.error("Purchase deletion failed:", error);
      
      toast({
        title: "Deletion failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred while deleting the purchase.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDelete = () => {
    if (!deleteLoading) {
      setDeleteDialogOpen(false);
      setPurchaseToDelete(null);
    }
  };

  return {
    purchaseToDelete,
    deleteDialogOpen,
    deleteLoading,
    handleDeleteClick,
    handleDeletePurchase,
    cancelDelete,
    setDeleteDialogOpen
  };
};
