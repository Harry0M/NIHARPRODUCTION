
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/components/ui/enhanced-toast";

// Hook for deleting inventory items
export const useDeleteInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (materialId: string) => {
      try {
        // First attempt to use the RPC function that properly handles cascading deletes
        const { data: rpcResult, error: rpcError } = await supabase
          .rpc('delete_inventory_with_transactions', { 
            input_material_id: materialId 
          });

        if (rpcError) {
          console.error("RPC delete failed:", rpcError);
          
          // Fallback: Direct delete from inventory table
          // Note: This will fail if there are foreign key constraints
          const { error: deleteError } = await supabase
            .from('inventory')
            .delete()
            .eq('material_id', materialId);
            
          if (deleteError) {
            throw deleteError;
          }
        }

        return { success: true, materialId };
      } catch (error: any) {
        console.error("Delete error:", error);
        throw error;
      }
    },
    onSuccess: (_, materialId) => {
      // Invalidate relevant queries to update UI
      queryClient.invalidateQueries({ queryKey: ['inventoryStocks'] });
      queryClient.invalidateQueries({ queryKey: ['stockDetail', materialId] });
      
      showToast({
        title: "Item deleted successfully",
        description: "The inventory item has been removed from the system.",
        type: "success"
      });
    },
    onError: (error: any) => {
      console.error("Delete mutation error:", error);
      
      showToast({
        title: "Failed to delete item",
        description: error.message || "An unexpected error occurred",
        type: "error"
      });
    }
  });
};
