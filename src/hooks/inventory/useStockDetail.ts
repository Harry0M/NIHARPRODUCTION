
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/components/ui/enhanced-toast";
import { StockTransaction } from "@/types/inventory";

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

  const { data: transactions } = useQuery({
    queryKey: ["stock-transactions", stockId],
    queryFn: async () => {
      if (!stockId) return [];
      
      const { data, error } = await supabase
        .from("inventory_transactions")
        .select("*")
        .eq("material_id", stockId)
        .order("created_at", { ascending: false });
        
      if (error) {
        console.error("Error fetching transactions:", error);
        throw error;
      }
      
      // Map raw transaction data to match the StockTransaction interface
      const mappedTransactions: StockTransaction[] = (data || []).map(item => ({
        id: item.id,
        material_id: item.material_id,
        inventory_id: item.inventory_id || stockId, // Use stockId as fallback
        quantity: item.quantity,
        created_at: item.created_at,
        reference_id: item.reference_id,
        reference_number: item.reference_number,
        reference_type: item.reference_type || null,
        notes: item.notes,
        unit_price: item.unit_price,
        transaction_type: item.transaction_type,
        location_id: item.location_id,
        batch_id: item.batch_id,
        roll_width: item.roll_width,
        updated_at: item.updated_at || null
      }));
      
      return mappedTransactions;
    },
    enabled: !!stockId,
  });

  return {
    stockItem,
    linkedComponents,
    transactions,
    isLoading
  };
};
