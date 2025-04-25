
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
      
      console.log("Found job cards:", jobCards);
      
      // Process job cards if they exist
      if (jobCards && jobCards.length > 0) {
        const jobCardIds = jobCards.map(jc => jc.id);
        console.log("Job card IDs to process:", jobCardIds);
        
        // Delete cutting components first (children of cutting jobs)
        for (const jobCardId of jobCardIds) {
          // Get all cutting jobs for this job card
          const { data: cuttingJobs, error: cuttingJobsError } = await supabase
            .from('cutting_jobs')
            .select('id')
            .eq('job_card_id', jobCardId);
          
          if (cuttingJobsError) {
            console.error("Error fetching cutting jobs:", cuttingJobsError);
            throw cuttingJobsError;
          }
          
          if (cuttingJobs && cuttingJobs.length > 0) {
            console.log(`Found ${cuttingJobs.length} cutting jobs to delete`);
            for (const job of cuttingJobs) {
              // Delete cutting components for this cutting job
              const { error: componentsDeleteError } = await supabase
                .from('cutting_components')
                .delete()
                .eq('cutting_job_id', job.id);
                
              if (componentsDeleteError) {
                console.error("Error deleting cutting components:", componentsDeleteError);
                throw componentsDeleteError;
              }
            }
            
            // Then delete the cutting jobs
            const { error: cuttingDeleteError } = await supabase
              .from('cutting_jobs')
              .delete()
              .eq('job_card_id', jobCardId);
            
            if (cuttingDeleteError) {
              console.error("Error deleting cutting jobs:", cuttingDeleteError);
              throw cuttingDeleteError;
            }
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
          .eq('order_id', orderToDelete);
        
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
      
      // Fix: Remove any .select() call as we're just deleting
      console.log("Deleting the order itself:", orderToDelete);
      const { error: orderDeleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderToDelete);
      
      if (orderDeleteError) {
        console.error("Error deleting order:", orderDeleteError);
        throw orderDeleteError;
      }
      
      // Add a longer delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Verify the order doesn't exist anymore
      const { data: checkOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('id', orderToDelete)
        .maybeSingle();
      
      // If after deletion the record still exists, retry with a different approach
      if (checkOrder) {
        console.log("Order still exists after deletion, trying alternate approach");
        
        // Try a direct deletion with no filtering or selection
        const { error: finalDeleteAttempt } = await supabase
          .from('orders')
          .delete()
          .filter('id', 'eq', orderToDelete);
        
        // Add one more delay to ensure consistency
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Final verification
        const { data: finalCheck } = await supabase
          .from('orders')
          .select('id')
          .eq('id', orderToDelete)
          .maybeSingle();
          
        if (finalCheck) {
          throw new Error("Order deletion failed after multiple attempts");
        }
      }
      
      console.log("Order and related records deleted successfully");
      
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
      // Ensure UI returns to normal state even if there's an error
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
