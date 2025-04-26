
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
      
      // First, check for any dispatch batches associated with this order's dispatches
      // Get all dispatches for this order
      const { data: orderDispatches, error: dispatchError } = await supabase
        .from('order_dispatches')
        .select('id')
        .eq('order_id', orderToDelete);
      
      if (dispatchError) throw new Error(dispatchError.message);
      
      // If there are dispatches, delete their batches first
      if (orderDispatches && orderDispatches.length > 0) {
        const dispatchIds = orderDispatches.map(dispatch => dispatch.id);
        
        // Delete all batches for these dispatches
        const { error: batchDeleteError } = await supabase
          .from('dispatch_batches')
          .delete()
          .in('order_dispatch_id', dispatchIds);
          
        if (batchDeleteError) throw new Error(batchDeleteError.message);
        
        console.log("Successfully deleted dispatch batches");
      }
      
      // Now use the delete_order_completely function which will handle the rest
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
