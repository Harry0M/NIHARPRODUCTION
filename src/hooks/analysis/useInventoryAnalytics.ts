import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, parseISO, format } from "date-fns";

interface InventoryFilters {
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
  materialType?: string;
  showZeroStock?: boolean;
}

export function useInventoryAnalytics() {
  const [filters, setFilters] = useState<InventoryFilters>({
    dateRange: {
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date())
    },
    materialType: undefined,
    showZeroStock: false
  });

  // Query for material consumption data
  const {
    data: consumptionData,
    isLoading: loadingConsumption,
    refetch: refetchConsumption
  } = useQuery({
    queryKey: ['material-consumption', filters],
    queryFn: async () => {
      // Create date range parameters for the query
      const params: any = {};
      
      if (filters.dateRange.startDate) {
        params.start_date = filters.dateRange.startDate.toISOString();
      }
      
      if (filters.dateRange.endDate) {
        params.end_date = filters.dateRange.endDate.toISOString();
      }
      
      // Fetch material consumption data with proper aggregation
      const { data, error } = await supabase.rpc(
        'get_material_consumption_summary',
        params
      );
      
      if (error) {
        console.error("Error fetching material consumption:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!filters.dateRange.startDate && !!filters.dateRange.endDate
  });
  
  // Query for order consumption data
  const {
    data: orderConsumptionData,
    isLoading: loadingOrders,
    refetch: refetchOrders
  } = useQuery({
    queryKey: ['order-consumption', filters],
    queryFn: async () => {
      // Create date range parameters for the query
      const params: any = {};
      
      if (filters.dateRange.startDate) {
        params.p_start_date = filters.dateRange.startDate.toISOString();
      }
      
      if (filters.dateRange.endDate) {
        params.p_end_date = filters.dateRange.endDate.toISOString();
      }
      
      // Call the dedicated function for order consumption
      const { data, error } = await supabase.rpc(
        'get_deduplicated_order_consumption',
        params
      );
      
      if (error) {
        console.error("Error fetching order consumption:", error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!filters.dateRange.startDate && !!filters.dateRange.endDate
  });
  
  // Function to process transaction data for charts and analysis
  const processTransactionData = useCallback((data: any[] | null) => {
    if (!data || data.length === 0) {
      return [];
    }
    
    return data.map(item => {
      // Always check if item is null before using it
      if (!item) return null;
      
      // Safe access patterns for all properties
      return {
        id: item.id || '',
        date: item.transaction_date ? format(parseISO(item.transaction_date), 'yyyy-MM-dd') : '',
        materialId: item.material_id || '',
        materialName: item.material_name || '',
        quantity: item.quantity || 0,
        type: item.transaction_type || '',
        reference: item.reference_number || '',
        unit: item.unit || '',
        // Safe access with optional chaining
        metadata: {
          material: item.metadata?.material_name || '',
          // Add more metadata fields as needed
        }
      };
    }).filter(Boolean); // Filter out any null items
  }, []);
  
  // Function to calculate stock metrics from transaction data
  const calculateStockMetrics = useCallback((transactions: any[] | null) => {
    if (!transactions || transactions.length === 0) {
      return {
        totalItems: 0,
        lowStockCount: 0,
        recentActivity: 0
      };
    }
    
    // Calculate metrics safely
    const uniqueMaterials = new Set();
    let lowStockCount = 0;
    let recentActivityCount = 0;
    
    transactions.forEach(transaction => {
      // Safe access: Check if transaction is not null
      if (!transaction) return;
      
      uniqueMaterials.add(transaction.materialId);
      
      // Example low stock detection (adjust logic as needed)
      if (transaction.type === 'stockLevel' && transaction.quantity < 10) {
        lowStockCount++;
      }
      
      // Example recent activity detection
      const transactionDate = transaction.date ? parseISO(transaction.date) : null;
      if (transactionDate && isWithinLastWeek(transactionDate)) {
        recentActivityCount++;
      }
    });
    
    return {
      totalItems: uniqueMaterials.size,
      lowStockCount,
      recentActivityCount
    };
  }, []);
  
  // Helper function to check if date is within last week
  const isWithinLastWeek = (date: Date) => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= oneWeekAgo;
  };
  
  // Handle filter updates
  const updateFilters = useCallback((newFilters: Partial<InventoryFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);
  
  // Process transactions when data changes
  const processedTransactions = useMemo(() => {
    return processTransactionData(null); // We're not currently using this, so passing null is safe
  }, [processTransactionData]);
  
  // Calculate metrics from processed transactions
  const stockMetrics = useMemo(() => {
    return calculateStockMetrics(processedTransactions);
  }, [processedTransactions, calculateStockMetrics]);
  
  // Create map function that safely maps over order consumption data
  const mapOrderConsumption = (items: any[] | null) => {
    if (!items) return [];
    
    return items.map(item => {
      // If item is null, return a safe default object
      if (!item) {
        return {
          order_id: '',
          order_number: '',
          company_name: '',
          usage_date: null,
          material_id: '',
          material_name: '',
          total_material_used: 0,
          unit: '',
          purchase_price: 0,
          component_type: ''
        };
      }
      
      // Otherwise use the actual item properties with safe fallbacks
      return {
        order_id: item.order_id || '',
        order_number: item.order_number || '',
        company_name: item.company_name || '',
        usage_date: item.usage_date ? new Date(item.usage_date) : null,
        material_id: item.material_id || '',
        material_name: item.material_name || '',
        total_material_used: Number(item.total_material_used || 0),
        unit: item.unit || '',
        purchase_price: Number(item.purchase_price || 0),
        component_type: item.component_type || ''
      };
    });
  };
  
  // Map the order consumption data safely
  const mappedOrderConsumption = useMemo(() => {
    return mapOrderConsumption(orderConsumptionData);
  }, [orderConsumptionData]);
  
  // Refresh data
  const refreshData = useCallback(() => {
    refetchConsumption();
    refetchOrders();
  }, [refetchConsumption, refetchOrders]);
  
  return {
    consumptionData,
    orderConsumptionData: mappedOrderConsumption,
    isLoading: loadingConsumption || loadingOrders,
    stockMetrics,
    filters,
    updateFilters,
    refreshData
  };
}
