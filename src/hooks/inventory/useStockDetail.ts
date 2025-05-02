
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseStockDetailProps {
  stockId: string | null;
  onClose: () => void;
}

export const useStockDetail = ({ stockId, onClose }: UseStockDetailProps) => {
  const { toast } = useToast();
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
        
      if (error) throw error;
      return data;
    },
    enabled: !!stockId,
  });

  const deleteStockMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log(`Attempting to delete stock with ID: ${id}`);
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
    },
    onSuccess: () => {
      console.log("Delete mutation successful, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({
        title: "Stock deleted",
        description: "The stock item has been removed from inventory",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Error deleting stock:", error);
      toast({
        title: "Error",
        description: "Failed to delete stock item. It might be referenced by other records.",
        variant: "destructive",
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
