import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { calculateRefillUrgency } from "@/utils/analysisUtils";

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
      
      // Use the material_consumption_analysis view
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

  // Fetch order consumption breakdown with client-side deduplication
  const { data: orderConsumptionData, isLoading: loadingOrderConsumption } = useQuery({
    queryKey: ['order-consumption', currentFilters],
    queryFn: async () => {
      console.log("Fetching order consumption data with filters:", currentFilters);
      
      // First fetch the inventory data to get purchase prices
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('id, material_name, purchase_rate');
        
      if (inventoryError) {
        console.error("Error fetching inventory data for purchase prices:", inventoryError);
      }
      
      // Create a lookup map for purchase prices
      const materialPriceMap = new Map();
      (inventoryData || []).forEach(item => {
        if (item.id && item.purchase_rate) {
          materialPriceMap.set(item.id, Number(item.purchase_rate));
        }
      });
      
      console.log("Loaded purchase prices for", materialPriceMap.size, "materials");
      
      // 1. Now fetch from the order_material_breakdown table
      let query = supabase
        .from('order_material_breakdown')
        .select('*');
      
      // Apply filters
      if (currentFilters.materialId) {
        query = query.eq('material_id', currentFilters.materialId);
      }
      
      if (currentFilters.orderIds && currentFilters.orderIds.length > 0) {
        query = query.in('order_id', currentFilters.orderIds);
      }
      
      if (currentFilters.dateRange.startDate) {
        query = query.gte('usage_date', currentFilters.dateRange.startDate.toISOString());
      }
      
      if (currentFilters.dateRange.endDate) {
        query = query.lte('usage_date', currentFilters.dateRange.endDate.toISOString());
      }
      
      // Execute the main query
      const { data: breakdownData, error: breakdownError } = await query;
      
      if (breakdownError) {
        console.error("Error fetching order breakdown data:", breakdownError);
      }
      
      // 2. Also fetch transaction log data for the same materials/orders
      let logQuery = supabase
        .from('inventory_transaction_log')
        .select('*');
      
      // Apply material filter
      if (currentFilters.materialId) {
        logQuery = logQuery.eq('material_id', currentFilters.materialId);
      }
      
      // Apply order filter - use reference_id for orders
      if (currentFilters.orderIds && currentFilters.orderIds.length > 0) {
        logQuery = logQuery.in('reference_id', currentFilters.orderIds);
      } else {
        // Just get order-related transactions
        logQuery = logQuery.eq('reference_type', 'Order');
      }
      
      // Apply date filter
      if (currentFilters.dateRange.startDate) {
        logQuery = logQuery.gte('transaction_date', currentFilters.dateRange.startDate.toISOString());
      }
      
      if (currentFilters.dateRange.endDate) {
        logQuery = logQuery.lte('transaction_date', currentFilters.dateRange.endDate.toISOString());
      }
      
      // Execute transaction log query
      const { data: logData, error: logError } = await logQuery;
      
      if (logError) {
        console.error("Error fetching transaction log data:", logError);
      }
      
      // 3. Process and deduplicate the combined data
      
      // First, convert log data to the same format as order_material_breakdown
      const convertedLogData = (logData || []).map(log => {
        // Skip null or undefined logs
        if (!log) return null;
        
        // Get metadata or use empty object if undefined
        const metadata = log.metadata || {};
        
        // Skip non-consumption transactions (e.g., quantity adjustments)
        const isConsumption = 
          (log.quantity < 0) || 
          (log.transaction_type && String(log.transaction_type).toLowerCase().includes('consum')) ||
          (log.notes && String(log.notes).toLowerCase().includes('consum'));
          
        if (!isConsumption) return null;
        
        return {
          order_id: log.reference_id || '',
          order_number: log.reference_number || '',
          material_id: log.material_id || '',
          material_name: typeof metadata === 'object' && metadata ? String(metadata.material_name || 'Unknown') : 'Unknown',
          total_material_used: Math.abs(Number(log.quantity) || 0),
          unit: typeof metadata === 'object' && metadata ? String(metadata.unit || 'units') : 'units',
          usage_date: log.transaction_date || new Date().toISOString(),
          company_name: typeof metadata === 'object' && metadata ? String(metadata.company_name || 'Unknown') : 'Unknown',
          component_type: typeof metadata === 'object' && metadata ? String(metadata.component_type || 'Unknown') : 'Unknown',
          // Handle purchase_price safely with type checking
          purchase_price: typeof metadata === 'object' && metadata && 'purchase_price' in metadata ? Number(metadata.purchase_price) : 0,
          source: 'transaction_log',
          log_id: log.id
        };
      }).filter(Boolean); // Remove null entries
      
      // Combine data sources
      const breakdownItems = (breakdownData || []).map(item => ({...item, source: 'breakdown'}));
      
      // Log the data sources for debugging
      console.log(`Found ${breakdownItems.length} records from order_material_breakdown`);
      console.log(`Found ${convertedLogData.length} valid consumption records from transaction log`);
      
      const combinedData = [...breakdownItems, ...convertedLogData];
      
      // Create a map to track unique transactions
      const uniqueTransactions = new Map();
      
      // Process all transactions
      combinedData.forEach(tx => {
        // Skip incomplete entries
        if (!tx.order_id || !tx.material_id) return;
        
        // Create a unique key for the order+material+approximate date
        const date = tx.usage_date ? new Date(tx.usage_date) : new Date();
        date.setMinutes(0, 0, 0); // Round to nearest hour to account for small timing differences
        const uniqueKey = `${tx.order_id}_${tx.material_id}_${date.toISOString()}`;
        
        // If we already have this transaction, only update if current one has more info
        if (uniqueTransactions.has(uniqueKey)) {
          const existing = uniqueTransactions.get(uniqueKey);
          
          // Prefer breakdown source as it's more likely to have complete info
          if (tx.source === 'breakdown' && existing.source === 'transaction_log') {
            uniqueTransactions.set(uniqueKey, tx);
          }
        } else {
          // First time seeing this transaction
          uniqueTransactions.set(uniqueKey, tx);
        }
      });
      
      // Convert back to array
      const deduplicated = Array.from(uniqueTransactions.values());
      
      // Make sure all required fields are present with proper types
      const formattedData = deduplicated.map(item => {
        // Use the price from the material price map if available
        const materialPrice = item.material_id ? materialPriceMap.get(item.material_id) : 0;
        
        // Prioritize existing purchase_price if it exists, otherwise use the price from inventory
        const purchasePrice = Number(item.purchase_price) || materialPrice || 0;
        
        return {
          order_id: item.order_id,
          order_number: item.order_number || '',
          company_name: item.company_name || 'Unknown',
          usage_date: item.usage_date || new Date().toISOString(),
          material_id: item.material_id,
          material_name: item.material_name || 'Unknown',
          total_material_used: Number(item.total_material_used) || 0,
          unit: item.unit || 'units',
          component_type: item.component_type || 'Unknown',
          purchase_price: purchasePrice // Now with correct price from inventory if needed
        };
      });
      
      console.log(`Processed ${formattedData.length} order consumption records after deduplication`);
      return formattedData;
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
        totalValue: (Number(item.quantity) || 0) * (Number(item.purchase_rate) || 0)
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
        const totalValue = (Number(item.quantity) || 0) * (Number(item.purchase_rate) || 0);
        
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
          needsRefill,
          urgency
        };
      });
      
      // Filter to only materials needing refill and sort by urgency
      return items
        .filter(item => item.needsRefill)
        .sort((a, b) => b.urgency - a.urgency);
    },
  });

  // Function to update filters
  const updateFilters = (newFilters: Partial<InventoryAnalyticsFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  return {
    consumptionData,
    orderConsumptionData,
    inventoryValueData,
    refillNeedsData,
    filters: currentFilters,
    updateFilters,
    isLoading: loadingConsumption || loadingOrderConsumption || loadingInventoryValue || loadingRefillNeeds
  };
};