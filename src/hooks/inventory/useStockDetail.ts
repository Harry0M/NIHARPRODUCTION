import { useQuery, useQueryClient } from "@tanstack/react-query";
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

  return {
    stockItem,
    isDeleting: false
  };
};
