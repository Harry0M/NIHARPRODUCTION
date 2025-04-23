import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { OrderFilter } from "@/components/orders/OrderFilter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eye, MoreHorizontal, Package2Icon, Plus, Trash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Database } from "@/integrations/supabase/types";
import { DownloadButton } from "@/components/DownloadButton";
import { downloadAsCSV, formatDataForCSV } from "@/utils/downloadUtils";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface Order {
  id: string;
  order_number: string;
  company_name: string;
  quantity: number;
  bag_length: number;
  bag_width: number;
  order_date: string;
  status: OrderStatus;
  rate: number | null;
  created_at: string;
}

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

    fetchOrders();
  }, [filters]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "ready_for_dispatch":
      case "dispatched":
        return "bg-blue-100 text-blue-800";
      case "in_production":
      case "cutting":
      case "printing":
      case "stitching":
        return "bg-amber-100 text-amber-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusDisplay = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
      const jobCardIds = jobCards?.map(jc => jc.id) || [];
      
      // Delete in sequence to respect foreign key constraints
      if (jobCardIds.length > 0) {
        // Delete all cutting components
        for (const jobCardId of jobCardIds) {
          const { data: cuttingJobs } = await supabase
            .from('cutting_jobs')
            .select('id')
            .eq('job_card_id', jobCardId);
          
          if (cuttingJobs && cuttingJobs.length > 0) {
            for (const job of cuttingJobs) {
              await supabase
                .from('cutting_components')
                .delete()
                .eq('cutting_job_id', job.id);
            }
          }
          
          // Delete cutting jobs
          await supabase
            .from('cutting_jobs')
            .delete()
            .eq('job_card_id', jobCardId);
          
          // Delete printing jobs
          await supabase
            .from('printing_jobs')
            .delete()
            .eq('job_card_id', jobCardId);
            
          // Delete stitching jobs
          await supabase
            .from('stitching_jobs')
            .delete()
            .eq('job_card_id', jobCardId);
        }
        
        // Delete job cards
        await supabase
          .from('job_cards')
          .delete()
          .eq('order_id', orderToDelete);
      }
      
      // Delete order components
      await supabase
        .from('order_components')
        .delete()
        .eq('order_id', orderToDelete);
      
      // Delete order dispatch
      await supabase
        .from('order_dispatches')
        .delete()
        .eq('order_id', orderToDelete);
        
      // Delete the order itself
      const { error: orderDeleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderToDelete);
        
      if (orderDeleteError) throw orderDeleteError;
      
      // Update the orders list by removing the deleted order
      setOrders(orders.filter(order => order.id !== orderToDelete));
      
      toast({
        title: "Order deleted successfully",
        description: "The order and all related records have been removed.",
      });
      console.log("Order deleted successfully");
    } catch (error: any) {
      console.error("Error deleting order:", error);
      toast({
        title: "Error deleting order",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
      setDeleteLoading(false);
    }
  };

  const confirmDeleteOrder = (orderId: string) => {
    setOrderToDelete(orderId);
    setDeleteDialogOpen(true);
  };

  const renderMobileOrderCard = (order: Order) => (
    <Card key={order.id} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              <Link to={`/orders/${order.id}`} className="hover:text-primary hover:underline">
                {order.order_number}
              </Link>
            </CardTitle>
            <CardDescription>{order.company_name}</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/orders/${order.id}`}>
                  <Eye className="mr-2 h-4 w-4" /> View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/production/job-cards/new?orderId=${order.id}`}>
                  <Plus className="mr-2 h-4 w-4" /> Create Job Card
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => confirmDeleteOrder(order.id)}>
                <Trash className="mr-2 h-4 w-4" /> Delete Order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Quantity:</span>
            <span className="font-medium">{order.quantity.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Size:</span>
            <span className="font-medium">{order.bag_length} × {order.bag_width}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date:</span>
            <span className="font-medium">{formatDate(order.order_date)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Status:</span>
            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(order.status)}`}>
              {getStatusDisplay(order.status)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const handleDownloadOrders = () => {
    const formattedOrders = orders.map(order => formatDataForCSV(order));
    downloadAsCSV(formattedOrders, 'orders-list');
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
            onClick={handleDownloadOrders} 
            label="Download Orders"
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
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package2Icon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No orders found</h3>
              <p className="text-muted-foreground mb-4">
                {filters.searchTerm || filters.status !== "all" || filters.dateRange.from || filters.dateRange.to
                  ? "Try changing your search or filter"
                  : "Create your first order to get started"}
              </p>
              <Link to="/orders/new">
                <Button>
                  <Plus className="mr-1 h-4 w-4" />
                  New Order
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {isMobile ? (
                <div className="space-y-4">
                  {orders.map(renderMobileOrderCard)}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Order Number</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Size (in)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            <Link 
                              to={`/orders/${order.id}`}
                              className="hover:text-primary hover:underline"
                            >
                              {order.order_number}
                            </Link>
                          </TableCell>
                          <TableCell>{order.company_name}</TableCell>
                          <TableCell className="text-right">{order.quantity.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            {order.bag_length} × {order.bag_width}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(order.status)}`}>
                              {getStatusDisplay(order.status)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatDate(order.order_date)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to={`/orders/${order.id}`}>
                                    <Eye className="mr-2 h-4 w-4" /> View Details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to={`/production/job-cards/new?orderId=${order.id}`}>
                                    <Plus className="mr-2 h-4 w-4" /> Create Job Card
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => confirmDeleteOrder(order.id)}>
                                  <Trash className="mr-2 h-4 w-4" /> Delete Order
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the order and all associated job cards, cutting jobs, printing jobs,
              and stitching jobs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteOrder();
              }}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? "Deleting..." : "Delete Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrderList;
