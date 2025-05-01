
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MoreVertical, Edit, Trash, ArrowLeft, CheckCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { OrderContent } from "@/components/orders/list/OrderContent";
import { OrderListFilters } from "@/types/order";
import { supabase } from "@/integrations/supabase/client";
import { Order, OrderStatus } from "@/types/order";
import OrderFilter from "@/components/orders/OrderFilter";

interface OrderFilters extends OrderListFilters {
  searchQuery: string;
}

const OrderList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [filters, setFilters] = useState<OrderFilters>({
    status: '' as '',
    dateRange: {
      from: undefined,
      to: undefined,
    },
    searchQuery: '',
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
        // Use explicit type assertion for the status value
        query = query.eq('status', filters.status);
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
        status: item.status as OrderStatus, // Ensure proper type casting
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

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "Order deleted",
        description: "Order deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting order",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleFilterChange = (newFilters: OrderFilters) => {
    setFilters(newFilters);
  };

  const onDeleteClick = (orderId: string) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      deleteOrderMutation.mutate(orderId);
    }
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

  const isFiltering = !!filters.status || !!filters.dateRange.from || !!filters.dateRange.to || !!filters.searchQuery;

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Orders</h1>
          <Badge variant="secondary">{orders.length} Orders</Badge>
        </div>
        <Button onClick={() => navigate("/orders/new")}>
          Create Order
        </Button>
      </div>

      <OrderFilter onFilterChange={handleFilterChange} />

      <Tabs defaultValue="all" className="space-y-4">
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
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderList;
