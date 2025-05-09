
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StockItem {
  id: string;
  material_name: string;
  color: string | null;
  gsm: string | null;
  quantity: number;
  unit: string;
  reorder_level: number | null;
  purchase_rate: number | null;
  supplier_id: string | null;
  supplier_name?: string | null;
  transactionCount?: number;
}

export interface StockFilter {
  lowStock?: boolean;
  supplierIds?: string[];
  hasColorInfo?: boolean;
  hasGsmInfo?: boolean;
}

interface UseInventoryStocksProps {
  search?: string;
  initialFilters?: StockFilter;
}

export const useInventoryStocks = ({
  search = "",
  initialFilters = {},
}: UseInventoryStocksProps = {}) => {
  const [currentFilters, setCurrentFilters] = useState<StockFilter>(initialFilters);

  const {
    data: stocks,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["inventory", search, currentFilters],
    queryFn: async () => {
      let query = supabase
        .from("inventory")
        .select(`
          *,
          supplier:suppliers(name),
          transactionCount:inventory_transactions(count)
        `);

      // Add search filter if not empty
      if (search) {
        query = query.or(
          `material_name.ilike.%${search}%,color.ilike.%${search}%,gsm.ilike.%${search}%`
        );
      }

      // Apply filters
      if (currentFilters.lowStock) {
        query = query.lt("quantity", "reorder_level");
      }

      if (currentFilters.supplierIds && currentFilters.supplierIds.length > 0) {
        query = query.in("supplier_id", currentFilters.supplierIds);
      }

      if (currentFilters.hasColorInfo === true) {
        query = query.not("color", "is", null);
      } else if (currentFilters.hasColorInfo === false) {
        query = query.is("color", null);
      }

      if (currentFilters.hasGsmInfo === true) {
        query = query.not("gsm", "is", null);
      } else if (currentFilters.hasGsmInfo === false) {
        query = query.is("gsm", null);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data.map((item: any) => ({
        ...item,
        supplier_name: item.supplier?.name,
        transactionCount: item.transactionCount.length,
      }));
    },
  });

  const setFilter = (key: keyof StockFilter, value: any) => {
    setCurrentFilters((prev) => ({ ...prev, [key]: value }));
  };

  const hasFilters = () => {
    return (
      currentFilters.lowStock ||
      (currentFilters.supplierIds && currentFilters.supplierIds.length > 0) ||
      currentFilters.hasColorInfo !== undefined ||
      currentFilters.hasGsmInfo !== undefined
    );
  };

  const resetFilters = () => {
    setCurrentFilters({});
  };

  return {
    stocks,
    isLoading,
    error,
    refresh: refetch,
    isRefreshing: isRefetching,
    currentFilters,
    setFilter,
    hasFilters: hasFilters(),
    resetFilters,
  };
};
