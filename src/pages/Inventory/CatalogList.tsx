
import { Button } from "@/components/ui/button";
import { Plus, Package } from "lucide-react";
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

const CatalogList = () => {
  const navigate = useNavigate();

  const { data: products, isLoading } = useQuery({
    queryKey: ['catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });

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
                onClick={() => navigate(`/inventory/catalog/${product.id}`)}
              >
                <TableCell>{product.name}</TableCell>
                <TableCell>{`${product.bag_length}×${product.bag_width}`}</TableCell>
                <TableCell>{product.default_quantity || 'N/A'}</TableCell>
                <TableCell>{product.default_rate ? `₹${product.default_rate}` : 'N/A'}</TableCell>
                <TableCell className="text-right">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
};

export default CatalogList;
