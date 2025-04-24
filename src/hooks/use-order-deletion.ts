
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Order } from "@/types/order";

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
      
      if (jobCardIds.length > 0) {
        console.log("Processing job cards for deletion:", jobCardIds);
        
        // Process each job card one by one
        for (const jobCardId of jobCardIds) {
          console.log("Processing job card:", jobCardId);
          
          // Delete cutting components
          try {
            const { data: cuttingJobs } = await supabase
              .from('cutting_jobs')
              .select('id')
              .eq('job_card_id', jobCardId);
            
            if (cuttingJobs && cuttingJobs.length > 0) {
              console.log(`Found ${cuttingJobs.length} cutting jobs to delete components from`);
              for (const job of cuttingJobs) {
                const { error } = await supabase
                  .from('cutting_components')
                  .delete()
                  .eq('cutting_job_id', job.id);
                
                if (error) {
                  console.error(`Error deleting cutting components for job ${job.id}:`, error);
                }
              }
            }
          } catch (error) {
            console.error("Error processing cutting components:", error);
          }
          
          // Delete cutting jobs
          try {
            const { error } = await supabase
              .from('cutting_jobs')
              .delete()
              .eq('job_card_id', jobCardId);
            
            if (error) {
              console.error(`Error deleting cutting jobs for card ${jobCardId}:`, error);
            }
          } catch (error) {
            console.error("Error deleting cutting jobs:", error);
          }
          
          // Delete printing jobs
          try {
            const { error } = await supabase
              .from('printing_jobs')
              .delete()
              .eq('job_card_id', jobCardId);
            
            if (error) {
              console.error(`Error deleting printing jobs for card ${jobCardId}:`, error);
            }
          } catch (error) {
            console.error("Error deleting printing jobs:", error);
          }
          
          // Delete stitching jobs
          try {
            const { error } = await supabase
              .from('stitching_jobs')
              .delete()
              .eq('job_card_id', jobCardId);
            
            if (error) {
              console.error(`Error deleting stitching jobs for card ${jobCardId}:`, error);
            }
          } catch (error) {
            console.error("Error deleting stitching jobs:", error);
          }
        }
        
        // Delete job cards after processing all their children
        try {
          console.log("Deleting job cards:", jobCardIds);
          const { error } = await supabase
            .from('job_cards')
            .delete()
            .eq('order_id', orderToDelete);
          
          if (error) {
            console.error("Error deleting job cards:", error);
            throw error;
          }
        } catch (error) {
          console.error("Error in job card deletion:", error);
        }
      }
      
      // Delete order components
      try {
        console.log("Deleting order components");
        const { error } = await supabase
          .from('order_components')
          .delete()
          .eq('order_id', orderToDelete);
        
        if (error) {
          console.error("Error deleting order components:", error);
        }
      } catch (error) {
        console.error("Error in order component deletion:", error);
      }
      
      // Delete order dispatch
      try {
        console.log("Deleting order dispatches");
        const { error } = await supabase
          .from('order_dispatches')
          .delete()
          .eq('order_id', orderToDelete);
        
        if (error) {
          console.error("Error deleting order dispatches:", error);
        }
      } catch (error) {
        console.error("Error in order dispatch deletion:", error);
      }
      
      // Delete the order itself
      try {
        console.log("Deleting the order itself");
        const { error: orderDeleteError } = await supabase
          .from('orders')
          .delete()
          .eq('id', orderToDelete);
        
        if (orderDeleteError) {
          console.error("Error deleting order:", orderDeleteError);
          throw orderDeleteError;
        }
      } catch (error) {
        console.error("Error in final order deletion:", error);
        throw error;
      }
      
      onOrderDeleted(orderToDelete);
      
      toast({
        title: "Order deleted successfully",
        description: "The order and all related records have been removed.",
      });
      console.log("Order deleted successfully");
      
    } catch (error: any) {
      console.error("Error deleting order:", error);
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
