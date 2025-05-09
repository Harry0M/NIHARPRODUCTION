
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

// Define types to avoid TypeScript errors
type MaterialConsumptionData = {
  material_id: string;
  material_name: string;
  unit: string;
  total_usage: number;
  total_value: number;
  orders_count: number;
  first_usage_date: string | null;
  last_usage_date: string | null;
  purchase_rate: number;
  // UI compatibility properties
  color: string;
  gsm: string;
};

type OrderConsumptionItem = {
  order_id: string;
  order_number: string;
  company_name: string;
  usage_date: string;
  material_id: string;
  material_name: string;
  total_material_used: number;
  unit: string;
  component_type: string;
  purchase_price: number;
  source?: string;
  log_id?: string;
};

export const useInventoryAnalytics = (filters?: InventoryAnalyticsFilters) => {
  const [currentFilters, setFilters] = useState<InventoryAnalyticsFilters>(
    filters || {
      dateRange: { startDate: null, endDate: null },
      materialId: null,
      orderIds: null,
    }
  );

  // MAIN SOURCE OF TRUTH: Get deduplicated order consumption data
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
      const materialPriceMap = new Map<string, number>();
      if (Array.isArray(inventoryData)) {
        inventoryData.forEach(item => {
          if (item && item.id && item.purchase_rate) {
            materialPriceMap.set(item.id, Number(item.purchase_rate));
          }
        });
      }
      
      // 1. Fetch data from order_material_breakdown - checking which columns exist
      // IMPORTANT: Some installations might not have purchase_price column
      const breakdownColumns = [
        'order_id',
        'order_number',
        'material_id',
        'material_name',
        'total_material_used',
        'unit',
        'usage_date',
        'company_name',
        'component_type'
      ];
      
      let breakdownQuery = supabase
        .from('order_material_breakdown')
        .select(breakdownColumns.join(', '));
      
      // Apply filters
      if (currentFilters.dateRange.startDate) {
        breakdownQuery = breakdownQuery.gte('usage_date', currentFilters.dateRange.startDate.toISOString());
      }
      
      if (currentFilters.dateRange.endDate) {
        breakdownQuery = breakdownQuery.lte('usage_date', currentFilters.dateRange.endDate.toISOString());
      }
      
      if (currentFilters.materialId) {
        breakdownQuery = breakdownQuery.eq('material_id', currentFilters.materialId);
      }
      
      // Execute breakdown query
      const { data: breakdownData, error: breakdownError } = await breakdownQuery;
      
      if (breakdownError) {
        console.error("Error fetching order_material_breakdown data:", breakdownError);
      }
      
      // 2. Fetch data from inventory_transaction_log
      let logQuery = supabase
        .from('inventory_transaction_log')
        .select(`
          id,
          material_id,
          transaction_type,
          quantity,
          transaction_date,
          reference_id,
          reference_number,
          metadata,
          notes
        `);
      
      // Apply filters
      if (currentFilters.materialId) {
        logQuery = logQuery.eq('material_id', currentFilters.materialId);
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
      const convertedLogData: OrderConsumptionItem[] = [];
      
      if (Array.isArray(logData)) {
        logData.forEach(log => {
          // Skip null or undefined logs
          if (!log) return;
          
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
          if (!isConsumption) return;
          
          // Skip if no order reference (likely an inventory adjustment)
          if (!log.reference_id) return;
          
          convertedLogData.push({
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
          });
        });
      }
      
      // COMPLETE REWRITE OF THE DEDUPLICATION STRATEGY
      // We'll prioritize one source over the other to avoid double-counting
      
      // Log the data for debugging
      const validBreakdownItems = Array.isArray(breakdownData) ? breakdownData : [];
      console.log(`Found ${validBreakdownItems.length} records from order_material_breakdown`);
      console.log(`Found ${convertedLogData.length} valid consumption records from transaction log`);
      
      // Create a map to track order/material combinations we've already processed
      const processedCombinations = new Set<string>();
      
      // Create a map to store our final unique transactions
      const uniqueTransactions = new Map<string, OrderConsumptionItem>();
      
      // STEP 1: First, use the breakdown data as our primary source if available
      // This is usually more reliable as it's directly tied to orders
      if (validBreakdownItems.length > 0) {
        validBreakdownItems.forEach(item => {
          // Skip invalid entries
          if (!item || typeof item !== 'object') return;
          if (!('order_id' in item) || !('material_id' in item)) return;
          
          // Create a unique key for this order/material combination
          const key = `${item.order_id}_${item.material_id}`;
          processedCombinations.add(key);
          
          // Add to our unique transactions map with a day-based deduplication key
          const date = 'usage_date' in item && item.usage_date 
            ? new Date(item.usage_date) 
            : new Date();
          date.setHours(0, 0, 0, 0);
          const uniqueKey = `${item.order_id}_${item.material_id}_${date.toISOString()}`;
          
          // Create our order consumption item with the missing purchase_price from our material price map
          const materialPrice = materialPriceMap.get(item.material_id as string) || 0;
          
          const orderItem: OrderConsumptionItem = {
            order_id: item.order_id as string,
            order_number: (item.order_number as string) || '',
            company_name: (item.company_name as string) || 'Unknown',
            usage_date: (item.usage_date as string) || new Date().toISOString(),
            material_id: item.material_id as string,
            material_name: (item.material_name as string) || 'Unknown',
            total_material_used: Number(item.total_material_used) || 0,
            unit: (item.unit as string) || 'units',
            component_type: (item.component_type as string) || 'Unknown',
            purchase_price: materialPrice,
            source: 'breakdown'
          };
          
          uniqueTransactions.set(uniqueKey, orderItem);
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
        
        // Use material price from map if not available in the record
        if (!item.purchase_price) {
          item.purchase_price = materialPriceMap.get(item.material_id) || 0;
        }
        
        uniqueTransactions.set(uniqueKey, item);
      });
      
      // Log how many records we ended up with after deduplication
      console.log(`After deduplication, we have ${uniqueTransactions.size} unique material consumption records`);
      
      // Convert back to array
      const formattedData = Array.from(uniqueTransactions.values());
      
      console.log(`Processed ${formattedData.length} order consumption records after deduplication`);
      return formattedData;
    },
  });

  // Calculated material consumption data derived from our deduplicated order consumption
  const { data: consumptionData, isLoading: loadingConsumption } = useQuery<MaterialConsumptionData[]>({
    queryKey: ['material-consumption', orderConsumptionData],
    enabled: !!orderConsumptionData,
    queryFn: () => {
      console.log("Calculating material consumption summary from deduplicated order data");
      
      // Group by material and sum up
      const materialMap = new Map<string, {
        material_id: string;
        material_name: string;
        unit: string;
        total_usage: number;
        total_value: number;
        orders_count: number;
        unique_orders: Set<string>;
        first_usage_date: string | null;
        last_usage_date: string | null;
        usage_dates: Date[];
        purchase_rate: number;
      }>();
      
      // Process the already deduplicated order consumption data to create material summaries
      if (Array.isArray(orderConsumptionData)) {
        orderConsumptionData.forEach(item => {
          if (!item || !item.material_id) return;
          
          // Get existing material entry or create a new one
          const materialKey = item.material_id;
          let materialEntry = materialMap.get(materialKey);
          
          if (!materialEntry) {
            materialEntry = {
              material_id: item.material_id,
              material_name: item.material_name,
              unit: item.unit,
              total_usage: 0,
              total_value: 0,
              orders_count: 0,
              unique_orders: new Set<string>(),
              first_usage_date: null,
              last_usage_date: null,
              usage_dates: [],
              purchase_rate: item.purchase_price || 0
            };
            materialMap.set(materialKey, materialEntry);
          }
          
          // Add this usage to the total
          materialEntry.total_usage += Number(item.total_material_used) || 0;
          materialEntry.total_value += (Number(item.total_material_used) || 0) * (Number(item.purchase_price) || 0);
          
          // Track unique orders
          if (item.order_id) {
            materialEntry.unique_orders.add(item.order_id);
          }
          
          // Track usage dates
          if (item.usage_date) {
            const usageDate = new Date(item.usage_date);
            materialEntry.usage_dates.push(usageDate);
            
            // Update first usage date
            if (!materialEntry.first_usage_date || usageDate < new Date(materialEntry.first_usage_date)) {
              materialEntry.first_usage_date = item.usage_date;
            }
            
            // Update last usage date
            if (!materialEntry.last_usage_date || usageDate > new Date(materialEntry.last_usage_date)) {
              materialEntry.last_usage_date = item.usage_date;
            }
          }
        });
      }
      
      // Convert to array and finalize - include color/gsm properties needed by UI
      const materialsArray = Array.from(materialMap.values()).map(item => ({
        material_id: item.material_id,
        material_name: item.material_name,
        unit: item.unit,
        total_usage: item.total_usage,
        total_value: item.total_value,
        orders_count: item.unique_orders.size,
        first_usage_date: item.first_usage_date,
        last_usage_date: item.last_usage_date,
        purchase_rate: item.purchase_rate,
        // Add empty properties for UI compatibility
        color: '',
        gsm: ''
      }));
      
      console.log(`Calculated ${materialsArray.length} material consumption summaries from deduplicated data`);
      return materialsArray;
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
    consumptionData, // Material consumption data (derived from deduplicated order consumption)
    orderConsumptionData, // Order consumption data (deduplicated source of truth)
    inventoryValueData,
    refillNeedsData,
    filters: currentFilters,
    updateFilters,
    isLoading: loadingConsumption || loadingOrderConsumption || loadingInventoryValue || loadingRefillNeeds
  };
};
