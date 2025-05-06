
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/components/ui/enhanced-toast";

interface UseStockDetailProps {
  stockId: string | null;
  onClose: () => void;
}

export const useStockDetail = ({ stockId, onClose }: UseStockDetailProps) => {
  const queryClient = useQueryClient();

  const { data: stockItem, isLoading } = useQuery({
    queryKey: ["stock-detail", stockId],
    queryFn: async () => {
      if (!stockId) return null;
      
      console.log("Fetching stock details for ID:", stockId);
      
      // Modified query to include all fields
      const { data, error } = await supabase
        .from("inventory")
        .select(`
          *,
          suppliers(id, name, contact_person, email, phone, address, payment_terms),
          material_categories(id, name)
        `)
        .eq("id", stockId)
        .single();
        
      if (error) {
        console.error("Error fetching stock details:", error);
        throw error;
      }
      
      console.log("Stock details fetched:", data);
      return data;
    },
    enabled: !!stockId,
  });

  const { data: linkedComponents } = useQuery({
    queryKey: ["stock-linked-components", stockId],
    queryFn: async () => {
      if (!stockId) return [];
      
      const { data, error } = await supabase
        .from("catalog_components")
        .select("*, catalog(name)")
        .eq("material_id", stockId);
        
      if (error) {
        console.error("Error fetching linked components:", error);
        throw error;
      }
      return data || [];
    },
    enabled: !!stockId,
  });

  return {
    stockItem,
    linkedComponents,
    isLoading
  };
};
