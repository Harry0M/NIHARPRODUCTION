
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
import { useState, useEffect } from "react";
import { showToast } from "@/components/ui/enhanced-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const CatalogList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: products, isLoading, refetch, error } = useQuery({
    queryKey: ['catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });

  // Handle any errors in fetching the catalog
  useEffect(() => {
    if (error) {
      console.error("Error fetching catalog:", error);
      showToast({
        title: "Error loading products",
        description: "Could not load product catalog. Please try again.",
        type: "error"
      });
    }
  }, [error]);

  // Force refresh on initial mount and location changes
  useEffect(() => {
    console.log("CatalogList mounted or location changed - refreshing data");
    setIsRefreshing(true);
    
    refetch()
      .then(() => {
        console.log("Catalog data refreshed successfully");
        
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
        }
      })
      .catch((err) => {
        console.error("Error refreshing catalog data:", err);
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  }, [refetch, location.key]); // Add location.key as a dependency to detect navigation

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ['catalog'] });
    refetch()
      .then(() => {
        showToast({
          title: "Data Refreshed",
          description: "The catalog list has been refreshed.",
          type: "info"
        });
      })
      .catch((error) => {
        console.error("Manual refresh error:", error);
      })
      .finally(() => {
        setIsRefreshing(false);
      });
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
    } catch (error: any) {
      console.error('Error in handleDeleteProduct:', error);
      showToast({
        title: "Failed to delete product",
        description: error.message || "An unexpected error occurred",
        type: "error"
      });
    } finally {
      setProductToDelete(null);
      setIsDeleting(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products?.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
            {!isLoading && !isRefreshing && filteredProducts && (
              <Badge 
                variant="outline" 
                className="ml-2 bg-muted/50 text-foreground/80 hover:bg-muted transition-colors border-border/40 shadow-sm"
              >
                <Box className="h-3 w-3 mr-1 text-primary" />
                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="mt-1">View and manage all your bag products</CardDescription>
          
          <div className="mt-4 relative">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 border-border/60 focus:border-primary/60"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading || isRefreshing ? (
            <div className="flex flex-col justify-center items-center p-16 slide-up" style={{animationDelay: '0.2s'}}>
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mb-4"></div>
              <p className="text-muted-foreground">{isRefreshing ? 'Refreshing catalog...' : 'Loading catalog...'}</p>
            </div>
          ) : filteredProducts?.length === 0 ? (
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
                <Button 
                  variant="outline" 
                  onClick={() => setSearchTerm('')} 
                  className="text-primary hover:bg-primary/5"
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border-t border-border/40 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50 dark:bg-muted/20">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-medium">Product Name</TableHead>
                    <TableHead className="font-medium">Size (L×W)</TableHead>
                    <TableHead className="font-medium">Default Quantity</TableHead>
                    <TableHead className="font-medium">Price</TableHead>
                    <TableHead className="text-right font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product, index) => (
                    <TableRow 
                      key={product.id}
                      className="hover:bg-muted/40 dark:hover:bg-muted/20 transition-colors cursor-pointer"
                      style={{animationDelay: `${0.05 * index}s`}}
                    >
                      <TableCell className="font-medium" onClick={() => navigate(`/inventory/catalog/${product.id}`)}>
                        <div className="flex items-center gap-2">
                          <span className="text-primary">{product.name}</span>
                          {product.description && (
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {product.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell onClick={() => navigate(`/inventory/catalog/${product.id}`)}>
                        <Badge variant="outline" className="font-mono text-xs bg-muted/30 dark:bg-muted/20 hover:bg-muted/50 border-border/60">
                          {`${product.bag_length}×${product.bag_width}`}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={() => navigate(`/inventory/catalog/${product.id}`)}>
                        {product.default_quantity ? (
                          <span className="font-medium">{product.default_quantity.toLocaleString()}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell onClick={() => navigate(`/inventory/catalog/${product.id}`)}>
                        {product.default_rate ? (
                          <span className="font-medium text-green-600 dark:text-green-400">₹{product.default_rate}</span>
                        ) : product.selling_rate ? (
                          <span className="font-medium text-green-600 dark:text-green-400">₹{product.selling_rate}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 p-0 hover:bg-muted/50 dark:hover:bg-muted/20 rounded-full"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-more-horizontal">
                                <circle cx="12" cy="12" r="1"/>
                                <circle cx="19" cy="12" r="1"/>
                                <circle cx="5" cy="12" r="1"/>
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[180px] border-border/60 shadow-md">
                            <DropdownMenuItem asChild className="cursor-pointer">
                              <div onClick={() => navigate(`/inventory/catalog/${product.id}`)} className="flex items-center">
                                <Eye className="mr-2 h-4 w-4 text-blue-500" />
                                <span>View Details</span>
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer">
                              <div onClick={() => navigate(`/inventory/catalog/${product.id}/edit`)} className="flex items-center">
                                <PenLine className="mr-2 h-4 w-4 text-amber-500" />
                                <span>Edit Product</span>
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild className="cursor-pointer">
                              <div onClick={() => navigate(`/inventory/catalog/${product.id}/orders`)} className="flex items-center">
                                <ShoppingBag className="mr-2 h-4 w-4 text-green-500" />
                                <span>View Orders</span>
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                setProductToDelete(product.id);
                              }}
                              className="cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!productToDelete} onOpenChange={(isOpen) => !isDeleting && setProductToDelete(isOpen ? productToDelete : null)}>
        <AlertDialogContent className="border-border/60 shadow-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-2">
              This action cannot be undone. This will permanently delete the product and its components from the catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel disabled={isDeleting} className="border-border/60">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></span>
                  Deleting...
                </div>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CatalogList;
