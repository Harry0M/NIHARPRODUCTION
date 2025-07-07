import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { downloadAsCSV, formatOrdersForDownload } from "@/utils/downloadUtils";
import { generateBulkOrdersPDF } from "@/utils/professionalPdfUtils";
import { DeleteOrderDialog } from "@/components/orders/list/DeleteOrderDialog";
import { BulkDeleteDialog } from "@/components/orders/list/BulkDeleteDialog";
import { useOrderDeletion } from "@/hooks/use-order-deletion";
import { useBulkOrderDeletion } from "@/hooks/use-bulk-order-deletion";
import { OrderHeader } from "@/components/orders/list/OrderHeader";
import { OrderContent } from "@/components/orders/list/OrderContent";
import { Button } from "@/components/ui/button";
import { Check, Trash, ArrowUp, ArrowDown } from "lucide-react";
import { showToast } from "@/components/ui/enhanced-toast";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import PaginationControls from "@/components/ui/pagination-controls";
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  
  const handleOrderDeleted = (deletedOrderId: string) => {
    // Update orders state without causing a full re-fetch
    setOrders(prevOrders => prevOrders.filter(order => order.id !== deletedOrderId));
    // Remove from selected if it was selected
    setSelectedOrders(prev => prev.filter(id => id !== deletedOrderId));
    // Update total count
    setTotalCount(prev => prev - 1);
  };
  
  const handleOrdersDeleted = (deletedOrderIds: string[]) => {
    // Update orders state without causing a full re-fetch
    setOrders(prevOrders => prevOrders.filter(order => !deletedOrderIds.includes(order.id)));
    // Clear selection
    setSelectedOrders([]);
    // Update total count
    setTotalCount(prev => prev - deletedOrderIds.length);
  };

  const { 
    deleteDialogOpen, 
    deleteLoading, 
    setDeleteDialogOpen, 
    handleDeleteClick, 
    handleDeleteOrder 
  } = useOrderDeletion(handleOrderDeleted);
  
  const {
    bulkDeleteDialogOpen,
    bulkDeleteLoading,
    setBulkDeleteDialogOpen,
    handleBulkDeleteClick,
    handleBulkDeleteOrders
  } = useBulkOrderDeletion(handleOrdersDeleted);

  useEffect(() => {
    fetchOrders();
  }, [filters, page, pageSize]);

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
      // First get the total count for pagination
      let countQuery = supabase.from('orders').select('id', { count: 'exact', head: true });

      if (filters.status !== 'all') {
        countQuery = countQuery.eq('status', filters.status as OrderStatus);
      }

      if (filters.dateRange.from) {
        countQuery = countQuery.gte('order_date', filters.dateRange.from);
      }

      if (filters.dateRange.to) {
        countQuery = countQuery.lte('order_date', filters.dateRange.to);
      }

      if (filters.searchTerm) {
        countQuery = countQuery.or(`order_number.ilike.%${filters.searchTerm}%,company_name.ilike.%${filters.searchTerm}%`);
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) throw countError;
      
      setTotalCount(count || 0);
      
      // Then fetch the paginated data
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

      // Add pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      
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
    
    // Use the professional bulk orders PDF generation
    const formattedOrders = formatOrdersForDownload(orders);
    generateBulkOrdersPDF(formattedOrders, 'orders-list');
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
    handleBulkDeleteClick(selectedOrders);
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
  
  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <OrderHeader 
        onDownloadCsv={handleDownloadCSV}
        onDownloadPdf={handleDownloadPDF}
        loading={loading}
        ordersCount={totalCount}
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
        setFilters={(newFilters) => {
          setFilters(newFilters);
          setPage(1); // Reset to first page when filters change
        }}
        onDeleteClick={handleDeleteClick}
        selectedOrders={selectedOrders}
        onSelectOrder={handleSelectOrder}
        onSelectAllOrders={handleSelectAllOrders}
      />
      
      {/* Pagination UI */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1); // Reset to first page when page size changes
            }}
            pageSizeOptions={[5, 10, 20, 50, 100]}
            showPageSizeSelector={true}
            totalCount={totalCount}
          />
        </div>
      )}

      <DeleteOrderDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        isLoading={deleteLoading}
        onConfirm={handleDeleteOrder}
      />

      <BulkDeleteDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        isLoading={bulkDeleteLoading}
        onConfirm={handleBulkDeleteOrders}
        orderCount={selectedOrders.length}
      />
    </div>
  );
};

export default OrderList;
