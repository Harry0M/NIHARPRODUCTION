import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

type PaginationOptions = {
  initialPage?: number;
  initialPageSize?: number;
  saveInURL?: boolean;
  queryStringPage?: string;
  queryStringPageSize?: string;
};

interface PaginationResult<T> {
  items: T[];
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalCount: number;
  totalPages: number;
  isLoading: boolean;
  isFirstPage: boolean;
  isLastPage: boolean;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
}

/**
 * A hook for implementing pagination in components
 * 
 * @param tableName The Supabase table to query
 * @param queryFn Optional custom query function
 * @param options Pagination options
 * @returns Pagination state and controls
 */
export function usePagination<T>(
  tableName: string,
  queryFn?: (page: number, pageSize: number) => Promise<{ data: T[] | null; count: number | null; error: any }>,
  options: PaginationOptions = {}
): PaginationResult<T> {
  const {
    initialPage = 1,
    initialPageSize = 10,
    saveInURL = false,
    queryStringPage = 'page',
    queryStringPageSize = 'pageSize'
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<T[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Get page and pageSize from URL if saveInURL is true
  const getInitialPageFromURL = useCallback(() => {
    if (saveInURL) {
      const pageParam = searchParams.get(queryStringPage);
      return pageParam ? parseInt(pageParam, 10) : initialPage;
    }
    return initialPage;
  }, [saveInURL, searchParams, queryStringPage, initialPage]);

  const getInitialPageSizeFromURL = useCallback(() => {
    if (saveInURL) {
      const pageSizeParam = searchParams.get(queryStringPageSize);
      return pageSizeParam ? parseInt(pageSizeParam, 10) : initialPageSize;
    }
    return initialPageSize;
  }, [saveInURL, searchParams, queryStringPageSize, initialPageSize]);

  const [page, setPageInternal] = useState(getInitialPageFromURL());
  const [pageSize, setPageSizeInternal] = useState(getInitialPageSizeFromURL());

  // Update URL when page or pageSize changes
  useEffect(() => {
    if (saveInURL) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set(queryStringPage, page.toString());
      newParams.set(queryStringPageSize, pageSize.toString());
      setSearchParams(newParams);
    }
  }, [page, pageSize, saveInURL, searchParams, setSearchParams, queryStringPage, queryStringPageSize]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let result;
        
        if (queryFn) {
          // Use custom query function if provided
          result = await queryFn(page, pageSize);
        } else {
          // Calculate pagination range
          const from = (page - 1) * pageSize;
          const to = from + pageSize - 1;
          
          // First get the total count
          const { count, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (countError) throw countError;
          
          // Then fetch the paginated data
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .range(from, to);
          
          if (error) throw error;
          
          result = { data, count, error: null };
        }
        
        setItems(result.data || []);
        setTotalCount(result.count || 0);
      } catch (error) {
        console.error(`Error fetching data from ${tableName}:`, error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tableName, page, pageSize, queryFn]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const isFirstPage = page === 1;
  const isLastPage = page >= totalPages;

  // Set page with validation
  const setPage = (newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages));
    setPageInternal(validPage);
  };

  // Set page size and reset to page 1
  const setPageSize = (newPageSize: number) => {
    setPageSizeInternal(newPageSize);
    setPageInternal(1); // Reset to first page when changing page size
  };

  const goToNextPage = () => {
    if (!isLastPage) {
      setPage(page + 1);
    }
  };

  const goToPreviousPage = () => {
    if (!isFirstPage) {
      setPage(page - 1);
    }
  };

  return {
    items,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalCount,
    totalPages,
    isLoading,
    isFirstPage,
    isLastPage,
    goToNextPage,
    goToPreviousPage
  };
}

export default usePagination; 