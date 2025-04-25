
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

      // Try to delete order dispatches first, which was causing constraint violations
      const { error: dispatchError } = await supabase
        .from('order_dispatches')
        .delete()
        .eq('order_id', orderToDelete);
      
      if (dispatchError) {
        console.error("Failed to delete order dispatches:", dispatchError);
      }
      
      // Now try the primary deletion method
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        'delete_order_completely',
        { order_id: orderToDelete }
      );

      if (rpcError) {
        console.error("Primary deletion method failed:", rpcError);
        
        // Get all related job card IDs
        const { data: jobCards } = await supabase
          .from('job_cards')
          .select('id')
          .eq('order_id', orderToDelete);
        
        if (jobCards && jobCards.length > 0) {
          const jobCardIds = jobCards.map(jc => jc.id);
          
          // Delete cutting components first
          const { data: cuttingJobs } = await supabase
            .from('cutting_jobs')
            .select('id')
            .in('job_card_id', jobCardIds);
          
          if (cuttingJobs && cuttingJobs.length > 0) {
            const cuttingJobIds = cuttingJobs.map(cj => cj.id);
            
            await supabase
              .from('cutting_components')
              .delete()
              .in('cutting_job_id', cuttingJobIds);
          }
          
          // Delete production jobs
          await Promise.all([
            supabase.from('cutting_jobs').delete().in('job_card_id', jobCardIds),
            supabase.from('printing_jobs').delete().in('job_card_id', jobCardIds),
            supabase.from('stitching_jobs').delete().in('job_card_id', jobCardIds)
          ]);
          
          // Delete job cards
          await supabase.from('job_cards').delete().eq('order_id', orderToDelete);
        }
        
        // Delete order components
        await supabase.from('order_components').delete().eq('order_id', orderToDelete);
        
        // Finally try to delete the order itself
        const { error: deleteError } = await supabase
          .from('orders')
          .delete()
          .eq('id', orderToDelete);
        
        if (deleteError) {
          console.error("Manual deletion failed:", deleteError);
          throw new Error(deleteError.message);
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
