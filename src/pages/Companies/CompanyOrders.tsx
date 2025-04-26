
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

export const CompanyOrders = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Updated query to fetch company info for display
  const { data: company } = useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Updated query to fetch all orders for this company (both as main company and as sales account)
  const { data: orders, isLoading } = useQuery({
    queryKey: ['companyOrders', id],
    queryFn: async () => {
      // Get orders where company is either the main company or sales account
      const { data: allOrders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_components(*)
        `)
        .or(`company_id.eq.${id},sales_account_id.eq.${id}`);
      
      if (error) {
        toast({
          title: "Error fetching orders",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      return allOrders || [];
    },
    enabled: !!id,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/companies')}
        >
          <ArrowLeft size={16} className="mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">
          {company ? `${company.name} - Orders` : 'Company Orders'}
        </h1>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : orders?.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-muted-foreground">No orders found for this company.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Bag Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((order) => (
                <TableRow key={order.id} className="cursor-pointer hover:bg-muted" onClick={() => navigate(`/orders/${order.id}`)}>
                  <TableCell>{order.order_number}</TableCell>
                  <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                  <TableCell>{order.company_name}</TableCell>
                  <TableCell>
                    {order.company_id === id ? 'Main Company' : 'Sales Account'}
                  </TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>{`${order.bag_length}" × ${order.bag_width}"`}</TableCell>
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

export default CompanyOrders;
