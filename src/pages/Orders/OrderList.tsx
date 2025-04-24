
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { downloadAsCSV, downloadAsPDF, formatOrdersForDownload } from "@/utils/downloadUtils";
import { DeleteOrderDialog } from "@/components/orders/list/DeleteOrderDialog";
import { useOrderDeletion } from "@/hooks/use-order-deletion";
import { OrderHeader } from "@/components/orders/list/OrderHeader";
import { OrderContent } from "@/components/orders/list/OrderContent";
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
      <OrderHeader 
        onDownloadCsv={handleDownloadCSV}
        onDownloadPdf={handleDownloadPDF}
        loading={loading}
        ordersCount={orders.length}
      />
      
      <OrderContent
        orders={orders}
        loading={loading}
        filters={filters}
        setFilters={setFilters}
        onDeleteClick={handleDeleteClick}
      />

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
