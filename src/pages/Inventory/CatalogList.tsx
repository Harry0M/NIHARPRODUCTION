import { Button } from "@/components/ui/button";
import { Plus, Package, Trash2, RefreshCw, Eye, PenLine, ShoppingBag, Search, Box, FileCheck, Layers } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { showToast } from "@/components/ui/enhanced-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import PaginationControls from "@/components/ui/pagination-controls";
import { QueryDebugger } from "@/components/debug/QueryDebugger";

const CatalogList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Component lifecycle logging
  useEffect(() => {
    console.log("[CatalogList] Component mounted", {
      initialPage: page,
      initialPageSize: pageSize,
      initialSearchTerm: searchTerm,
      locationPathname: location.pathname,
      timestamp: new Date().toISOString()
    });

    // Test Supabase connection
    const testConnection = async () => {
      try {
        console.log("[CatalogList] Testing Supabase connection...");
        const { data, error } = await supabase
          .from('catalog')
          .select('count')
          .limit(1);
        
        if (error) {
          console.error("[CatalogList] Supabase connection test failed:", error);
        } else {
          console.log("[CatalogList] Supabase connection test successful");
        }
      } catch (err) {
        console.error("[CatalogList] Supabase connection test error:", err);
      }
    };

    testConnection();

    return () => {
      console.log("[CatalogList] Component unmounting", {
        timestamp: new Date().toISOString()
      });
    };
  }, []); // Empty dependency array for mount/unmount only

  // Debounce search term to prevent excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Reset to first page when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: catalogData, isLoading, isFetching, refetch, error, status } = useQuery({
    queryKey: ['catalog', page, pageSize, debouncedSearchTerm],
    queryFn: async () => {
      console.log(`[CatalogList] Starting query - page: ${page}, pageSize: ${pageSize}, searchTerm: "${debouncedSearchTerm}"`);
      console.log(`[CatalogList] Query status: fetching data...`);
      
      try {
        // First get the total count for pagination
        let countQuery = supabase
          .from('catalog')
          .select('id', { count: 'exact', head: true });
        
        if (debouncedSearchTerm) {
          countQuery = countQuery.or(
            `name.ilike.%${debouncedSearchTerm}%,description.ilike.%${debouncedSearchTerm}%`
          );
        }
        
        console.log(`[CatalogList] Executing count query...`);
        const { count, error: countError } = await countQuery;
        
        if (countError) {
          console.error("[CatalogList] Error fetching catalog count:", countError);
          throw countError;
        }
        
        console.log(`[CatalogList] Count query successful: ${count} total items`);
        
        // Then fetch the paginated data
        let query = supabase
          .from('catalog')
          .select('*');
        
        if (debouncedSearchTerm) {
          query = query.or(
            `name.ilike.%${debouncedSearchTerm}%,description.ilike.%${debouncedSearchTerm}%`
          );
        }
        
        // Add pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        
        console.log(`[CatalogList] Executing data query with range ${from}-${to}...`);
        const { data, error } = await query
          .order('created_at', { ascending: false })
          .range(from, to);
        
        if (error) {
          console.error("[CatalogList] Error fetching catalog data:", error);
          throw error;
        }
        
        console.log(`[CatalogList] Data query successful: fetched ${data?.length || 0} items`);
        
        const result = {
          products: data || [],
          totalCount: count || 0
        };
        
        console.log(`[CatalogList] Query completed successfully:`, result);
        return result;
        
      } catch (error) {
        console.error("[CatalogList] Query failed with error:", error);
        throw error;
      }
    },
    // Enhanced query options to prevent loading issues
    enabled: true, // Always enable the query
    staleTime: 30000, // Data is fresh for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes (renamed from cacheTime)
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: true, // Refetch when network reconnects
    retry: (failureCount, error) => {
      console.log(`[CatalogList] Retry attempt ${failureCount} for error:`, error);
      return failureCount < 3;
    },
    retryDelay: attemptIndex => {
      const delay = Math.min(1000 * 2 ** attemptIndex, 30000);
      console.log(`[CatalogList] Retrying in ${delay}ms...`);
      return delay;
    },
    // Add error boundary
    throwOnError: false,
    // Add network mode to handle offline scenarios
    networkMode: 'online'
  });

  const products = catalogData?.products || [];
  const totalCount = catalogData?.totalCount || 0;

  // Debug logging for React Query state
  useEffect(() => {
    console.log(`[CatalogList] Query state changed:`, {
      status,
      isLoading,
      isFetching,
      hasData: !!catalogData,
      dataLength: products.length,
      totalCount,
      error: !!error
    });
  }, [status, isLoading, isFetching, catalogData, products.length, totalCount, error]);

  // Component lifecycle debugging
  useEffect(() => {
    console.log(`[CatalogList] Component mounted or key props changed:`, {
      page,
      pageSize,
      searchTerm,
      debouncedSearchTerm,
      pathname: location.pathname
    });
  }, [page, pageSize, searchTerm, debouncedSearchTerm, location.pathname]);

  // Handle any errors in fetching the catalog
  useEffect(() => {
    if (error) {
      console.error("[CatalogList] Query error detected:", error);
      showToast({
        title: "Error loading products",
        description: "Could not load product catalog. Please try again.",
        type: "error"
      });
    }
  }, [error]);

  // Fallback mechanism: if component has been mounted for a while and we have no data and no loading state, force a refetch
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoading && !isFetching && !catalogData && !error) {
        console.warn("[CatalogList] No data after 3 seconds, forcing refetch...");
        refetch();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isLoading, isFetching, catalogData, error, refetch]);

  // Handle URL parameters and initial mount
  useEffect(() => {
    // Check URL parameters for any refresh flags
    const urlParams = new URLSearchParams(window.location.search);
    const refreshTrigger = urlParams.get('refresh');
    
    // Show welcome toast when product created flag is present
    if (refreshTrigger === 'product-created') {
      showToast({
        title: "Product Created Successfully",
        description: "Your new product has been added to the catalog.",
        type: "success"
      });
      
      // Clean URL by removing the query parameter
      window.history.replaceState({}, '', location.pathname);
      
      // Invalidate queries to force refresh
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
    }
  }, [location.search, location.pathname, queryClient]); // Only depend on search params, not location.key

  const handleManualRefresh = async () => {
    console.log("[CatalogList] Manual refresh initiated");
    setIsRefreshing(true);
    try {
      // First remove all catalog queries from cache
      console.log("[CatalogList] Removing queries from cache...");
      queryClient.removeQueries({ queryKey: ['catalog'] });
      
      // Wait a bit for cache to clear
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Then explicitly refetch
      console.log("[CatalogList] Triggering refetch...");
      await refetch();
      
      console.log("[CatalogList] Manual refresh completed successfully");
      showToast({
        title: "Data Refreshed",
        description: "The catalog list has been refreshed.",
        type: "info"
      });
    } catch (error) {
      console.error("[CatalogList] Manual refresh error:", error);
      showToast({
        title: "Refresh Failed",
        description: "Could not refresh the catalog. Please try again.",
        type: "error"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      setIsDeleting(true);
      console.log(`Deleting product with ID: ${productToDelete}`);
      
      // Call the RPC function to delete the catalog product
      const { data, error } = await supabase
        .rpc('delete_catalog_product', { input_catalog_id: productToDelete });
      
      if (error) {
        console.error("Error deleting product:", error);
        throw error;
      }
      
      // Success!
      showToast({
        title: "Product deleted successfully",
        type: "success"
      });
      
      // Invalidate the catalog query to force a refresh
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
      await refetch();
    } catch (error: unknown) {
      console.error('Error in handleDeleteProduct:', error);
      showToast({
        title: "Failed to delete product",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        type: "error"
      });
    } finally {
      setProductToDelete(null);
      setIsDeleting(false);
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 slide-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <span className="h-6 w-1.5 rounded-full bg-primary inline-block"></span>
            Product Catalog
          </h1>
          <p className="text-muted-foreground mt-1">Manage your bag manufacturing products</p>
        </div>
        
        <div className="flex items-center gap-3 scale-in" style={{animationDelay: '0.1s'}}>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="border-border/60 shadow-sm transition-all"
          >
            <RefreshCw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          
          <Button 
            onClick={() => navigate('/inventory/catalog/new')}
            className="shadow-sm transition-all font-medium"
          >
            <Plus size={16} className="mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm fade-in overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <span className="h-5 w-1 rounded-full bg-primary inline-block"></span>
            All Products
            {!isLoading && !isFetching && !isRefreshing && (
              <Badge 
                variant="outline" 
                className="ml-2 bg-muted/50 text-foreground/80 hover:bg-muted transition-colors border-border/40 shadow-sm"
              >
                <Box className="h-3 w-3 mr-1 text-primary" />
                {totalCount} {totalCount === 1 ? 'product' : 'products'}
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="mt-1">View and manage all your bag products</CardDescription>
          
          <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1); // Reset to first page when search term changes
                }}
                className="pl-9 border-border/60 focus:border-primary/60"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="flex items-center gap-2">
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1); // Reset to first page when page size changes
                }}
              >
                <SelectTrigger className="w-[110px]">
                  <SelectValue placeholder="Items per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {(isLoading || isFetching || isRefreshing) ? (
            <div className="flex flex-col justify-center items-center p-16 slide-up" style={{animationDelay: '0.2s'}}>
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mb-4"></div>
              <p className="text-muted-foreground">
                {isRefreshing ? 'Refreshing catalog...' : 
                 isFetching ? 'Fetching catalog...' : 
                 'Loading catalog...'}
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center bg-muted/20 dark:bg-muted/10 rounded-b-xl slide-up" style={{animationDelay: '0.2s'}}>
              <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
                <Layers className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {searchTerm ? 'No matching products found' : 'No products in catalog'}
              </h3>
              <p className="text-muted-foreground max-w-md mb-6">
                {searchTerm 
                  ? `No products match your search term "${searchTerm}". Try another search or clear the filter.` 
                  : 'You haven\'t added any products to your catalog yet. Add your first product to get started.'}
              </p>
              {searchTerm && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchTerm('')} 
                    className="text-primary hover:bg-primary/5"
                  >
                    <FileCheck className="h-4 w-4 mr-2" />
                    Clear search
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      console.log("[CatalogList] Force reload triggered by user");
                      queryClient.removeQueries({ queryKey: ['catalog'] });
                      refetch();
                    }} 
                    className="text-orange-600 hover:bg-orange-50 border-orange-200"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Force Reload
                  </Button>
                </div>
              )}
              {!searchTerm && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    console.log("[CatalogList] Force reload triggered by user - no search term");
                    queryClient.removeQueries({ queryKey: ['catalog'] });
                    refetch();
                  }} 
                  className="text-orange-600 hover:bg-orange-50 border-orange-200"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Force Reload Data
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border-t border-border/40 overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50 dark:bg-muted/20">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-medium">Product Name</TableHead>
                    <TableHead className="font-medium">Description</TableHead>
                    <TableHead className="font-medium">Base Price</TableHead>
                    <TableHead className="font-medium">Bag Size</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product, index) => (
                    <TableRow
                      key={product.id}
                      className="cursor-pointer hover:bg-muted/40 dark:hover:bg-muted/20 transition-colors"
                      onClick={() => navigate(`/inventory/catalog/${product.id}`)}
                      style={{animationDelay: `${0.05 * index}s`}}
                    >
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate">
                        {product.description || "—"}
                      </TableCell>
                      <TableCell>
                        {product.selling_rate ? `₹${product.selling_rate.toFixed(2)}` : 
                         (product.total_cost ? `₹${product.total_cost.toFixed(2)}` : "—")}
                      </TableCell>
                      <TableCell>
                        {product.bag_length && product.bag_width
                          ? `${product.bag_length}×${product.bag_width}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end items-center gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => e.stopPropagation()}
                                className="h-8 w-8 p-0"
                              >
                                <ShoppingBag className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/inventory/catalog/${product.id}`);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/inventory/catalog/${product.id}/edit`);
                                }}
                              >
                                <PenLine className="h-4 w-4 mr-2" />
                                Edit Product
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950 dark:focus:text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProductToDelete(product.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Product
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination UI */}
          {!isLoading && !isFetching && !isRefreshing && totalPages > 1 && (
            <div className="py-4 border-t border-border/40">
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(1); // Reset to first page when page size changes
                }}
                pageSizeOptions={[5, 10, 20, 50]}
                showPageSizeSelector={true}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this product?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This will permanently delete the product from your catalog, including all its components and material associations. This action cannot be undone.
              </p>
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                <h3 className="text-sm font-medium flex items-center text-amber-800 dark:text-amber-300">
                  <Box className="h-4 w-4 mr-2" /> Important Information
                </h3>
                <ul className="mt-2 text-sm text-amber-700 dark:text-amber-400 list-disc pl-5 space-y-1">
                  <li>Products that are associated with existing orders cannot be deleted.</li>
                  <li>All component materials will also be removed.</li>
                  <li>This does not affect your inventory stock levels.</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteProduct();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Deleting...
                </>
              ) : (
                <>Delete Product</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Debug component for development */}
      <QueryDebugger 
        queryKey={['catalog', page, pageSize, debouncedSearchTerm]}
        enabled={process.env.NODE_ENV === 'development'}
      />
    </div>
  );
};

export default CatalogList;
