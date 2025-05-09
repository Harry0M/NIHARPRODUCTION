
import { useState } from "react";
import { showToast } from "@/components/ui/enhanced-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDeleteInventoryItem() {
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  
  const deleteItem = async (id: string) => {
    setIsDeleting(true);
    try {
      // Check if we're using a function that doesn't exist and update it
      // Instead of using "delete_inventory_with_transactions" which isn't defined in the available Supabase functions
      // We'll directly delete from the inventory table
      
      const { data, error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }

      // Show success toast
      showToast({
        title: "Item deleted",
        description: "The inventory item has been deleted",
        type: "success"
      });
      
      // Invalidate inventory queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      return { success: true };
    } catch (error: any) {
      console.error("Error deleting inventory item:", error);
      
      showToast({
        title: "Error deleting item",
        description: error.message || "An error occurred while deleting the item",
        type: "error"
      });
      
      return { success: false, error };
    } finally {
      setIsDeleting(false);
    }
  };
  
  return {
    deleteItem,
    isDeleting
  };
}
