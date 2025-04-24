
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { OrderFilter } from "@/components/orders/OrderFilter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { DownloadButton } from "@/components/DownloadButton";
import { downloadAsCSV, downloadAsPDF, formatOrdersForDownload } from "@/utils/downloadUtils";
import { OrderTable } from "@/components/orders/list/OrderTable";
import { OrderCard } from "@/components/orders/list/OrderCard";
import { DeleteOrderDialog } from "@/components/orders/list/DeleteOrderDialog";
import { EmptyOrdersState } from "@/components/orders/list/EmptyOrdersState";
import { useOrderDeletion } from "@/hooks/use-order-deletion";
import type { Order, OrderStatus } from "@/types/order";

interface OrderFilters {
  searchTerm: string;
  status: string;
  dateRange: {
    from: string;
    to: string;
  };
}

const OrderList = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<OrderFilters>({
    searchTerm: "",
    status: "all",
    dateRange: { from: "", to: "" }
  });
  
  const isMobile = useIsMobile();

  const handleOrderDeleted = (deletedOrderId: string) => {
    setOrders(prevOrders => prevOrders.filter(order => order.id !== deletedOrderId));
  };

  const { 
    deleteDialogOpen, 
    deleteLoading, 
    setDeleteDialogOpen, 
    handleDeleteClick, 
    handleDeleteOrder 
  } = useOrderDeletion(handleOrderDeleted);

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase.from('orders').select('*');

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status as OrderStatus);
      }

      if (filters.dateRange.from) {
        query = query.gte('order_date', filters.dateRange.from);
      }

      if (filters.dateRange.to) {
        query = query.lte('order_date', filters.dateRange.to);
      }

      if (filters.searchTerm) {
        query = query.or(`order_number.ilike.%${filters.searchTerm}%,company_name.ilike.%${filters.searchTerm}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching orders",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (orders.length === 0) {
      toast({
        title: "No orders to download",
        description: "There are no orders matching your current filters.",
        variant: "destructive",
      });
      return;
    }
    
    const formattedOrders = formatOrdersForDownload(orders);
    downloadAsCSV(formattedOrders, 'orders-list');
  };
  
  const handleDownloadPDF = () => {
    if (orders.length === 0) {
      toast({
        title: "No orders to download",
        description: "There are no orders matching your current filters.",
        variant: "destructive",
      });
      return;
    }
    
    const formattedOrders = formatOrdersForDownload(orders);
    downloadAsPDF(formattedOrders, 'orders-list', 'Orders List');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage and track your manufacturing orders</p>
        </div>
        <div className="flex items-center gap-2">
          <DownloadButton 
            label="Download Orders"
            onCsvClick={handleDownloadCSV}
            onPdfClick={handleDownloadPDF}
            disabled={loading || orders.length === 0}
          />
          <Link to="/orders/new">
            <Button className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-1" />
              New Order
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>A list of all your bag manufacturing orders</CardDescription>
        </CardHeader>
        <CardContent>
          <OrderFilter filters={filters} setFilters={setFilters} />

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : orders.length === 0 ? (
            <EmptyOrdersState 
              hasFilters={filters.searchTerm !== "" || filters.status !== "all" || filters.dateRange.from !== "" || filters.dateRange.to !== ""}
            />
          ) : (
            <>
              {isMobile ? (
                <div className="space-y-4">
                  {orders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onDeleteClick={handleDeleteClick}
                    />
                  ))}
                </div>
              ) : (
                <OrderTable
                  orders={orders}
                  onDeleteClick={handleDeleteClick}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <DeleteOrderDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteOrder}
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default OrderList;
