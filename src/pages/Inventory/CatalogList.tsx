
import { Button } from "@/components/ui/button";
import { Plus, Package, Trash2 } from "lucide-react";
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
import { toast } from "sonner";

const CatalogList = () => {
  const navigate = useNavigate();
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

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
      const { error } = await supabase
        .from('catalog')
        .delete()
        .eq('id', productToDelete);

      if (error) throw error;

      toast.success("Product deleted successfully");
      refetch();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error("Failed to delete product");
    } finally {
      setProductToDelete(null);
    }
  };

  return (
    <Card>
      <div className="p-4 flex justify-end">
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
                className="cursor-pointer hover:bg-muted"
              >
                <TableCell onClick={() => navigate(`/inventory/catalog/${product.id}`)}>{product.name}</TableCell>
                <TableCell onClick={() => navigate(`/inventory/catalog/${product.id}`)}>{`${product.bag_length}×${product.bag_width}`}</TableCell>
                <TableCell onClick={() => navigate(`/inventory/catalog/${product.id}`)}>{product.default_quantity || 'N/A'}</TableCell>
                <TableCell onClick={() => navigate(`/inventory/catalog/${product.id}`)}>{product.default_rate ? `₹${product.default_rate}` : 'N/A'}</TableCell>
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

      <AlertDialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product and its components from the catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default CatalogList;
