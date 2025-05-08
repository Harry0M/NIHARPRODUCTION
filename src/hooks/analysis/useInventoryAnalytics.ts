
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
      // Build the query with filters
      let query = supabase
        .from('material_usage_summary')
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
      
      return data || [];
    },
  });

  // Fetch order consumption breakdown
  const { data: orderConsumptionData, isLoading: loadingOrderConsumption } = useQuery({
    queryKey: ['order-consumption', currentFilters],
    queryFn: async () => {
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
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching order consumption data:", error);
        throw error;
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
        .select('id, material_name, quantity, unit, purchase_rate');
      
      if (error) {
        console.error("Error fetching inventory value data:", error);
        throw error;
      }
      
      // Calculate total value for each material
      return (data || []).map(item => ({
        ...item,
        totalValue: (item.quantity || 0) * (item.purchase_rate || 0)
      }));
    },
  });

  // Fetch inventory refill needs
  const { data: refillNeedsData, isLoading: loadingRefillNeeds } = useQuery({
    queryKey: ['refill-needs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .lt('quantity', supabase.raw('coalesce(reorder_level, 0)'));
      
      if (error) {
        console.error("Error fetching refill needs data:", error);
        throw error;
      }
      
      return data || [];
    },
  });

  // Fetch recent transactions for tracking consumption over time
  const { data: recentTransactions, isLoading: loadingTransactions } = useQuery({
    queryKey: ['recent-transactions', currentFilters],
    queryFn: async () => {
      let query = supabase
        .from('inventory_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (currentFilters.materialId) {
        query = query.eq('material_id', currentFilters.materialId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching recent transactions:", error);
        throw error;
      }
      
      return data || [];
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
