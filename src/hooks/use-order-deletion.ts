
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
      console.log("Attempting to delete order with ID:", orderToDelete);
      
      // First find all job cards associated with this order
      const { data: jobCards, error: jobCardsError } = await supabase
        .from('job_cards')
        .select('id')
        .eq('order_id', orderToDelete);
      
      if (jobCardsError) throw jobCardsError;
      console.log("Found job cards:", jobCards);
      
      const jobCardIds = jobCards?.map(jc => jc.id) || [];
      
      // Delete all order components before attempting to delete the order
      const { error: componentsError } = await supabase
        .from('order_components')
        .delete()
        .eq('order_id', orderToDelete);
      
      if (componentsError) {
        console.error("Error deleting order components:", componentsError);
        throw componentsError;
      }
      
      // Delete order dispatches
      const { error: dispatchesError } = await supabase
        .from('order_dispatches')
        .delete()
        .eq('order_id', orderToDelete);
      
      if (dispatchesError) {
        console.error("Error deleting order dispatches:", dispatchesError);
        throw dispatchesError;
      }
      
      if (jobCardIds.length > 0) {
        // Process job cards one by one
        for (const jobCardId of jobCardIds) {
          // Delete cutting components first
          const { data: cuttingJobs } = await supabase
            .from('cutting_jobs')
            .select('id')
            .eq('job_card_id', jobCardId);
          
          if (cuttingJobs && cuttingJobs.length > 0) {
            for (const job of cuttingJobs) {
              await supabase
                .from('cutting_components')
                .delete()
                .eq('cutting_job_id', job.id);
            }
          }
          
          // Delete cutting jobs
          await supabase
            .from('cutting_jobs')
            .delete()
            .eq('job_card_id', jobCardId);
          
          // Delete printing jobs
          await supabase
            .from('printing_jobs')
            .delete()
            .eq('job_card_id', jobCardId);
          
          // Delete stitching jobs
          await supabase
            .from('stitching_jobs')
            .delete()
            .eq('job_card_id', jobCardId);
        }
        
        // Delete all job cards after processing their children
        const { error: jobCardsDeleteError } = await supabase
          .from('job_cards')
          .delete()
          .eq('order_id', orderToDelete);
        
        if (jobCardsDeleteError) {
          console.error("Error deleting job cards:", jobCardsDeleteError);
          throw jobCardsDeleteError;
        }
      }
      
      // Finally delete the order itself
      const { error: orderDeleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderToDelete);
      
      if (orderDeleteError) {
        console.error("Error deleting order:", orderDeleteError);
        throw orderDeleteError;
      }
      
      console.log("Order and related records deleted successfully");
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
