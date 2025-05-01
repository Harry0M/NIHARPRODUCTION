
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { OrderContent } from "@/components/orders/list/OrderContent";
import { OrderHeader } from "@/components/orders/list/OrderHeader";
import { OrderListFilters, DBOrderStatus, OrderStatus } from "@/types/order";
import { supabase } from "@/integrations/supabase/client";
import { Order } from "@/types/order";
import OrderFilter from "@/components/orders/OrderFilter";
import { useOrderDeletion } from "@/hooks/use-order-deletion";
import { DeleteOrderDialog } from "@/components/orders/list/DeleteOrderDialog";
import { downloadTableAsCsv, downloadTableAsPdf } from "@/utils/downloadUtils";

interface OrderFilters extends OrderListFilters {
  searchQuery: string;
}

const OrderList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"grid" | "list">("list"); // Default to list view
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [filters, setFilters] = useState<OrderFilters>({
    status: '' as OrderStatus | '',
    dateRange: {
      from: undefined,
      to: undefined,
    },
    searchQuery: '',
  });

  // Use the order deletion hook
  const { 
    deleteDialogOpen, 
    deleteLoading, 
    orderToDelete,
    setDeleteDialogOpen, 
    handleDeleteClick, 
    handleDeleteOrder 
  } = useOrderDeletion((id) => {
    // After deletion, remove the order from the local state
    setOrders(prev => prev.filter(order => order.id !== id));
  });

  // Fetch orders with filters
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.status && filters.status !== '') {
        // Map frontend status to database status if needed
        const dbStatus: DBOrderStatus | '' = 
          filters.status === 'processing' ? 'in_production' : filters.status as DBOrderStatus | '';
          
        // Only apply filter if status is not empty
        if (dbStatus !== '') {
          query = query.eq('status', dbStatus);
        }
      }

      if (filters.dateRange.from) {
        const fromDate = format(filters.dateRange.from, 'yyyy-MM-dd');
        query = query.gte('order_date', fromDate);
      }

      if (filters.dateRange.to) {
        const toDate = format(filters.dateRange.to, 'yyyy-MM-dd');
        query = query.lte('order_date', toDate);
      }

      if (filters.searchQuery) {
        query = query.ilike('company_name', `%${filters.searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Map database records to Order interface
      const formattedOrders = data.map((item: any) => ({
        id: item.id,
        order_number: item.order_number,
        company_name: item.company_name,
        quantity: item.quantity,
        bag_length: item.bag_length,
        bag_width: item.bag_width,
        rate: item.rate,
        order_date: item.order_date,
        delivery_date: item.delivery_date,
        status: mapDbStatusToFrontend(item.status), // Map DB status to frontend status
        created_at: item.created_at
      }));
      
      setOrders(formattedOrders);

    } catch (error: any) {
      toast({
        title: "Error fetching orders",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Helper function to map DB status to frontend status
  const mapDbStatusToFrontend = (status: DBOrderStatus): OrderStatus => {
    if (status === 'in_production') return 'processing';
    return status as OrderStatus;
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleFilterChange = (newFilters: OrderFilters) => {
    setFilters(newFilters);
  };

  const onDeleteClick = (orderId: string) => {
    handleDeleteClick(orderId);
  };

  const onSelectOrder = (orderId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const onSelectAllOrders = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedOrders(orders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleDownloadCsv = () => {
    downloadTableAsCsv(orders, 'orders', [
      { header: 'Order #', accessor: 'order_number' },
      { header: 'Company', accessor: 'company_name' },
      { header: 'Quantity', accessor: 'quantity' },
      { header: 'Bag Size', accessor: (row) => `${row.bag_length}" × ${row.bag_width}"` },
      { header: 'Order Date', accessor: (row) => format(new Date(row.order_date), 'PP') },
      { header: 'Status', accessor: 'status' }
    ]);
  };

  const handleDownloadPdf = () => {
    downloadTableAsPdf(orders, 'Orders', [
      { header: 'Order #', accessor: 'order_number' },
      { header: 'Company', accessor: 'company_name' },
      { header: 'Quantity', accessor: 'quantity' },
      { header: 'Bag Size', accessor: (row) => `${row.bag_length}" × ${row.bag_width}"` },
      { header: 'Order Date', accessor: (row) => format(new Date(row.order_date), 'PP') },
      { header: 'Status', accessor: 'status' }
    ]);
  };

  const isFiltering = !!filters.status || !!filters.dateRange.from || !!filters.dateRange.to || !!filters.searchQuery;

  return (
    <div className="container mx-auto py-6">
      <OrderHeader 
        onDownloadCsv={handleDownloadCsv}
        onDownloadPdf={handleDownloadPdf}
        loading={loading}
        ordersCount={orders.length}
      />

      <div className="mt-6">
        <OrderFilter onFilterChange={handleFilterChange} />
      </div>

      <Tabs defaultValue="all" className="space-y-4 mt-6">
        <TabsList className="hidden">
          <TabsTrigger value="all">All Orders</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <OrderContent
            orders={orders}
            view={view}
            setView={setView}
            isFiltering={isFiltering}
            loading={loading}
            onDeleteClick={onDeleteClick}
          />
        </TabsContent>
      </Tabs>

      {/* Delete order confirmation dialog */}
      <DeleteOrderDialog 
        open={deleteDialogOpen}
        loading={deleteLoading}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteOrder}
      />
    </div>
  );
};

export default OrderList;
