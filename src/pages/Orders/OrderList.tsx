
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
  
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase.from('orders').select('*');

      if (filters.status !== 'all') {
        // Make sure to cast the status to OrderStatus type when it's not 'all'
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

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;

    setDeleteLoading(true);
    try {
      console.log("Attempting to delete order with ID:", orderToDelete);
      
      // First find all job cards associated with this order
      const { data: jobCards, error: jobCardsError } = await supabase
        .from('job_cards')
        .select('id')
        .eq('order_id', orderToDelete);
      
      if (jobCardsError) throw jobCardsError;
      console.log("Found job cards:", jobCards);
      
      const jobCardIds = jobCards?.map(jc => jc.id) || [];
      
      // Start deletion process with error handling for each step
      if (jobCardIds.length > 0) {
        console.log("Processing job cards for deletion:", jobCardIds);
        
        // Process each job card one by one to prevent timeout
        for (const jobCardId of jobCardIds) {
          console.log("Processing job card:", jobCardId);
          
          // Delete cutting components
          try {
            const { data: cuttingJobs } = await supabase
              .from('cutting_jobs')
              .select('id')
              .eq('job_card_id', jobCardId);
            
            if (cuttingJobs && cuttingJobs.length > 0) {
              console.log(`Found ${cuttingJobs.length} cutting jobs to delete components from`);
              for (const job of cuttingJobs) {
                const { error } = await supabase
                  .from('cutting_components')
                  .delete()
                  .eq('cutting_job_id', job.id);
                
                if (error) {
                  console.error(`Error deleting cutting components for job ${job.id}:`, error);
                }
              }
            }
          } catch (error) {
            console.error("Error processing cutting components:", error);
          }
          
          // Delete cutting jobs
          try {
            const { error } = await supabase
              .from('cutting_jobs')
              .delete()
              .eq('job_card_id', jobCardId);
            
            if (error) {
              console.error(`Error deleting cutting jobs for card ${jobCardId}:`, error);
            }
          } catch (error) {
            console.error("Error deleting cutting jobs:", error);
          }
          
          // Delete printing jobs
          try {
            const { error } = await supabase
              .from('printing_jobs')
              .delete()
              .eq('job_card_id', jobCardId);
            
            if (error) {
              console.error(`Error deleting printing jobs for card ${jobCardId}:`, error);
            }
          } catch (error) {
            console.error("Error deleting printing jobs:", error);
          }
          
          // Delete stitching jobs
          try {
            const { error } = await supabase
              .from('stitching_jobs')
              .delete()
              .eq('job_card_id', jobCardId);
            
            if (error) {
              console.error(`Error deleting stitching jobs for card ${jobCardId}:`, error);
            }
          } catch (error) {
            console.error("Error deleting stitching jobs:", error);
          }
        }
        
        // Delete job cards after processing all their children
        try {
          console.log("Deleting job cards:", jobCardIds);
          const { error } = await supabase
            .from('job_cards')
            .delete()
            .eq('order_id', orderToDelete);
          
          if (error) {
            console.error("Error deleting job cards:", error);
            throw error;
          }
        } catch (error) {
          console.error("Error in job card deletion:", error);
        }
      }
      
      // Delete order components
      try {
        console.log("Deleting order components");
        const { error } = await supabase
          .from('order_components')
          .delete()
          .eq('order_id', orderToDelete);
        
        if (error) {
          console.error("Error deleting order components:", error);
        }
      } catch (error) {
        console.error("Error in order component deletion:", error);
      }
      
      // Delete order dispatch
      try {
        console.log("Deleting order dispatches");
        const { error } = await supabase
          .from('order_dispatches')
          .delete()
          .eq('order_id', orderToDelete);
        
        if (error) {
          console.error("Error deleting order dispatches:", error);
        }
      } catch (error) {
        console.error("Error in order dispatch deletion:", error);
      }
      
      // Delete the order itself
      try {
        console.log("Deleting the order itself");
        const { error: orderDeleteError } = await supabase
          .from('orders')
          .delete()
          .eq('id', orderToDelete);
        
        if (orderDeleteError) {
          console.error("Error deleting order:", orderDeleteError);
          throw orderDeleteError;
        }
      } catch (error) {
        console.error("Error in final order deletion:", error);
        throw error;
      }
      
      // Update the orders list by removing the deleted order
      console.log("Updating local state");
      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderToDelete));
      
      toast({
        title: "Order deleted successfully",
        description: "The order and all related records have been removed.",
      });
      console.log("Order deleted successfully");
      
    } catch (error: any) {
      console.error("Error deleting order:", error);
      toast({
        title: "Error deleting order",
        description: error.message || "An error occurred while deleting the order",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
      setDeleteLoading(false);
    }
  };

  const handleDeleteClick = (orderId: string) => {
    setOrderToDelete(orderId);
    setDeleteDialogOpen(true);
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
