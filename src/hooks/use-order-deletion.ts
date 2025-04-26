
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useOrderDeletion = (onOrderDeleted: (orderId: string) => void) => {
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteClick = (orderId: string) => {
    setOrderToDelete(orderId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;

    setDeleteLoading(true);
    
    try {
      console.log("Starting deletion process for order ID:", orderToDelete);
      
      // Step 1: Get all dispatches for this order
      const { data: orderDispatches, error: dispatchError } = await supabase
        .from('order_dispatches')
        .select('id')
        .eq('order_id', orderToDelete);
      
      if (dispatchError) {
        console.error("Error fetching dispatches:", dispatchError);
        throw new Error(dispatchError.message);
      }
      
      // Step 2: Delete dispatch batches first (if they exist)
      if (orderDispatches && orderDispatches.length > 0) {
        const dispatchIds = orderDispatches.map(dispatch => dispatch.id);
        console.log(`Found ${dispatchIds.length} dispatches with IDs:`, dispatchIds);
        
        // Delete all batches for these dispatches one by one to ensure complete deletion
        for (const dispatchId of dispatchIds) {
          console.log(`Deleting batches for dispatch ID: ${dispatchId}`);
          const { error: batchDeleteError } = await supabase
            .from('dispatch_batches')
            .delete()
            .eq('order_dispatch_id', dispatchId);
            
          if (batchDeleteError) {
            console.error(`Error deleting batches for dispatch ${dispatchId}:`, batchDeleteError);
            throw new Error(`Failed to delete batches: ${batchDeleteError.message}`);
          }
          
          console.log(`Successfully deleted batches for dispatch ${dispatchId}`);
        }
        
        // Step 3: Now delete the dispatches themselves
        for (const dispatchId of dispatchIds) {
          console.log(`Deleting dispatch ID: ${dispatchId}`);
          const { error: dispatchDeleteError } = await supabase
            .from('order_dispatches')
            .delete()
            .eq('id', dispatchId);
            
          if (dispatchDeleteError) {
            console.error(`Error deleting dispatch ${dispatchId}:`, dispatchDeleteError);
            throw new Error(`Failed to delete dispatch: ${dispatchDeleteError.message}`);
          }
        }
        
        console.log("Successfully deleted all dispatch records");
      }
      
      // Step 4: Now call delete_order_completely to handle the rest
      console.log("Calling delete_order_completely function...");
      const { error: deleteError } = await supabase.rpc(
        'delete_order_completely',
        { order_id: orderToDelete }
      );

      if (deleteError) {
        console.error("Order deletion failed:", deleteError);
        throw new Error(deleteError.message);
      }
      
      // Final verification
      const { data: checkOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('id', orderToDelete)
        .maybeSingle();
      
      if (checkOrder) {
        throw new Error("Order still exists after deletion attempt");
      }
      
      console.log("Order deleted successfully");
      
      // First close the dialog and clean up state
      setDeleteDialogOpen(false);
      const deletedOrderId = orderToDelete;
      setOrderToDelete(null);
      setDeleteLoading(false);
      
      // Send a success notification
      toast({
        title: "Order deleted successfully",
        description: "The order and all related records have been removed.",
      });
      
      // Allow state updates to complete before triggering any navigation
      setTimeout(() => {
        // Only notify parent component about the deletion after everything else is done
        onOrderDeleted(deletedOrderId);
      }, 0);
      
    } catch (error: any) {
      console.error("Error in deletion process:", error);
      
      toast({
        title: "Error deleting order",
        description: error.message || "An error occurred while deleting the order",
        variant: "destructive",
      });
      
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
      setDeleteLoading(false);
    }
  };

  return {
    orderToDelete,
    deleteDialogOpen,
    deleteLoading,
    setDeleteDialogOpen,
    handleDeleteClick,
    handleDeleteOrder,
  };
};
