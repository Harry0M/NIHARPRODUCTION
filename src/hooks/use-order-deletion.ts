
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
      
      // Find all job cards associated with this order
      const { data: jobCards, error: jobCardsError } = await supabase
        .from('job_cards')
        .select('id')
        .eq('order_id', orderToDelete);
      
      if (jobCardsError) {
        console.error("Error fetching job cards:", jobCardsError);
        throw jobCardsError;
      }
      
      console.log(`Found ${jobCards?.length || 0} job cards for order`);
      
      // Process job cards if they exist
      if (jobCards && jobCards.length > 0) {
        const jobCardIds = jobCards.map(jc => jc.id);
        console.log("Job card IDs to process:", jobCardIds);
        
        // Delete cutting components first (children of cutting jobs)
        for (const jobCardId of jobCardIds) {
          const { data: cuttingJobs } = await supabase
            .from('cutting_jobs')
            .select('id')
            .eq('job_card_id', jobCardId);
          
          if (cuttingJobs && cuttingJobs.length > 0) {
            console.log(`Deleting cutting components for ${cuttingJobs.length} cutting jobs`);
            for (const job of cuttingJobs) {
              const { error: componentsDeleteError } = await supabase
                .from('cutting_components')
                .delete()
                .eq('cutting_job_id', job.id);
                
              if (componentsDeleteError) {
                console.error("Error deleting cutting components:", componentsDeleteError);
                throw componentsDeleteError;
              }
            }
          }
          
          // Delete cutting jobs
          const { error: cuttingDeleteError } = await supabase
            .from('cutting_jobs')
            .delete()
            .eq('job_card_id', jobCardId);
          
          if (cuttingDeleteError) {
            console.error("Error deleting cutting jobs:", cuttingDeleteError);
            throw cuttingDeleteError;
          }
          
          // Delete printing jobs
          const { error: printingDeleteError } = await supabase
            .from('printing_jobs')
            .delete()
            .eq('job_card_id', jobCardId);
          
          if (printingDeleteError) {
            console.error("Error deleting printing jobs:", printingDeleteError);
            throw printingDeleteError;
          }
          
          // Delete stitching jobs
          const { error: stitchingDeleteError } = await supabase
            .from('stitching_jobs')
            .delete()
            .eq('job_card_id', jobCardId);
          
          if (stitchingDeleteError) {
            console.error("Error deleting stitching jobs:", stitchingDeleteError);
            throw stitchingDeleteError;
          }
        }
        
        // Delete job cards after processing their children
        console.log("Deleting job cards:", jobCardIds);
        const { error: jobCardsDeleteError } = await supabase
          .from('job_cards')
          .delete()
          .in('id', jobCardIds);
        
        if (jobCardsDeleteError) {
          console.error("Error deleting job cards:", jobCardsDeleteError);
          throw jobCardsDeleteError;
        }
      }
      
      // Delete order components
      console.log("Deleting order components for order:", orderToDelete);
      const { error: componentsError } = await supabase
        .from('order_components')
        .delete()
        .eq('order_id', orderToDelete);
      
      if (componentsError) {
        console.error("Error deleting order components:", componentsError);
        throw componentsError;
      }
      
      // Delete order dispatches
      console.log("Deleting order dispatches for order:", orderToDelete);
      const { error: dispatchesError } = await supabase
        .from('order_dispatches')
        .delete()
        .eq('order_id', orderToDelete);
      
      if (dispatchesError) {
        console.error("Error deleting order dispatches:", dispatchesError);
        throw dispatchesError;
      }
      
      // Finally delete the order itself - with verification
      console.log("Deleting the order itself:", orderToDelete);
      const { error: orderDeleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderToDelete);
      
      if (orderDeleteError) {
        console.error("Error deleting order:", orderDeleteError);
        throw orderDeleteError;
      }
      
      // Verify order was actually deleted
      const { data: checkOrder, error: checkError } = await supabase
        .from('orders')
        .select('id')
        .eq('id', orderToDelete)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means "no rows returned" which is what we want
        console.error("Error verifying order deletion:", checkError);
        throw new Error("Failed to verify order deletion");
      }
      
      if (checkOrder) {
        console.error("Order still exists after deletion attempt");
        throw new Error("Order deletion failed - order still exists in database");
      }
      
      console.log("Order verified as deleted successfully");
      
      // Update UI state
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
