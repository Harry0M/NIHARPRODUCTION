
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useDeleteInventoryItem = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteWithTransactions, setDeleteWithTransactions] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    name: string;
    hasTransactions: boolean;
  } | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      // First, delete related transactions if requested
      if (deleteWithTransactions) {
        // Delete inventory transactions
        const { error: txError } = await supabase
          .from('inventory_transactions')
          .delete()
          .eq('material_id', itemId);
        
        if (txError) {
          throw txError;
        }
        
        // Delete inventory transaction logs
        const { error: logError } = await supabase
          .from('inventory_transaction_log')
          .delete()
          .eq('material_id', itemId);
        
        if (logError) {
          throw logError;
        }
      }
      
      // Then delete the inventory item itself
      const { data, error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', itemId)
        .select();
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: (_, itemId) => {
      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.removeQueries({ queryKey: ["stock", itemId] });
      queryClient.removeQueries({ queryKey: ["stock-transactions", itemId] });
      queryClient.removeQueries({ queryKey: ["stock-transaction-logs", itemId] });

      toast({
        title: "Item deleted",
        description: `${itemToDelete?.name || "Item"} has been deleted successfully`,
      });
      
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error) => {
      console.error("Error deleting inventory item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const confirmDeleteItem = async () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
  };

  const openDeleteDialog = (item: {
    id: string;
    name: string;
    hasTransactions: boolean;
  }) => {
    setItemToDelete(item);
    setDeleteWithTransactions(false);
    setIsDeleteDialogOpen(true);
  };

  return {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    deleteWithTransactions,
    setDeleteWithTransactions,
    itemToDelete,
    confirmDeleteItem,
    openDeleteDialog,
    isDeleting: deleteMutation.isPending,
  };
};
