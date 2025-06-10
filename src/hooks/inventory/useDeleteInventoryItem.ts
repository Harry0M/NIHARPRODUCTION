
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeletionPreview {
  inventory_id: string;
  material_name: string;
  deletion_preview: {
    will_be_deleted: {
      inventory_item: boolean;
      non_consumption_transactions: number;
      catalog_material_references: number;
    };
    will_be_preserved: {
      consumption_transactions: number;
      purchase_history: number;
      order_history: number;
    };
    will_be_modified: {
      purchase_items_lose_material_ref: number;
      order_components_lose_material_ref: number;
    };
  };
  summary: string;
}

export const useDeleteInventoryItem = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteWithTransactions, setDeleteWithTransactions] = useState(false);
  const [deletionPreview, setDeletionPreview] = useState<DeletionPreview | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    name: string;
    hasTransactions: boolean;
  } | null>(null);  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      // Use the improved hard delete function that preserves consumption transactions
      // Type assertion needed since the function isn't in the generated types yet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('hard_delete_inventory_with_consumption_preserve', {
        input_inventory_id: itemId
      });

      if (error) {
        throw error;
      }

      return data;
    },onSuccess: (result, itemId) => {
      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.removeQueries({ queryKey: ["stock", itemId] });
      queryClient.removeQueries({ queryKey: ["stock-transactions", itemId] });
      queryClient.removeQueries({ queryKey: ["stock-transaction-logs", itemId] });

      // Show enhanced success message with deletion summary
      const summary = (result as { message?: string })?.message || `${itemToDelete?.name || "Item"} has been deleted successfully`;
      
      toast({
        title: "Inventory item hard deleted",
        description: summary,
      });
      
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      setDeletionPreview(null);
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
  };  const previewDeletion = async (itemId: string) => {
    try {
      // Type assertion needed since the function isn't in the generated types yet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('preview_inventory_hard_deletion', {
        input_inventory_id: itemId
      });

      if (error) {
        console.error("Error getting deletion preview:", error);
        return null;
      }

      return data as DeletionPreview;
    } catch (error) {
      console.error("Error getting deletion preview:", error);
      return null;
    }
  };

  const openDeleteDialog = async (item: {
    id: string;
    name: string;
    hasTransactions: boolean;
  }) => {
    setItemToDelete(item);
    setDeleteWithTransactions(false);
    
    // Get deletion preview
    const preview = await previewDeletion(item.id);
    setDeletionPreview(preview);
    
    setIsDeleteDialogOpen(true);
  };
  return {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    deleteWithTransactions,
    setDeleteWithTransactions,
    itemToDelete,
    deletionPreview,
    confirmDeleteItem,
    openDeleteDialog,
    previewDeletion,
    isDeleting: deleteMutation.isPending,
  };
};
