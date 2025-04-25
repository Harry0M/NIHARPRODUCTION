
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
      
      // First attempt: use stored function to delete order and related records
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        'delete_order_completely', 
        { order_id: orderToDelete }
      );

      if (rpcError) {
        console.error("Primary deletion method failed:", rpcError);
        
        // Second attempt: use force delete function
        const { data: forceResult, error: forceError } = await supabase.rpc(
          'force_delete_order',
          { target_id: orderToDelete }
        );
        
        if (forceError) {
          console.error("Force deletion method failed:", forceError);
          
          // Final attempt: emergency delete
          const { data: emergencyResult, error: emergencyError } = await supabase.rpc(
            'emergency_delete_order',
            { target_id: orderToDelete }
          );
          
          if (emergencyError) {
            throw new Error("All deletion methods failed");
          }
        }
      }
      
      // Final verification
      const { data: checkOrder, error: checkError } = await supabase
        .from('orders')
        .select('id')
        .eq('id', orderToDelete)
        .maybeSingle();
      
      if (checkError) {
        console.error("Error verifying order deletion:", checkError);
      }
      
      if (checkOrder) {
        throw new Error("Order deletion failed after multiple methods");
      }
      
      console.log("Order and related records deleted successfully");
      
      // Update UI state after successful deletion
      onOrderDeleted(orderToDelete);
      
      toast({
        title: "Order deleted successfully",
        description: "The order and all related records have been removed.",
      });
      
    } catch (error: any) {
      console.error("Error in deletion process:", error);
      
      toast({
        title: "Error deleting order",
        description: error.message || "An error occurred while deleting the order",
        variant: "destructive",
      });
    } finally {
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
