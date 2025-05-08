import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/components/ui/enhanced-toast";
import { StockTransaction, TransactionLog } from "@/types/inventory";
import { useState, useEffect } from "react";
import { manuallyCreateInventoryTransaction } from "@/utils/inventoryUtils";

interface UseStockDetailProps {
  stockId: string | null;
  onClose: () => void;
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
              queryClient.invalidateQueries({ queryKey: ["stock-transaction-logs", stockId] });
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
    
    // Check for direct updates in this window
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
            queryClient.invalidateQueries({ queryKey: ["stock-transaction-logs", stockId] });
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

  // Update the transactions query to ensure proper typing
  const { data: transactions, isLoading: isTransactionsLoading, refetch: refetchTransactions } = useQuery({
    queryKey: ["stock-transactions", stockId],
    queryFn: async () => {
      if (!stockId) return [];
      
      setErrorMessage(null);
      console.log(`Fetching transactions for material ID: ${stockId}`);
      
      try {
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
        
        console.log("Transaction count:", data?.length || 0);
        
        // Map the data to the StockTransaction interface
        const transactions: StockTransaction[] = (data || []).map(item => ({
          id: item.id,
          material_id: item.material_id,
          inventory_id: item.inventory_id || stockId || item.material_id,
          quantity: item.quantity,
          created_at: item.created_at,
          reference_id: item.reference_id || null,
          reference_number: item.reference_number || null,
          reference_type: item.reference_type || null,
          notes: item.notes || null,
          unit_price: item.unit_price || null,
          transaction_type: item.transaction_type,
          location_id: item.location_id || null,
          batch_id: item.batch_id || null,
          roll_width: item.roll_width || null,
          updated_at: item.created_at || null, // Use created_at as updated_at if it doesn't exist
          unit: item.unit || null
        }));
        
        return transactions;
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
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });

  // Fetch from the new transaction log table with proper typing for the metadata field
  const { data: transactionLogs, isLoading: isTransactionLogsLoading, refetch: refetchTransactionLogs } = useQuery({
    queryKey: ["stock-transaction-logs", stockId],
    queryFn: async () => {
      if (!stockId) return [];
      
      console.log(`Fetching transaction logs for material ID: ${stockId}`);
      
      try {
        const { data, error } = await supabase
          .from("inventory_transaction_log")
          .select("*")
          .eq("material_id", stockId)
          .order("transaction_date", { ascending: false });
          
        if (error) {
          console.error("Error fetching transaction logs:", error);
          throw error;
        }
        
        console.log("Transaction logs count:", data?.length || 0);
        
        // Return the data directly, our TransactionLog interface now handles the Json type
        return data || [];
      } catch (error: any) {
        console.error("Error in transaction logs fetch:", error);
        return [];
      }
    },
    enabled: !!stockId,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });

  // Function to manually refresh transactions
  const handleRefreshTransactions = async () => {
    if (isRefreshing) return Promise.resolve(false);
    
    setIsRefreshing(true);
    console.log("Manually refreshing transactions for stock:", stockId);
    
    try {
      // Force clear the cache first to ensure a fresh fetch
      queryClient.removeQueries({ queryKey: ["stock-transactions", stockId] });
      queryClient.removeQueries({ queryKey: ["stock-transaction-logs", stockId] });
      
      // Invalidate the query cache to force a fresh fetch
      queryClient.invalidateQueries({ queryKey: ["stock-transactions", stockId] });
      queryClient.invalidateQueries({ queryKey: ["stock-transaction-logs", stockId] });
      
      // Wait for the refetch to complete
      const [txResult, logResult] = await Promise.all([
        refetchTransactions(),
        refetchTransactionLogs()
      ]);
      
      console.log("Transactions refresh complete:", {
        transactions: txResult.data?.length || 0,
        logs: logResult.data?.length || 0
      });
      
      // Show toast with results
      if (!txResult.error && !logResult.error) {
        const totalCount = (txResult.data?.length || 0) + (logResult.data?.length || 0);
        showToast({
          title: "Transactions refreshed",
          description: totalCount > 0 
            ? `Found ${totalCount} transaction records` 
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
  
  // Function to create a test transaction
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
    transactionLogs,
    isLoading,
    isRefreshing,
    isTransactionsLoading,
    isTransactionLogsLoading,
    errorMessage,
    refreshTransactions: handleRefreshTransactions,
    createTestTransaction
  };
};
