
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PaginationConfig {
  initialPage?: number;
  pageSize?: number;
  tableName: string;
  selectQuery?: string;
  orderBy?: string;
  ascending?: boolean;
  filters?: Record<string, any>;
}

export interface PaginationResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  refetch: () => void;
}

export function usePagination<T = any>({
  initialPage = 1,
  pageSize = 20,
  tableName,
  selectQuery = "*",
  orderBy = "created_at",
  ascending = false,
  filters = {}
}: PaginationConfig): PaginationResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build the query
      let query = supabase
        .from(tableName as any)
        .select(selectQuery, { count: 'exact' });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'string' && value.includes('%')) {
            query = query.ilike(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      // Apply ordering and pagination
      query = query
        .order(orderBy, { ascending })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      const { data: result, error: queryError, count } = await query;

      if (queryError) throw queryError;

      setData(result || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching data');
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize, tableName, selectQuery, orderBy, ascending, JSON.stringify(filters)]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const refetch = () => {
    fetchData();
  };

  return {
    data,
    loading,
    error,
    currentPage,
    totalPages,
    totalCount,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    refetch
  };
}
