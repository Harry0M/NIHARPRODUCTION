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

  // Fetch material consumption data with advanced deduplication
  const { data: consumptionData, isLoading: loadingConsumption } = useQuery({
    queryKey: ['material-consumption', currentFilters],
    queryFn: async () => {
      console.log("Fetching material consumption data with filters:", currentFilters);
      
      // Instead of using the view directly, we'll fetch and process the raw data
      // to handle proper deduplication of transaction pairs
      const materialTransactions = await fetchAllMaterialTransactions(currentFilters);
      
      // Group and aggregate the transactions by material
      const consumptionByMaterial = consolidateMaterialConsumption(materialTransactions);
      
      console.log(`Processed ${consumptionByMaterial.length} material consumption records after deduplication`);
      return consumptionByMaterial;
    },
  });

  // Fetch order consumption breakdown with advanced deduplication
  const { data: orderConsumptionData, isLoading: loadingOrderConsumption } = useQuery({
    queryKey: ['order-consumption', currentFilters],
    queryFn: async () => {
      console.log("Fetching order consumption data with filters:", currentFilters);
      
      // Get consolidated transaction data from both sources
      const materialTransactions = await fetchAllMaterialTransactions(currentFilters);
      
      // Process and organize by order
      const orderConsumption = consolidateOrderConsumption(materialTransactions);
      
      console.log(`Processed ${orderConsumption.length} order consumption records after deduplication`);
      return orderConsumption;
    },
  });
  
  // Helper function to fetch all transaction data from both tables
  const fetchAllMaterialTransactions = async (filters: InventoryAnalyticsFilters) => {
    // First fetch from order_material_breakdown (if available)
    let baseRecords: any[] = [];
    try {
      let query = supabase
        .from('order_material_breakdown')
        .select('*');
      
      // Apply filters
      if (filters.materialId) {
        query = query.eq('material_id', filters.materialId);
      }
      
      if (filters.orderIds && filters.orderIds.length > 0) {
        query = query.in('order_id', filters.orderIds);
      }
      
      if (filters.dateRange.startDate) {
        query = query.gte('usage_date', filters.dateRange.startDate.toISOString());
      }
      
      if (filters.dateRange.endDate) {
        query = query.lte('usage_date', filters.dateRange.endDate.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching order_material_breakdown data:", error);
      } else if (data && data.length > 0) {
        baseRecords = data.map(item => ({
          ...item,
          source: 'breakdown',
          transaction_type: 'Consumption' // Assuming all records here are consumption
        }));
      }
    } catch (error) {
      console.error("Error in breakdown query:", error);
    }
    
    // Now fetch from inventory_transaction_log
    let logRecords: any[] = [];
    try {
      let logQuery = supabase
        .from('inventory_transaction_log')
        .select('*');
      
      // Apply similar filters
      if (filters.materialId) {
        logQuery = logQuery.eq('material_id', filters.materialId);
      }
      
      // If order IDs filter exists
      if (filters.orderIds && filters.orderIds.length > 0) {
        logQuery = logQuery.in('reference_id', filters.orderIds);
      } else {
        // Otherwise just get order-related transactions
        logQuery = logQuery.eq('reference_type', 'Order');
      }
      
      // Date filters
      if (filters.dateRange.startDate) {
        logQuery = logQuery.gte('transaction_date', filters.dateRange.startDate.toISOString());
      }
      
      if (filters.dateRange.endDate) {
        logQuery = logQuery.lte('transaction_date', filters.dateRange.endDate.toISOString());
      }
      
      const { data: logData, error: logError } = await logQuery;
      
      if (logError) {
        console.error("Error fetching transaction log data:", logError);
      } else if (logData && logData.length > 0) {
        logRecords = logData.map(log => {
          // Extract metadata or provide defaults
          const metadata = log.metadata || {};
          
          return {
            // Map to a consistent format
            order_id: log.reference_id,
            order_number: log.reference_number,
            material_id: log.material_id,
            material_name: metadata.material_name || 'Unknown',
            // Important: We're using the raw quantity here and will process it properly later
            // to avoid double-counting decreases
            quantity: log.quantity,
            unit: metadata.unit || 'units',
            usage_date: log.transaction_date,
            company_name: metadata.company_name || 'Unknown',
            component_type: metadata.component_type || 'Unknown',
            purchase_price: metadata.purchase_price || 0,
            transaction_type: log.transaction_type,
            source: 'transaction_log',
            log_id: log.id,
            notes: log.notes
          };
        });
      }
    } catch (error) {
      console.error("Error in transaction log query:", error);
    }
    
    // Fetch from inventory_transactions as well
    let txRecords: any[] = [];
    try {
      let txQuery = supabase
        .from('inventory_transactions')
        .select('*');
      
      // Apply filters
      if (filters.materialId) {
        txQuery = txQuery.eq('material_id', filters.materialId);
      }
      
      // Date filters - field name may differ
      if (filters.dateRange.startDate) {
        txQuery = txQuery.gte('created_at', filters.dateRange.startDate.toISOString());
      }
      
      if (filters.dateRange.endDate) {
        txQuery = txQuery.lte('created_at', filters.dateRange.endDate.toISOString());
      }
      
      const { data: txData, error: txError } = await txQuery;
      
      if (txError) {
        console.error("Error fetching inventory transactions data:", txError);
      } else if (txData && txData.length > 0) {
        txRecords = txData.map(tx => {
          return {
            // Map to our consistent format
            order_id: tx.reference_id || '',
            order_number: tx.reference_number || '',
            material_id: tx.material_id,
            material_name: tx.material_name || 'Unknown',
            // Again, using raw quantity to process properly
            quantity: tx.quantity,
            unit: tx.unit || 'units',
            usage_date: tx.created_at,
            company_name: tx.company_name || 'Unknown',
            component_type: tx.component_type || 'Unknown',
            purchase_price: tx.purchase_price || 0,
            transaction_type: tx.transaction_type,
            source: 'inventory_transactions',
            notes: tx.notes
          };
        });
      }
    } catch (error) {
      console.error("Error in inventory transactions query:", error);
    }
    
    // Combine all records but we will deduplicate them later
    return [...baseRecords, ...logRecords, ...txRecords];
  };
  
  // Function to consolidate material consumption from transaction records
  const consolidateMaterialConsumption = (transactions: any[]) => {
    // Group transactions by material
    const materialMap = new Map();
    
    // First, process all transactions to correctly identify consumption
    transactions.forEach(tx => {
      // Skip transactions we don't want to count for consumption
      if (!tx.material_id) return;
      
      // We only want to count actual consumption, not just any quantity change
      // Negative quantities typically indicate consumption or usage
      // Some systems might record positive values for consumption - check notes or transaction_type
      const isConsumption = 
        (tx.quantity < 0) || 
        (tx.transaction_type && tx.transaction_type.toLowerCase().includes('consum')) ||
        (tx.notes && tx.notes.toLowerCase().includes('consum'));
      
      if (!isConsumption) return;
      
      // Get the absolute value for consumption
      const consumptionAmount = Math.abs(tx.quantity);
      
      // Create a unique key for the order+material+date to detect duplicates
      const date = tx.usage_date ? new Date(tx.usage_date) : new Date();
      date.setMinutes(0, 0, 0); // Round to nearest hour
      const txKey = `${tx.order_id}_${tx.material_id}_${date.toISOString()}`;
      
      // If we already saw this specific transaction, skip it
      if (tx.processedTxKey === txKey) return;
      tx.processedTxKey = txKey;
      
      // Get or create material entry
      if (!materialMap.has(tx.material_id)) {
        materialMap.set(tx.material_id, {
          material_id: tx.material_id,
          material_name: tx.material_name,
          gsm: tx.gsm,
          color: tx.color,
          unit: tx.unit,
          total_consumption: 0,
          total_usage: 0, // Alias for compatibility
          purchase_price: tx.purchase_price || 0,
          orders: new Set(),
          first_usage_date: tx.usage_date,
          last_usage_date: tx.usage_date,
          // Track seen transactions to avoid duplicates
          seen_transactions: new Set([txKey])
        });
      }
      
      const materialData = materialMap.get(tx.material_id);
      
      // Check if we've already processed this exact transaction
      if (materialData.seen_transactions.has(txKey)) {
        return; // Skip duplicate
      }
      
      // Update material consumption data
      materialData.total_consumption += consumptionAmount;
      materialData.total_usage = materialData.total_consumption; // Alias for compatibility
      
      // Track order info
      if (tx.order_id) {
        materialData.orders.add(tx.order_id);
      }
      
      // Update date tracking
      if (tx.usage_date) {
        const txDate = new Date(tx.usage_date);
        
        if (!materialData.first_usage_date || txDate < new Date(materialData.first_usage_date)) {
          materialData.first_usage_date = tx.usage_date;
        }
        
        if (!materialData.last_usage_date || txDate > new Date(materialData.last_usage_date)) {
          materialData.last_usage_date = tx.usage_date;
        }
      }
      
      // Mark this transaction as seen
      materialData.seen_transactions.add(txKey);
    });
    
    // Convert the map to array and calculate order counts
    return Array.from(materialMap.values()).map(material => ({
      ...material,
      orders_count: material.orders.size,
      orders: Array.from(material.orders), // Convert Set to Array
      seen_transactions: undefined // Remove temp tracking property
    }));
  };
  
  // Function to consolidate order consumption from transaction records
  const consolidateOrderConsumption = (transactions: any[]) => {
    // Group by order first
    const orderMap = new Map();
    
    // Process transactions to correctly identify consumption
    transactions.forEach(tx => {
      // Skip incomplete transactions
      if (!tx.material_id || !tx.order_id) return;
      
      // We only want to count actual consumption, not just any quantity change
      const isConsumption = 
        (tx.quantity < 0) || 
        (tx.transaction_type && tx.transaction_type.toLowerCase().includes('consum')) ||
        (tx.notes && tx.notes.toLowerCase().includes('consum'));
      
      if (!isConsumption) return;
      
      // Get the absolute value for consumption
      const consumptionAmount = Math.abs(tx.quantity);
      
      // Create a unique key for the order+material+date to detect duplicates
      const date = tx.usage_date ? new Date(tx.usage_date) : new Date();
      date.setMinutes(0, 0, 0); // Round to nearest hour
      const txKey = `${tx.order_id}_${tx.material_id}_${date.toISOString()}`;
      
      // Get or create order entry
      if (!orderMap.has(tx.order_id)) {
        orderMap.set(tx.order_id, {
          order_id: tx.order_id,
          order_number: tx.order_number,
          company_name: tx.company_name,
          usage_date: tx.usage_date,
          materials: new Map(),
          seen_transactions: new Set()
        });
      }
      
      const orderData = orderMap.get(tx.order_id);
      
      // Check if we've already seen this exact transaction
      if (orderData.seen_transactions.has(txKey)) {
        return; // Skip duplicate
      }
      
      // Get or create material entry for this order
      if (!orderData.materials.has(tx.material_id)) {
        orderData.materials.set(tx.material_id, {
          material_id: tx.material_id,
          material_name: tx.material_name,
          unit: tx.unit,
          total_material_used: 0,
          purchase_price: tx.purchase_price || 0,
          component_type: tx.component_type
        });
      }
      
      const materialData = orderData.materials.get(tx.material_id);
      
      // Update material consumption
      materialData.total_material_used += consumptionAmount;
      
      // Mark this transaction as seen
      orderData.seen_transactions.add(txKey);
    });
    
    // Convert to the expected format for orderConsumptionData
    const result: any[] = [];
    
    orderMap.forEach(order => {
      order.materials.forEach(material => {
        result.push({
          order_id: order.order_id,
          order_number: order.order_number,
          company_name: order.company_name,
          usage_date: order.usage_date,
          material_id: material.material_id,
          material_name: material.material_name,
          total_material_used: material.total_material_used,
          unit: material.unit,
          purchase_price: material.purchase_price,
          component_type: material.component_type
        });
      });
    });
    
    return result;
  };

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
