import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/components/ui/enhanced-toast";
import { StockTransaction } from "@/types/inventory";
import { useState, useEffect } from "react";
import { manuallyCreateInventoryTransaction } from "@/utils/inventoryUtils";

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
  inventory_id?: string | null;
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Monitor local storage for inventory updates
  useEffect(() => {
    if (!stockId) return;
    
    console.log(`Setting up local storage monitoring for material ${stockId}`);
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'last_inventory_update') {
        try {
          console.log("Storage event detected for inventory update");
          const updatedMaterialIds = localStorage.getItem('updated_material_ids');
          if (updatedMaterialIds) {
            const materialIds = JSON.parse(updatedMaterialIds);
            if (materialIds.includes(stockId)) {
              console.log("Local storage update detected for this material, refreshing");
              queryClient.invalidateQueries({ queryKey: ["stock-transactions", stockId] });
              queryClient.invalidateQueries({ queryKey: ["stock-detail", stockId] });
              
              // Show notification
              showToast({
                title: "Material updated",
                description: "Refreshing transaction history",
                type: "info"
              });
            }
          }
        } catch (e) {
          console.error("Error handling storage change:", e);
        }
      }
    };
    
    // Also check for direct updates in this window (not just from other windows)
    const checkLocalStorage = () => {
      try {
        const updatedMaterialIds = localStorage.getItem('updated_material_ids');
        const lastUpdate = localStorage.getItem('last_inventory_update');
        
        if (updatedMaterialIds && lastUpdate) {
          const materialIds = JSON.parse(updatedMaterialIds);
          const updateTime = new Date(lastUpdate).getTime();
          const currentTime = new Date().getTime();
          const isRecent = (currentTime - updateTime) < 30000; // Within last 30 seconds
          
          if (isRecent && materialIds.includes(stockId)) {
            console.log("Recent local storage update detected for this material, refreshing");
            queryClient.invalidateQueries({ queryKey: ["stock-transactions", stockId] });
            queryClient.invalidateQueries({ queryKey: ["stock-detail", stockId] });
            
            // Try to get material update details
            const materialUpdateKey = `material_update_${stockId}`;
            const materialUpdateDetails = localStorage.getItem(materialUpdateKey);
            if (materialUpdateDetails) {
              try {
                const details = JSON.parse(materialUpdateDetails);
                console.log(`Material update details: previous=${details.previous}, new=${details.new}, consumed=${details.consumed || "N/A"}`);
                
                // Check if transaction creation was successful
                if (details.transactionSuccess === false) {
                  console.warn("Transaction creation failed during the update process");
                  // We'll try to recover by creating a new transaction
                  handleRecoveryTransactionCreation(details);
                }
              } catch (e) {
                console.error("Error parsing material update details:", e);
              }
            }
          }
        }
      } catch (e) {
        console.error("Error checking local storage:", e);
      }
    };
    
    // Helper function to try to recover from failed transaction creation
    const handleRecoveryTransactionCreation = async (details: any) => {
      if (!stockId) return;
      
      // Only attempt recovery for recent updates (last 5 minutes)
      const updateTime = new Date(details.timestamp).getTime();
      const currentTime = new Date().getTime();
      if ((currentTime - updateTime) > 5 * 60 * 1000) {
        console.log("Update is too old for transaction recovery");
        return;
      }
      
      try {
        console.log("Attempting to create recovery transaction");
        
        // Calculate change amount
        const changeAmount = details.new - details.previous;
        if (changeAmount === 0) return; // No actual change to record
        
        const transactionType = changeAmount > 0 ? "purchase" : "adjustment";
        const notes = `Recovery transaction: ${changeAmount > 0 ? 'Added' : 'Removed'} ${Math.abs(changeAmount)} units`;
        
        // Create a new transaction to record this change
        const result = await manuallyCreateInventoryTransaction(
          supabase,
          stockId,
          0, // We don't want to change the quantity again, just record the transaction
          transactionType,
          notes
        );
        
        if (result.success) {
          console.log("Successfully created recovery transaction");
          showToast({
            title: "Transaction record created",
            description: "A transaction record was created for a previous inventory change",
            type: "success"
          });
        } else {
          console.error("Failed to create recovery transaction:", result.error);
        }
      } catch (e) {
        console.error("Error in recovery transaction creation:", e);
      }
    };
    
    // Check immediately when the component mounts
    checkLocalStorage();
    
    // Add event listener for storage changes from other windows/tabs
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [stockId, queryClient]);

  const { data: stockItem, isLoading } = useQuery({
    queryKey: ["stock-detail", stockId],
    queryFn: async () => {
      if (!stockId) return null;
      
      console.log("Fetching stock details for ID:", stockId);
      
      try {
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
      } catch (err) {
        console.error("Error in stock detail fetch:", err);
        showToast({
          title: "Error loading stock details",
          description: "Could not load stock information. Please try again.",
          type: "error"
        });
        throw err;
      }
    },
    enabled: !!stockId,
  });

  const { data: linkedComponents } = useQuery({
    queryKey: ["stock-linked-components", stockId],
    queryFn: async () => {
      if (!stockId) return [];
      
      try {
        const { data, error } = await supabase
          .from("catalog_components")
          .select("*, catalog(name)")
          .eq("material_id", stockId);
          
        if (error) {
          console.error("Error fetching linked components:", error);
          throw error;
        }
        console.log(`Fetched ${data?.length || 0} linked components`);
        return data || [];
      } catch (err) {
        console.error("Error in linked components fetch:", err);
        return [];
      }
    },
    enabled: !!stockId,
  });

  const { 
    data: transactions, 
    isLoading: isTransactionsLoading,
    isError: isTransactionsError, 
    error: transactionsError, 
    refetch: refetchTransactions 
  } = useQuery({
    queryKey: ["stock-transactions", stockId],
    queryFn: async () => {
      if (!stockId) return [];
      
      setErrorMessage(null);
      
      // Added logging to track the query execution
      console.log(`Fetching transactions for material ID: ${stockId}`);
      
      try {
        // More explicit query with detailed logging
        console.log(`Running transaction query for material_id = ${stockId}`);
        
        const { data, error } = await supabase
          .from("inventory_transactions")
          .select("*")
          .eq("material_id", stockId)
          .order("created_at", { ascending: false });
          
        if (error) {
          console.error("Error fetching transactions:", error);
          setErrorMessage(`Error loading transactions: ${error.message}`);
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
      } catch (error: any) {
        console.error("Error in transaction fetch:", error);
        setErrorMessage(`Error loading transactions: ${error.message || "Unknown error"}`);
        showToast({
          title: "Error loading transactions",
          description: "Could not load transaction history. Please try refreshing.",
          type: "error"
        });
        return [];
      }
    },
    enabled: !!stockId,
    // More frequent refetching to ensure we get the latest data
    refetchInterval: 10000, // Refresh every 10 seconds while the component is visible
    refetchOnWindowFocus: true, // Refetch when window regains focus
    staleTime: 5000, // Data becomes stale after 5 seconds - fetch fresh data more often
  });

  // Function to manually refresh transactions
  const handleRefreshTransactions = async () => {
    if (isRefreshing) return Promise.resolve(false);
    
    setIsRefreshing(true);
    console.log("Manually refreshing transactions for stock:", stockId);
    
    try {
      // Force clear the cache first to ensure a fresh fetch
      queryClient.removeQueries({ queryKey: ["stock-transactions", stockId] });
      
      // Invalidate the query cache to force a fresh fetch
      queryClient.invalidateQueries({ queryKey: ["stock-transactions", stockId] });
      
      // Wait for the refetch to complete
      const result = await refetchTransactions();
      
      console.log("Transactions refresh complete:", {
        success: !result.error,
        count: result.data?.length || 0,
        data: result.data
      });
      
      // Show toast with results
      if (!result.error) {
        showToast({
          title: "Transactions refreshed",
          description: result.data && result.data.length > 0 
            ? `Found ${result.data.length} transaction(s)` 
            : "No transactions found for this material",
          type: "info"
        });
      }
      
      return true;
    } catch (error: any) {
      console.error("Error refreshing transactions:", error);
      showToast({
        title: "Error refreshing transactions",
        description: "Could not refresh transaction history. Please try again.",
        type: "error"
      });
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Function to create a test transaction (for debugging)
  const createTestTransaction = async () => {
    if (!stockId) return;
    
    try {
      const result = await manuallyCreateInventoryTransaction(
        supabase,
        stockId,
        1,
        "adjustment",
        "Test transaction created manually"
      );
      
      if (result.success) {
        showToast({
          title: "Test transaction created",
          description: "Successfully created a test transaction",
          type: "success"
        });
        
        // Refresh transactions to show the new one
        handleRefreshTransactions();
        return true;
      } else {
        console.error("Error creating test transaction:", result.error);
        showToast({
          title: "Error creating test transaction",
          description: result.error || "An unexpected error occurred",
          type: "error"
        });
        return false;
      }
    } catch (error: any) {
      console.error("Unexpected error in createTestTransaction:", error);
      showToast({
        title: "Error creating test transaction",
        description: error.message || "An unexpected error occurred",
        type: "error"
      });
      return false;
    }
  };

  return {
    stockItem,
    linkedComponents,
    transactions,
    isLoading,
    isRefreshing,
    isTransactionsLoading,
    isTransactionsError,
    transactionsError,
    errorMessage,
    refreshTransactions: handleRefreshTransactions,
    createTestTransaction
  };
};
