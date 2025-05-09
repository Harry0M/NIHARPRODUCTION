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
        // Ensure metadata is an object we can safely access properties from
        const metadata = typeof log.metadata === 'object' && log.metadata !== null && !Array.isArray(log.metadata)
          ? log.metadata as Record<string, any>
          : {};
        
        // More selective filtering of consumption transactions
        // 1. Must have negative quantity (consumption takes material out)
        const hasNegativeQuantity = log.quantity < 0;
        
        // 2. Check if it's explicitly marked as consumption
        const hasConsumptionLabel = 
          (log.transaction_type && String(log.transaction_type).toLowerCase().includes('consum')) ||
          (log.notes && String(log.notes).toLowerCase().includes('consum'));
        
        // 3. Check if it's actually an adjustment/correction rather than consumption
        const isAdjustment = 
          (log.notes && (
            String(log.notes).toLowerCase().includes('adjust') ||
            String(log.notes).toLowerCase().includes('correct') ||
            String(log.notes).toLowerCase().includes('fix') ||
            String(log.notes).toLowerCase().includes('update')
          ));
        
        // Must be negative quantity AND either labeled as consumption OR not an adjustment
        const isConsumption = hasNegativeQuantity && (hasConsumptionLabel || !isAdjustment);
        
        // Skip if not a true consumption transaction
        if (!isConsumption) return null;
        
        // Skip if no order reference (likely an inventory adjustment)
        if (!log.reference_id) return null;
        
        return {
          order_id: log.reference_id || '',
          order_number: log.reference_number || '',
          material_id: log.material_id || '',
          material_name: String(metadata.material_name || 'Unknown'),
          total_material_used: Math.abs(Number(log.quantity) || 0),
          unit: String(metadata.unit || 'units'),
          usage_date: log.transaction_date || new Date().toISOString(),
          company_name: String(metadata.company_name || 'Unknown'),
          component_type: String(metadata.component_type || 'Unknown'),
          // Handle purchase_price safely with type checking
          purchase_price: 'purchase_price' in metadata ? Number(metadata.purchase_price) : 0,
          source: 'transaction_log',
          log_id: log.id
        };
      }).filter(Boolean); // Remove null entries
      
      // COMPLETE REWRITE OF THE DEDUPLICATION STRATEGY
      // Instead of combining data from both sources, we'll prioritize one source only
      // to avoid any possibility of duplicate counting
      
      // Log the data for debugging
      console.log(`Found ${breakdownData?.length || 0} records from order_material_breakdown`);
      console.log(`Found ${convertedLogData.length} valid consumption records from transaction log`);
      
      // Create a map to track order/material combinations we've already processed
      const processedCombinations = new Set<string>();
      
      // Create a map to store our final unique transactions
      const uniqueTransactions = new Map();
      
      // STEP 1: First, use the breakdown data as our primary source if available
      // This is usually more reliable as it's directly tied to orders
      if (breakdownData && breakdownData.length > 0) {
        breakdownData.forEach(item => {
          if (!item.order_id || !item.material_id) return;
          
          // Create a unique key for this order/material combination
          const key = `${item.order_id}_${item.material_id}`;
          processedCombinations.add(key);
          
          // Add to our unique transactions map with a day-based deduplication key
          const date = item.usage_date ? new Date(item.usage_date) : new Date();
          date.setHours(0, 0, 0, 0);
          const uniqueKey = `${item.order_id}_${item.material_id}_${date.toISOString()}`;
          uniqueTransactions.set(uniqueKey, {...item, source: 'breakdown'});
        });
      }
      
      // STEP 2: Now, only add transaction log items if they don't duplicate what we already have
      convertedLogData.forEach(item => {
        if (!item.order_id || !item.material_id) return;
        
        // Check if we've already processed this combination from the breakdown data
        const key = `${item.order_id}_${item.material_id}`;
        if (processedCombinations.has(key)) {
          // We already have this order/material combination, so skip it
          return;
        }
        
        // This is a new order/material combination, so add it
        processedCombinations.add(key);
        
        // Add to our unique transactions with a day-based deduplication key
        const date = item.usage_date ? new Date(item.usage_date) : new Date();
        date.setHours(0, 0, 0, 0);
        const uniqueKey = `${item.order_id}_${item.material_id}_${date.toISOString()}`;
        uniqueTransactions.set(uniqueKey, item);
      });
      
      // Log how many records we ended up with after deduplication
      console.log(`After deduplication, we have ${uniqueTransactions.size} unique material consumption records`);
      
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
        .sort((a, b) => {
          // Create a numeric mapping for urgency levels
          const urgencyMap: Record<string, number> = {
            'critical': 3,
            'warning': 2,
            'normal': 1
          };
          
          // Get numeric values for comparison
          const urgencyA = urgencyMap[a.urgency as string] || 0;
          const urgencyB = urgencyMap[b.urgency as string] || 0;
          
          // Sort by numeric values
          return urgencyB - urgencyA;
        });
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
