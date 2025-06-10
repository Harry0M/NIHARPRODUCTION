
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { reverseJobCardMaterialConsumption } from "@/utils/jobCardInventoryUtils";

export const useOrderDeletion = (onOrderDeleted: (orderId: string) => void) => {
  const navigate = useNavigate();
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
      console.log("Starting complete deletion process for order ID:", orderToDelete);
      
      // Step 1: First handle job card deletions with material consumption reversal
      // This is crucial as it triggers the existing job card deletion logic
      const { data: jobCards, error: jobCardsError } = await supabase
        .from('job_cards')
        .select(`
          id,
          job_number,
          order_id,
          order:orders(order_number)
        `)
        .eq('order_id', orderToDelete);

      if (jobCardsError) {
        console.error("Error fetching job cards:", jobCardsError);
        throw new Error(`Failed to fetch job cards: ${jobCardsError.message}`);
      }

      // Process each job card with material consumption reversal
      if (jobCards && jobCards.length > 0) {
        console.log(`Found ${jobCards.length} job cards to process for order deletion`);
        
        for (const jobCard of jobCards) {
          try {
            console.log(`Processing job card: ${jobCard.job_number}`);
            
            // Trigger the existing job card deletion logic with material reversal
            const reversalResult = await reverseJobCardMaterialConsumption(jobCard);
            
            if (!reversalResult.success && reversalResult.error) {
              console.warn(`Material consumption reversal had issues for ${jobCard.job_number}:`, reversalResult.error);
              // Continue with deletion even if reversal had issues
            } else if (reversalResult.revertedMaterials && reversalResult.revertedMaterials.length > 0) {
              console.log(`Successfully reversed material consumption for ${reversalResult.revertedMaterials.length} materials in job card ${jobCard.job_number}`);
            }
            
          } catch (error) {
            console.error(`Error processing job card ${jobCard.job_number}:`, error);
            // Continue with other job cards
          }
        }
      } else {
        console.log("No job cards found for this order");
      }
        // Step 2: Now call the database function to handle the rest of the deletion cascade
      console.log("Calling database deletion function...");
      const { error: deleteError } = await supabase.rpc(
        'delete_order_completely',
        { p_order_id: orderToDelete }
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
      
      console.log("Order deleted successfully with complete cascade");
      
      // First close the dialog and clean up state
      setDeleteDialogOpen(false);
      const deletedOrderId = orderToDelete;
      setOrderToDelete(null);
      setDeleteLoading(false);
      
      // Call the callback to update parent components
      onOrderDeleted(deletedOrderId);
      
      // Send a success notification
      toast({
        title: "Order deleted successfully",
        description: "The order and all related records (job cards, dispatch, sales) have been removed with inventory restoration.",
      });
      
    } catch (error: unknown) {
      console.error("Error in deletion process:", error);
      
      const errorMessage = error instanceof Error ? error.message : "An error occurred while deleting the order";
      
      toast({
        title: "Error deleting order",
        description: errorMessage,
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
