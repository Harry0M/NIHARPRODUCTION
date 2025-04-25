
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
      
      // Use the updated delete_order_completely function
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
