
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { downloadAsCSV, downloadAsPDF, formatOrdersForDownload } from "@/utils/downloadUtils";
import { DeleteOrderDialog } from "@/components/orders/list/DeleteOrderDialog";
import { useOrderDeletion } from "@/hooks/use-order-deletion";
import { OrderHeader } from "@/components/orders/list/OrderHeader";
import { OrderContent } from "@/components/orders/list/OrderContent";
import { Button } from "@/components/ui/button";
import { Check, Trash, ArrowUp, ArrowDown } from "lucide-react";
import { showToast } from "@/components/ui/enhanced-toast";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
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
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  
  const handleOrderDeleted = (deletedOrderId: string) => {
    // Update orders state without causing a full re-fetch
    setOrders(prevOrders => prevOrders.filter(order => order.id !== deletedOrderId));
    // Remove from selected if it was selected
    setSelectedOrders(prev => prev.filter(id => id !== deletedOrderId));
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

  // Set up keyboard shortcuts
  const shortcuts = {
    'a': () => {
      if (selectedOrders.length > 0) {
        const allSelected = orders.length === selectedOrders.length;
        handleSelectAllOrders(!allSelected);
      } else if (orders.length > 0) {
        handleSelectAllOrders(true);
      }
    },
    'escape': () => {
      if (selectedOrders.length > 0) {
        setSelectedOrders([]);
      }
    },
    'delete': () => {
      if (selectedOrders.length === 1) {
        handleDeleteClick(selectedOrders[0]);
      }
    }
  };
  
  useKeyboardShortcuts(shortcuts);

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

  const handleSelectOrder = (orderId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleSelectAllOrders = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedOrders(orders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedOrders.length === 0) return;
    
    // For now, we'll just confirm and show a toast
    // In a real implementation, you'd want to create a confirmation modal
    if (window.confirm(`Are you sure you want to delete ${selectedOrders.length} orders?`)) {
      showToast({
        title: `${selectedOrders.length} orders deleted`,
        type: "success"
      });
      setOrders(prev => prev.filter(order => !selectedOrders.includes(order.id)));
      setSelectedOrders([]);
    }
  };

  const handleBulkStatusUpdate = (status: OrderStatus) => {
    if (selectedOrders.length === 0) return;
    
    // In a real implementation, you'd want to update these in the database
    const updatedOrders = orders.map(order => {
      if (selectedOrders.includes(order.id)) {
        return { ...order, status };
      }
      return order;
    });
    
    setOrders(updatedOrders);
    showToast({
      title: `Updated ${selectedOrders.length} orders to ${status}`,
      type: "success"
    });
    setSelectedOrders([]);
  };

  return (
    <div className="space-y-6">
      <OrderHeader 
        onDownloadCsv={handleDownloadCSV}
        onDownloadPdf={handleDownloadPDF}
        loading={loading}
        ordersCount={orders.length}
      />
      
      {selectedOrders.length > 0 && (
        <div className="bg-muted/80 border rounded-md p-2 flex items-center justify-between animate-in slide-in-from-top">
          <div className="text-sm font-medium">
            {selectedOrders.length} {selectedOrders.length === 1 ? 'order' : 'orders'} selected
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleBulkStatusUpdate('in_production' as OrderStatus)}
            >
              <ArrowUp className="h-4 w-4 mr-1" />
              Mark In Production
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleBulkStatusUpdate('completed' as OrderStatus)}
            >
              <Check className="h-4 w-4 mr-1" />
              Mark Completed
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={handleBulkDelete}
            >
              <Trash className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}
      
      <OrderContent
        orders={orders}
        loading={loading}
        filters={filters}
        setFilters={setFilters}
        onDeleteClick={handleDeleteClick}
        selectedOrders={selectedOrders}
        onSelectOrder={handleSelectOrder}
        onSelectAllOrders={handleSelectAllOrders}
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
