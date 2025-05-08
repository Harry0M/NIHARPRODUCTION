
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export type DateFilter = {
  startDate: Date | null;
  endDate: Date | null;
};

export type InventoryAnalyticsFilters = {
  dateRange: DateFilter;
  materialId?: string | null;
  orderIds?: string[] | null;
};

export const useInventoryAnalytics = (filters?: InventoryAnalyticsFilters) => {
  const [currentFilters, setFilters] = useState<InventoryAnalyticsFilters>(
    filters || {
      dateRange: { startDate: null, endDate: null },
      materialId: null,
      orderIds: null,
    }
  );

  // Fetch material consumption data
  const { data: consumptionData, isLoading: loadingConsumption } = useQuery({
    queryKey: ['material-consumption', currentFilters],
    queryFn: async () => {
      console.log("Fetching material consumption data with filters:", currentFilters);
      
      // Use the material_consumption_analysis view created in the SQL migration
      let query = supabase
        .from('material_consumption_analysis')
        .select('*');

      // Apply material filter if specified
      if (currentFilters.materialId) {
        query = query.eq('material_id', currentFilters.materialId);
      }

      // Execute the query
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching consumption data:", error);
        throw error;
      }
      
      // Format the data for display
      const formattedData = data.map(item => ({
        ...item,
        total_usage: item.total_consumption || 0,
        orders_count: item.orders_count || 0,
        first_usage_date: item.first_usage_date || null,
        last_usage_date: item.last_usage_date || null
      }));
      
      console.log(`Fetched ${formattedData.length} consumption records`);
      return formattedData || [];
    },
  });

  // Fetch order consumption breakdown
  const { data: orderConsumptionData, isLoading: loadingOrderConsumption } = useQuery({
    queryKey: ['order-consumption', currentFilters],
    queryFn: async () => {
      console.log("Fetching order consumption data with filters:", currentFilters);
      
      // Build base query
      let query = supabase
        .from('order_material_breakdown')
        .select('*');
      
      // Apply material filter
      if (currentFilters.materialId) {
        query = query.eq('material_id', currentFilters.materialId);
      }
      
      // Apply order filter
      if (currentFilters.orderIds && currentFilters.orderIds.length > 0) {
        query = query.in('order_id', currentFilters.orderIds);
      }
      
      // Apply date filter
      if (currentFilters.dateRange.startDate) {
        query = query.gte('usage_date', currentFilters.dateRange.startDate.toISOString());
      }
      
      if (currentFilters.dateRange.endDate) {
        query = query.lte('usage_date', currentFilters.dateRange.endDate.toISOString());
      }
      
      // Execute the query
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching order consumption data:", error);
        throw error;
      }
      
      console.log(`Fetched ${data?.length || 0} order consumption records`);
      
      // If no data yet or missing data, try to fetch from transaction logs
      if (!data || data.length === 0) {
        const { data: transactionData, error: txError } = await supabase
          .from('inventory_transaction_log')
          .select('*')
          .eq('reference_type', 'Order')
          .not('reference_id', 'is', null);
        
        if (txError) {
          console.error("Error fetching order transactions from logs:", txError);
          return data || [];
        }
        
        if (transactionData && transactionData.length > 0) {
          console.log(`Found ${transactionData.length} order transactions in logs`);
          
          // Map log data to order consumption format
          const mappedData = [];
          for (const tx of transactionData) {
            if (tx.metadata && tx.reference_id && tx.reference_number) {
              // Type-check the metadata object properly
              const metadata = tx.metadata as Record<string, any>;
              
              mappedData.push({
                order_id: tx.reference_id,
                order_number: tx.reference_number,
                company_name: metadata.company_name || 'Unknown',
                material_id: tx.material_id,
                material_name: metadata.material_name || 'Unknown Material',
                total_material_used: Math.abs(tx.quantity),
                unit: metadata.unit || 'units',
                usage_date: tx.transaction_date,
                component_type: metadata.component_type || 'Unknown'
              });
            }
          }
          
          console.log(`Mapped ${mappedData.length} transactions to order consumption format`);
          return mappedData;
        }
      }
      
      return data || [];
    },
  });

  // Fetch inventory value data
  const { data: inventoryValueData, isLoading: loadingInventoryValue } = useQuery({
    queryKey: ['inventory-value'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('id, material_name, quantity, unit, purchase_rate, reorder_level, min_stock_level');
      
      if (error) {
        console.error("Error fetching inventory value data:", error);
        throw error;
      }
      
      // Calculate total value for each material
      const items = (data || []).map(item => ({
        ...item,
        totalValue: (item.quantity || 0) * (item.purchase_rate || 0)
      }));
      
      // Calculate total value of all inventory
      const totalInventoryValue = items.reduce((sum, item) => sum + item.totalValue, 0);
      
      // Add percentage of total for each item
      return items.map(item => ({
        ...item,
        percentage: totalInventoryValue > 0 ? (item.totalValue / totalInventoryValue) * 100 : 0
      }));
    },
  });

  // Fetch inventory refill needs
  const { data: refillNeedsData, isLoading: loadingRefillNeeds } = useQuery({
    queryKey: ['refill-needs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('id, material_name, quantity, unit, purchase_rate, reorder_level, min_stock_level');
      
      if (error) {
        console.error("Error fetching refill needs data:", error);
        throw error;
      }
      
      const items = (data || []).map(item => {
        // Calculate value
        const totalValue = (item.quantity || 0) * (item.purchase_rate || 0);
        
        // Determine if refill is needed and urgency level
        const needsRefill = item.reorder_level && item.quantity < item.reorder_level;
        const urgency = calculateRefillUrgency(
          item.quantity,
          item.reorder_level,
          item.min_stock_level
        );
        
        return {
          ...item,
          totalValue,
          needsRefill: !!needsRefill,
          urgency
        };
      });
      
      return items;
    },
  });

  // Calculate refill urgency level
  const calculateRefillUrgency = (
    currentQuantity: number, 
    reorderLevel: number | null,
    minStockLevel: number | null
  ): 'critical' | 'warning' | 'normal' => {
    if (reorderLevel === null) return 'normal';
    
    // If below minimum stock level, it's critical
    if (minStockLevel !== null && currentQuantity < minStockLevel) {
      return 'critical';
    }
    
    // If below reorder level, it's a warning
    if (currentQuantity < reorderLevel) {
      return 'warning';
    }
    
    return 'normal';
  };

  // Fetch recent transactions for tracking consumption over time
  const { data: recentTransactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ['recent-transactions', currentFilters],
    queryFn: async () => {
      // Using both transaction tables for a comprehensive history
      const queriesPromises = [
        // Traditional transactions
        supabase
          .from('inventory_transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
          
        // New transaction logs  
        supabase
          .from('inventory_transaction_log')
          .select('*')
          .order('transaction_date', { ascending: false })
          .limit(50)
      ];
      
      if (currentFilters.materialId) {
        queriesPromises[0] = supabase
          .from('inventory_transactions')
          .select('*')
          .eq('material_id', currentFilters.materialId)
          .order('created_at', { ascending: false })
          .limit(50);
          
        queriesPromises[1] = supabase
          .from('inventory_transaction_log')
          .select('*')
          .eq('material_id', currentFilters.materialId)
          .order('transaction_date', { ascending: false })
          .limit(50);
      }
      
      try {
        const [txResult, logResult] = await Promise.all(queriesPromises);
        
        if (txResult.error) throw txResult.error;
        if (logResult.error) throw logResult.error;
        
        // Combine the results
        const combinedResults = {
          transactions: txResult.data || [],
          transactionLogs: logResult.data || []
        };
        
        console.log(`Fetched ${combinedResults.transactions.length} transactions and ${combinedResults.transactionLogs.length} transaction logs`);
        return combinedResults;
      } catch (error) {
        console.error("Error fetching recent transactions:", error);
        return { transactions: [], transactionLogs: [] };
      }
    },
  });

  const updateFilters = (newFilters: Partial<InventoryAnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    consumptionData,
    orderConsumptionData,
    inventoryValueData,
    refillNeedsData,
    recentTransactions,
    isLoading: loadingConsumption || loadingOrderConsumption || loadingInventoryValue || loadingRefillNeeds || loadingTransactions,
    filters: currentFilters,
    updateFilters,
  };
};
