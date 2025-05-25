import { supabase } from '@/integrations/supabase/client';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];
type TableNames = keyof Tables;

/**
 * Performs a paginated query on a Supabase table
 * 
 * @param tableName The table to query
 * @param page Current page (1-based)
 * @param pageSize Number of items per page
 * @param options Additional query options
 * @returns Object containing data, count, and error (if any)
 */
export async function fetchPaginatedData(
  tableName: string,
  page: number,
  pageSize: number,
  options: {
    select?: string;
    orderBy?: { column: string; ascending?: boolean };
    filters?: Record<string, any>;
    searchColumns?: string[];
    searchTerm?: string;
  } = {}
) {
  const {
    select = '*',
    orderBy,
    filters = {},
    searchColumns = [],
    searchTerm = '',
  } = options;

  try {
    // Calculate range for pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Start building count query
    // @ts-ignore - ignore type checking for this dynamic tableName
    let countQuery = supabase
      .from(tableName)
      .select('id', { count: 'exact', head: true });

    // Start building data query
    // @ts-ignore - ignore type checking for this dynamic tableName
    let dataQuery = supabase
      .from(tableName)
      .select(select);

    // Apply search if provided
    if (searchTerm && searchColumns.length > 0) {
      const searchConditions = searchColumns
        .map(column => `${column}.ilike.%${searchTerm}%`)
        .join(',');

      countQuery = countQuery.or(searchConditions);
      dataQuery = dataQuery.or(searchConditions);
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        countQuery = countQuery.eq(key, value);
        dataQuery = dataQuery.eq(key, value);
      }
    });

    // Get count first
    const { count, error: countError } = await countQuery;
    
    if (countError) {
      throw countError;
    }

    // Apply ordering
    if (orderBy) {
      dataQuery = dataQuery.order(orderBy.column, { ascending: orderBy.ascending ?? true });
    }

    // Apply pagination
    dataQuery = dataQuery.range(from, to);

    // Execute data query
    const { data, error } = await dataQuery;

    return {
      data,
      count,
      error,
      pageCount: Math.ceil((count || 0) / pageSize)
    };
  } catch (error) {
    console.error(`Error fetching data from ${tableName}:`, error);
    return { data: null, count: 0, error, pageCount: 0 };
  }
}

/**
 * Fetch data with optimized caching strategy using localStorage
 * 
 * @param key Cache key
 * @param fetchFn Function that fetches the data
 * @param options Caching options
 * @returns The fetched or cached data
 */
export async function fetchWithCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: {
    ttl?: number; // Time to live in seconds
    forceFresh?: boolean;
  } = {}
): Promise<T> {
  const { ttl = 300, forceFresh = false } = options;
  
  // Try to get from cache first, unless forceFresh is true
  if (!forceFresh) {
    try {
      const cachedData = localStorage.getItem(`cache_${key}`);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const isExpired = Date.now() - timestamp > ttl * 1000;
        
        if (!isExpired) {
          console.log(`Using cached data for ${key}`);
          return data as T;
        }
      }
    } catch (error) {
      console.warn(`Error reading cache for ${key}:`, error);
      // Continue to fetch fresh data
    }
  }
  
  // Fetch fresh data
  console.log(`Fetching fresh data for ${key}`);
  const data = await fetchFn();
  
  // Save to cache
  try {
    localStorage.setItem(
      `cache_${key}`,
      JSON.stringify({
        data,
        timestamp: Date.now()
      })
    );
  } catch (error) {
    console.warn(`Error caching data for ${key}:`, error);
    // Continue even if caching fails
  }
  
  return data;
}

/**
 * Utility to optimize supabase queries by selecting only needed fields
 */
export function optimizeQuery(
  // @ts-ignore - ignore type checking for this query parameter
  query: any,
  fields: string[]
): any {
  if (fields.length === 0) return query.select('*');
  
  return query.select(fields.join(','));
}

export default {
  fetchPaginatedData,
  fetchWithCache,
  optimizeQuery
}; 