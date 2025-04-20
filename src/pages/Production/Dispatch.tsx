import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Search, 
  Truck, 
  Check, 
  AlertTriangle 
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

// Update the OrderStatus type to include "dispatched" as a valid value
type OrderStatus = "pending" | "completed" | "in_production" | "cutting" | "printing" | "stitching" | "ready_for_dispatch" | "cancelled" | "dispatched";

interface OrderWithJobStatus {
  id: string;
  order_number: string;
  company_name: string;
  quantity: number;
  rate: number | null;
  status: OrderStatus;
  created_at: string;
  job_cards: {
    id: string;
    job_name: string;
    status: string;
    cutting_jobs: {
      status: string;
    }[] | null;
    printing_jobs: {
      status: string;
    }[] | null;
    stitching_jobs: {
      status: string;
    }[] | null;
  }[] | null;
}

const Dispatch = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderWithJobStatus[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchOrders();
  }, []);
  
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, 
          order_number,
          company_name,
          quantity,
          rate,
          status,
          created_at,
          job_cards (
            id,
            job_name,
            status,
            cutting_jobs (status),
            printing_jobs (status),
            stitching_jobs (status)
          )
        `)
        .order('created_at', { ascending: false });
      
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
  
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      
      if (error) throw error;
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus } 
            : order
        )
      );
      
      toast({
        title: "Status Updated",
        description: `Order status has been updated to ${newStatus}`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  const isOrderReadyForDispatch = (order: OrderWithJobStatus): boolean => {
    // If there are no job cards, it's not ready
    if (!order.job_cards || order.job_cards.length === 0) return false;
    
    // Check if all job processes are completed
    for (const jobCard of order.job_cards) {
      // Check cutting status
      const hasCuttingJobs = jobCard.cutting_jobs && jobCard.cutting_jobs.length > 0;
      const allCuttingCompleted = hasCuttingJobs && 
        jobCard.cutting_jobs?.every(job => job.status === 'completed');
      
      // Check printing status
      const hasPrintingJobs = jobCard.printing_jobs && jobCard.printing_jobs.length > 0;
      const allPrintingCompleted = hasPrintingJobs && 
        jobCard.printing_jobs?.every(job => job.status === 'completed');
      
      // Check stitching status
      const hasStitchingJobs = jobCard.stitching_jobs && jobCard.stitching_jobs.length > 0;
      const allStitchingCompleted = hasStitchingJobs && 
        jobCard.stitching_jobs?.every(job => job.status === 'completed');
      
      // If any process exists but isn't completed, order is not ready for dispatch
      if ((hasCuttingJobs && !allCuttingCompleted) ||
          (hasPrintingJobs && !allPrintingCompleted) ||
          (hasStitchingJobs && !allStitchingCompleted)) {
        return false;
      }
    }
    
    return true;
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-amber-100 text-amber-800";
      case "dispatched":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const filteredOrders = orders.filter(order => {
    const matchesSearch = (
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dispatch</h1>
        <p className="text-muted-foreground">Manage order dispatch and delivery</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck size={18} />
            Orders Ready for Dispatch
          </CardTitle>
          <CardDescription>View and manage orders that are ready for dispatch</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_production">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="dispatched">Dispatched</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchOrders}>Refresh</Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Truck className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No orders found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== "all"
                      ? "Try changing your search or filter"
                      : "No orders are currently available for dispatch"}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[160px]">Order No.</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Production</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => {
                        const readyForDispatch = isOrderReadyForDispatch(order);
                        const isDispatched = order.status === "dispatched";
                        
                        return (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">
                              {order.order_number}
                            </TableCell>
                            <TableCell>{order.company_name}</TableCell>
                            <TableCell>{order.quantity.toLocaleString()} bags</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {readyForDispatch ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                                  <Check size={12} /> Ready
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                                  <AlertTriangle size={12} /> In Progress
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{formatDate(order.created_at)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => navigate(`/orders/${order.id}`)}
                                  variant="outline"
                                >
                                  View Details
                                </Button>
                                {!isDispatched && readyForDispatch && (
                                  <Button
                                    size="sm"
                                    onClick={() => updateOrderStatus(order.id, "dispatched")}
                                  >
                                    Mark Dispatched
                                  </Button>
                                )}
                                {isDispatched && (
                                  <Button
                                    size="sm"
                                    onClick={() => updateOrderStatus(order.id, "completed")}
                                    variant="outline"
                                  >
                                    Mark Completed
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dispatch;
