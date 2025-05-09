
import { Button } from "@/components/ui/button";
import { Plus, Package, Trash2, RefreshCw } from "lucide-react";
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
import { Card } from "@/components/ui/card";
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

  return (
    <Card>
      <div className="p-4 flex justify-between items-center">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleManualRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
        
        <Button onClick={() => navigate('/inventory/catalog/new')}>
          <Plus size={16} className="mr-2" />
          Add Product
        </Button>
      </div>

      {isLoading || isRefreshing ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : products?.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-muted-foreground">No products in catalog.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Size (L×W)</TableHead>
              <TableHead>Default Quantity</TableHead>
              <TableHead>Default Rate</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products?.map((product) => (
              <TableRow 
                key={product.id}
                className="cursor-pointer hover:bg-muted"
              >
                <TableCell onClick={() => navigate(`/inventory/catalog/${product.id}`)}>{product.name}</TableCell>
                <TableCell onClick={() => navigate(`/inventory/catalog/${product.id}`)}>{`${product.bag_length}×${product.bag_width}`}</TableCell>
                <TableCell onClick={() => navigate(`/inventory/catalog/${product.id}`)}>{product.default_quantity || 'N/A'}</TableCell>
                <TableCell onClick={() => navigate(`/inventory/catalog/${product.id}`)}>{product.default_rate ? `₹${product.default_rate}` : (product.selling_rate ? `₹${product.selling_rate}` : 'N/A')}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/inventory/catalog/${product.id}/orders`);
                    }}
                  >
                    <Package size={16} className="mr-2" />
                    Orders
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setProductToDelete(product.id);
                    }}
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AlertDialog open={!!productToDelete} onOpenChange={(isOpen) => !isDeleting && setProductToDelete(isOpen ? productToDelete : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product and its components from the catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
                  Deleting...
                </div>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default CatalogList;
