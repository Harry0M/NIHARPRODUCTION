
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export const CatalogOrders = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Get catalog product info
  const { data: product } = useQuery({
    queryKey: ['catalog-product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Get orders for this product
  const { data: orders, isLoading } = useQuery({
    queryKey: ['product-orders', id],
    queryFn: async () => {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_components(*)
        `)
        .eq('bag_length', product?.bag_length)
        .eq('bag_width', product?.bag_width);

      if (ordersError) {
        toast({
          title: "Error fetching orders",
          description: ordersError.message,
          variant: "destructive"
        });
        return [];
      }

      return ordersData || [];
    },
    enabled: !!product,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/inventory/catalog')}
        >
          <ArrowLeft size={16} className="mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">
          {product ? `${product.name} - Orders` : 'Product Orders'}
        </h1>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : orders?.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-muted-foreground">No orders found for this product.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((order) => (
                <TableRow 
                  key={order.id} 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <TableCell>{order.order_number}</TableCell>
                  <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                  <TableCell>{order.company_name}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell>{order.rate ? `₹${order.rate}` : 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default CatalogOrders;
