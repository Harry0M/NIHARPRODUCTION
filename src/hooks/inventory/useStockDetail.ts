
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/components/ui/enhanced-toast";

interface UseStockDetailProps {
  stockId: string | null;
  onClose: () => void;
}

export const useStockDetail = ({ stockId, onClose }: UseStockDetailProps) => {
  const queryClient = useQueryClient();

  const { data: stockItem } = useQuery({
    queryKey: ["stock-detail", stockId],
    queryFn: async () => {
      if (!stockId) return null;
      
      const { data, error } = await supabase
        .from("inventory")
        .select("*, suppliers(name)")
        .eq("id", stockId)
        .single();
        
      if (error) {
        console.error("Error fetching stock details:", error);
        throw error;
      }
      return data;
    },
    enabled: !!stockId,
  });

  // New enhanced delete stock mutation
  const deleteStockMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log(`Initiating stock deletion for ID: ${id}`);
      
      // First check if there are any transactions referencing this stock item
      const { data: transactionReferences, error: checkError } = await supabase
        .from("inventory_transactions")
        .select("id")
        .eq("material_id", id)
        .limit(1);
      
      if (checkError) {
        console.error("Error checking inventory transaction references:", checkError);
        throw checkError;
      }
      
      // If this stock is referenced by transactions, throw a user-friendly error
      if (transactionReferences && transactionReferences.length > 0) {
        console.log(`Stock ID ${id} is referenced by transactions and cannot be deleted`);
        throw new Error("REFERENCE_ERROR");
      }
      
      // Proceed with deletion if no references exist
      const { error: deleteError } = await supabase
        .from("inventory")
        .delete()
        .eq("id", id);
      
      if (deleteError) {
        console.error("Error in delete operation:", deleteError);
        throw deleteError;
      }
      
      console.log("Delete operation completed successfully");
      return id;
    },
    onSuccess: (deletedId) => {
      console.log(`Stock ${deletedId} deleted successfully, invalidating queries`);
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      
      showToast({
        title: "Stock deleted",
        description: "The stock item has been removed from inventory",
        type: "success"
      });
      
      // Small delay before closing to ensure state updates are complete
      setTimeout(() => {
        console.log("Closing dialog after successful deletion");
        onClose();
      }, 300);
    },
    onError: (error: any) => {
      console.error("Error deleting stock:", error);
      
      // Enhanced error message handling with specific messages for different error types
      let errorMessage = "Failed to delete stock item.";
      
      if (error.message === "REFERENCE_ERROR") {
        errorMessage = "This item cannot be deleted because it is referenced by inventory transactions.";
      } else if (error.code === "23503") {
        errorMessage = "This stock item is referenced by other records and cannot be deleted.";
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      showToast({
        title: "Delete failed",
        description: errorMessage,
        type: "error"
      });
    },
  });

  const handleDelete = (id: string) => {
    if (id) {
      console.log(`Handling delete for stock ID: ${id}`);
      deleteStockMutation.mutate(id);
    }
  };

  // Alternative delete function with forced navigation for handling edge cases
  const forceDeleteStock = (id: string) => {
    if (!id) return;

    console.log(`Force deleting stock with ID: ${id}`);
    deleteStockMutation.mutate(id);
  };

  return {
    stockItem,
    handleDelete,
    forceDeleteStock,
    isDeleting: deleteStockMutation.isPending
  };
};
