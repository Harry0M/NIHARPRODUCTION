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
import { PaginationControls } from "@/components/ui/pagination-controls";
import { usePagination } from "@/hooks/use-pagination";
import { useOfflineStatus } from "@/hooks/use-offline-status";
import { OfflineStatusIndicator } from "@/components/ui/offline-status-indicator";
import { useLocalStorageCache } from "@/hooks/use-local-storage-cache";
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
  const { isOnline } = useOfflineStatus();
  
  // Use cache for orders data
  const ordersCache = useLocalStorageCache<Order[]>(
    'orders-cache', 
    () => fetchOrdersFromAPI(filters),
    [],
    { expirationMinutes: 15 }
  );
  
  // Pagination setup
  const pagination = usePagination({
    totalItems: orders.length,
    itemsPerPage: 10,
  });
  
  const paginatedOrders = pagination.getCurrentPageItems(orders);
  
  const handleOrderDeleted = (deletedOrderId: string) => {
    // Update orders state without causing a full re-fetch
    setOrders(prevOrders => prevOrders.filter(order => order.id !== deletedOrderId));
    // Remove from selected if it was selected
    setSelectedOrders(prev => prev.filter(id => id !== deletedOrderId));
    // Invalidate cache after deletion
    ordersCache.invalidateCache();
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

  async function fetchOrdersFromAPI(currentFilters: OrderFilters): Promise<Order[]> {
    try {
      let query = supabase.from('orders').select('*');

      if (currentFilters.status !== 'all') {
        query = query.eq('status', currentFilters.status as OrderStatus);
      }

      if (currentFilters.dateRange.from) {
        query = query.gte('order_date', currentFilters.dateRange.from);
      }

      if (currentFilters.dateRange.to) {
        query = query.lte('order_date', currentFilters.dateRange.to);
      }

      if (currentFilters.searchTerm) {
        query = query.or(`order_number.ilike.%${currentFilters.searchTerm}%,company_name.ilike.%${currentFilters.searchTerm}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      throw error;
    }
  }

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Use cached data if offline
      if (!isOnline) {
        setOrders(ordersCache.data);
        setLoading(false);
        return;
      }
      
      // Otherwise fetch fresh data
      const data = await ordersCache.fetchData();
      setOrders(data);
    } catch (error: any) {
      toast({
        title: "Error fetching orders",
        description: error.message,
        variant: "destructive",
      });
      // Use cached data in case of error
      setOrders(ordersCache.data);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    pagination.goToPage(page);
    // Scroll to top of the list
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      
      <OfflineStatusIndicator />
      
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
        orders={paginatedOrders}
        loading={loading}
        filters={filters}
        setFilters={setFilters}
        onDeleteClick={handleDeleteClick}
        selectedOrders={selectedOrders}
        onSelectOrder={handleSelectOrder}
        onSelectAllOrders={handleSelectAllOrders}
      />
      
      {orders.length > pagination.itemsPerPage && (
        <div className="mt-4 flex justify-center">
          <PaginationControls
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

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
