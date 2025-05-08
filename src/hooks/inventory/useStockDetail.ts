
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/components/ui/enhanced-toast";
import { StockTransaction } from "@/types/inventory";

interface UseStockDetailProps {
  stockId: string | null;
  onClose: () => void;
}

// Define an interface to represent what we actually receive from the database
interface RawTransactionData {
  id: string;
  material_id: string;
  quantity: number;
  created_at: string;
  transaction_type: string;
  // Fields that might be missing in some database records
  inventory_id?: string;
  reference_id?: string | null;
  reference_number?: string | null;
  reference_type?: string | null;
  notes?: string | null;
  unit_price?: number | null;
  location_id?: string | null;
  batch_id?: string | null;
  roll_width?: number | null;
  updated_at?: string | null;
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
      
      // Added logging to track the query execution
      console.log(`Fetching transactions for material ID: ${stockId}`);
      
      const { data, error } = await supabase
        .from("inventory_transactions")
        .select("*")
        .eq("material_id", stockId)
        .order("created_at", { ascending: false });
        
      if (error) {
        console.error("Error fetching transactions:", error);
        throw error;
      }
      
      // Log the raw data from database to inspect its structure
      console.log("Raw transaction data:", data);
      console.log("Transaction count:", data?.length || 0);
      
      // If no transactions, return empty array early
      if (!data || data.length === 0) {
        return [];
      }
      
      // Explicitly cast the data to RawTransactionData array for better type safety
      const rawData = data as RawTransactionData[];
      
      // Map raw transaction data to match the StockTransaction interface
      const mappedTransactions: StockTransaction[] = rawData.map(item => {
        // Create a properly typed transaction object with fallbacks for missing properties
        const transaction: StockTransaction = {
          id: item.id,
          material_id: item.material_id,
          // This field might be missing in the database, use stockId as fallback
          inventory_id: item.inventory_id ?? stockId ?? item.material_id,
          quantity: item.quantity,
          created_at: item.created_at,
          reference_id: item.reference_id ?? null,
          reference_number: item.reference_number ?? null,
          // These fields might be missing, use null as fallback
          reference_type: item.reference_type ?? null,
          notes: item.notes ?? null,
          unit_price: item.unit_price ?? null,
          transaction_type: item.transaction_type,
          location_id: item.location_id ?? null,
          batch_id: item.batch_id ?? null,
          roll_width: item.roll_width ?? null,
          // This field might be missing, use null or created_at as fallback
          updated_at: item.updated_at ?? item.created_at ?? null
        };
        
        return transaction;
      });
      
      return mappedTransactions;
    },
    enabled: !!stockId,
    // Add more frequent refetching to ensure we get the latest data
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  return {
    stockItem,
    linkedComponents,
    transactions,
    isLoading,
    // Add a method to manually refetch transactions
    refetchTransactions: () => queryClient.invalidateQueries({
      queryKey: ["stock-transactions", stockId]
    })
  };
};
