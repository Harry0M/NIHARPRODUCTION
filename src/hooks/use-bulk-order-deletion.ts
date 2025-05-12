import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useBulkOrderDeletion = (onOrdersDeleted: (orderIds: string[]) => void) => {
  const [ordersToDelete, setOrdersToDelete] = useState<string[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  const handleBulkDeleteClick = (orderIds: string[]) => {
    if (orderIds.length === 0) return;
    setOrdersToDelete(orderIds);
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteOrders = async () => {
    if (ordersToDelete.length === 0) return;

    setBulkDeleteLoading(true);
    
    try {
      console.log(`Starting bulk deletion process for ${ordersToDelete.length} orders`);
      
      // Call the new bulk_delete_orders function
      const { data, error } = await supabase.rpc(
        'bulk_delete_orders',
        { order_ids: ordersToDelete }
      );

      if (error) {
        console.error("Bulk order deletion failed:", error);
        throw new Error(error.message);
      }
      
      console.log("Orders deleted successfully:", data);
      
      // Close the dialog and clean up state
      setBulkDeleteDialogOpen(false);
      const deletedOrderIds = [...ordersToDelete]; // Create a copy before clearing
      setOrdersToDelete([]);
      setBulkDeleteLoading(false);
      
      // Call the callback with the deleted order IDs
      onOrdersDeleted(deletedOrderIds);
      
      // Send a success notification
      toast({
        title: `${deletedOrderIds.length} orders deleted successfully`,
        description: "The orders and all related records have been removed.",
      });
      
    } catch (error: any) {
      console.error("Error in bulk deletion process:", error);
      
      toast({
        title: "Error deleting orders",
        description: error.message || "An error occurred while deleting the orders",
        variant: "destructive",
      });
      
      setBulkDeleteDialogOpen(false);
      setOrdersToDelete([]);
      setBulkDeleteLoading(false);
    }
  };

  return {
    ordersToDelete,
    bulkDeleteDialogOpen,
    bulkDeleteLoading,
    setBulkDeleteDialogOpen,
    handleBulkDeleteClick,
    handleBulkDeleteOrders,
  };
};
