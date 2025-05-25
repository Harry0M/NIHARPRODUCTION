# Pagination and Performance Optimization Guide

This document outlines how to implement pagination and other performance optimizations to reduce lag when dealing with large datasets in the application.

## Table of Contents
1. [Using the Pagination Hook](#using-the-pagination-hook)
2. [Using the PaginationControls Component](#using-the-paginationcontrols-component)
3. [Performance Optimization Techniques](#performance-optimization-techniques)
4. [Caching Strategies](#caching-strategies)
5. [Optimized Query Examples](#optimized-query-examples)

## Using the Pagination Hook

The `usePagination` hook provides a simple way to add pagination to any component that fetches data from Supabase.

```tsx
import { usePagination } from '@/hooks/usePagination';

function MyComponent() {
  // Basic usage with default table query
  const {
    items,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalCount,
    totalPages,
    isLoading
  } = usePagination('tableName');

  // Advanced usage with custom query function
  const myCustomQuery = async (page, pageSize) => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Get count first
    const { count, error: countError } = await supabase
      .from('myTable')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');
    
    if (countError) throw countError;
    
    // Get data with pagination
    const { data, error } = await supabase
      .from('myTable')
      .select('*, related_table(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) throw error;
    
    return { data, count, error: null };
  };
  
  const {
    items: myItems,
    // ... other pagination values
  } = usePagination('myTable', myCustomQuery, {
    initialPage: 1,
    initialPageSize: 20,
    saveInURL: true // This will update the URL with page and pageSize parameters
  });
  
  return (
    <div>
      {/* Render your items */}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {items.map(item => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      )}
      
      {/* Use PaginationControls component for UI */}
      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
```

## Using the PaginationControls Component

The `PaginationControls` component provides a standardized UI for pagination across the application.

```tsx
import PaginationControls from '@/components/ui/pagination-controls';

// Basic usage
<PaginationControls
  currentPage={page}
  totalPages={totalPages}
  pageSize={pageSize}
  onPageChange={setPage}
  onPageSizeChange={setPageSize}
/>

// Advanced configuration
<PaginationControls
  currentPage={page}
  totalPages={totalPages}
  pageSize={pageSize}
  onPageChange={setPage}
  onPageSizeChange={setPageSize}
  pageSizeOptions={[5, 10, 25, 50]}
  showPageSizeSelector={true}
  pageSizeSelectorLabel="Results per page"
  className="mt-8"
/>
```

## Performance Optimization Techniques

### 1. Pagination

Always use pagination for tables or lists that may contain large amounts of data:

```tsx
// In your component that fetches data
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(20);

useEffect(() => {
  const fetchData = async () => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error } = await supabase
      .from('table')
      .select('*')
      .range(from, to);
      
    // Process data...
  };
  
  fetchData();
}, [page, pageSize]);
```

### 2. Only Select Required Fields

When you don't need all fields from a table, specify only the ones you need:

```tsx
// Instead of .select('*')
const { data } = await supabase
  .from('large_table')
  .select('id, name, status, created_at')
  .range(from, to);
```

### 3. Use Optimistic UI Updates

For create/update/delete operations, update the UI optimistically before the server responds:

```tsx
const deleteItem = async (id) => {
  // Optimistically remove from UI
  setItems(items.filter(item => item.id !== id));
  
  // Then perform actual delete
  const { error } = await supabase
    .from('table')
    .delete()
    .eq('id', id);
    
  if (error) {
    // If error, revert the optimistic update
    toast.error("Failed to delete item");
    fetchItems(); // Re-fetch the data
  }
};
```

## Caching Strategies

The application includes a `fetchWithCache` utility that can be used to cache expensive queries:

```tsx
import { fetchWithCache } from '@/utils/supabase-helpers';

// In your component
useEffect(() => {
  const getData = async () => {
    const data = await fetchWithCache(
      'dashboard-stats', // cache key
      async () => {
        // Your expensive query here
        const { data } = await supabase.from('stats').select('*');
        return data;
      },
      { ttl: 300 } // Cache for 5 minutes (300 seconds)
    );
    
    setStats(data);
  };
  
  getData();
}, []);
```

## Optimized Query Examples

### Example 1: Dashboard with Multiple Data Sources

```tsx
// Use React Query for efficient data fetching and caching
const { data: dashboardData, isLoading } = useQuery({
  queryKey: ['dashboard-data'],
  queryFn: async () => {
    // Execute all queries in parallel to improve performance
    const [result1, result2, result3] = await Promise.all([
      supabase.from('table1').select('count', { count: 'exact', head: true }),
      supabase.from('table2').select('count', { count: 'exact', head: true }),
      supabase.from('table3').select('count', { count: 'exact', head: true }),
    ]);
    
    return {
      count1: result1.count,
      count2: result2.count,
      count3: result3.count
    };
  },
  staleTime: 60000, // Data will be fresh for 1 minute
  refetchOnWindowFocus: false // Don't refetch when window regains focus
});
```

### Example 2: Paginated Table with Search and Filters

```tsx
// Use the fetchPaginatedData utility
const fetchData = async () => {
  const result = await fetchPaginatedData(
    'inventory',
    page,
    pageSize,
    {
      select: 'id, material_name, quantity, unit, suppliers(name)',
      orderBy: { column: 'material_name', ascending: true },
      searchColumns: ['material_name', 'color'],
      searchTerm: searchQuery,
      filters: { status: 'active' }
    }
  );
  
  setData(result.data);
  setTotalCount(result.count);
};
```

By implementing these pagination and optimization techniques, you can significantly improve the performance of your application when dealing with large datasets. 