
import { Button } from "@/components/ui/button";
import { Plus, Package, Trash2, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const CatalogList = () => {
  const navigate = useNavigate();
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ['catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });

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
      toast({
        title: "Product deleted successfully",
        description: "The product and its components have been removed from the catalog."
      });
      await refetch();
    } catch (error: any) {
      console.error('Error in handleDeleteProduct:', error);
      toast({
        title: "Failed to delete product",
        description: `Error: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setProductToDelete(null);
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <div className="p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Product Catalog (BOM)</h1>
        <Button onClick={() => navigate('/inventory/catalog/new')}>
          <Plus size={16} className="mr-2" />
          Add Product
        </Button>
      </div>

      {isLoading ? (
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
                className="hover:bg-muted"
              >
                <TableCell>{product.name}</TableCell>
                <TableCell>{`${product.bag_length}×${product.bag_width}`}</TableCell>
                <TableCell>{product.default_quantity || 'N/A'}</TableCell>
                <TableCell>{product.default_rate ? `₹${product.default_rate}` : 'N/A'}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/inventory/catalog/${product.id}/edit`)}
                  >
                    <Edit size={16} className="mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/inventory/catalog/${product.id}/orders`)}
                  >
                    <Package size={16} className="mr-2" />
                    Orders
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setProductToDelete(product.id)}
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
              className="bg-destructive hover:bg-destructive/90"
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
