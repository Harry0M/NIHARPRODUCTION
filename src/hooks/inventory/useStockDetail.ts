
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

  const deleteStockMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log(`Attempting to delete stock with ID: ${id}`);
      try {
        const { error } = await supabase
          .from("inventory")
          .delete()
          .eq("id", id);
        
        if (error) {
          console.error("Error in delete operation:", error);
          throw error;
        }
        
        console.log("Delete operation completed successfully");
        return id;
      } catch (error) {
        console.error("Exception during delete operation:", error);
        throw error;
      }
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
      
      // Improved error message with more details
      let errorMessage = "Failed to delete stock item.";
      if (error.code === "23503") {
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

  return {
    stockItem,
    handleDelete,
    isDeleting: deleteStockMutation.isPending
  };
};
