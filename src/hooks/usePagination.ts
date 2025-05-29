
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UsePaginationProps {
  table: string;
  pageSize?: number;
  searchColumn?: string;
  searchValue?: string;
  orderBy?: { column: string; ascending?: boolean };
  select?: string;
  filters?: Array<{ column: string; operator: string; value: any }>;
}

export const usePagination = ({
  table,
  pageSize = 10,
  searchColumn,
  searchValue,
  orderBy,
  select = '*',
  filters = []
}: UsePaginationProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch total count
  const { data: totalCount = 0 } = useQuery({
    queryKey: ['pagination-count', table, searchColumn, searchValue, filters],
    queryFn: async () => {
      let query = supabase.from(table as any).select('*', { count: 'exact', head: true });
      
      if (searchColumn && searchValue) {
        query = query.ilike(searchColumn, `%${searchValue}%`);
      }
      
      filters.forEach(filter => {
        query = query.filter(filter.column, filter.operator, filter.value);
      });
      
      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    }
  });

  // Fetch paginated data
  const { data: paginatedData, isLoading, error } = useQuery({
    queryKey: ['pagination-data', table, currentPage, pageSize, searchColumn, searchValue, orderBy, select, filters],
    queryFn: async () => {
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      
      let query = supabase.from(table as any).select(select).range(from, to);
      
      if (searchColumn && searchValue) {
        query = query.ilike(searchColumn, `%${searchValue}%`);
      }
      
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }
      
      filters.forEach(filter => {
        query = query.filter(filter.column, filter.operator, filter.value);
      });
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  const paginationInfo = useMemo(() => ({
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    startIndex: (currentPage - 1) * pageSize + 1,
    endIndex: Math.min(currentPage * pageSize, totalCount)
  }), [currentPage, totalPages, totalCount, pageSize]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (paginationInfo.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (paginationInfo.hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return {
    data: paginatedData || [],
    isLoading,
    error,
    pagination: paginationInfo,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    setCurrentPage
  };
};
