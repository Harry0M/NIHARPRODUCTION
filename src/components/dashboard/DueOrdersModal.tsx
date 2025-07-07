import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Package, ChevronRight, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, getStatusColor, getStatusDisplay } from "@/utils/orderUtils";

interface DueOrder {
  id: string;
  order_number: string;
  company_name: string;
  quantity: number;
  bag_length: number;
  bag_width: number;
  delivery_date: string;
  status: string;
  order_date: string;
}

interface DueOrdersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DueOrdersModal = ({ open, onOpenChange }: DueOrdersModalProps) => {
  const [orders, setOrders] = useState<DueOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDueOrders = async () => {
    setLoading(true);
    try {
      // Calculate date range for this week
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Start of this week (Sunday)
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // End of this week (Saturday)
      weekEnd.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          company_name,
          quantity,
          bag_length,
          bag_width,
          delivery_date,
          status,
          order_date
        `)
        .not('delivery_date', 'is', null)
        .gte('delivery_date', weekStart.toISOString().split('T')[0])
        .lte('delivery_date', weekEnd.toISOString().split('T')[0])
        .not('status', 'eq', 'completed')
        .not('status', 'eq', 'cancelled')
        .order('delivery_date', { ascending: true });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: unknown) {
      toast({
        title: "Error fetching due orders",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchDueOrders();
    }
  }, [open]);

  const handleViewOrder = (orderId: string) => {
    window.location.href = `/orders/${orderId}`;
  };

  const formatDeliveryDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const deliveryDate = new Date(date);
    deliveryDate.setHours(0, 0, 0, 0);
    
    const diffTime = deliveryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    return `In ${diffDays} days`;
  };

  const getDeliveryDateColor = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const deliveryDate = new Date(date);
    deliveryDate.setHours(0, 0, 0, 0);
    
    const diffTime = deliveryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "text-red-600 font-semibold"; // Overdue
    if (diffDays === 0) return "text-orange-600 font-semibold"; // Today
    if (diffDays === 1) return "text-yellow-600 font-semibold"; // Tomorrow
    return "text-green-600"; // Future
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Orders Due This Week
            {!loading && (
              <Badge variant="outline" className="ml-2">
                {orders.length} order{orders.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh]">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No orders due this week</h3>
              <p className="text-muted-foreground">
                All caught up! No orders have delivery dates scheduled for this week.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Due In</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-primary">
                          {order.order_number}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{order.company_name}</TableCell>
                    <TableCell className="text-right">
                      {order.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {order.bag_length} × {order.bag_width}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(order.status)} text-xs font-medium border shadow-sm`}
                      >
                        {getStatusDisplay(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(order.delivery_date)}
                    </TableCell>
                    <TableCell>
                      <span className={getDeliveryDateColor(order.delivery_date)}>
                        {formatDeliveryDate(order.delivery_date)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewOrder(order.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
        
        {!loading && orders.length > 0 && (
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {orders.length} order{orders.length !== 1 ? 's' : ''} due this week
            </p>
            <Button
              onClick={() => {
                window.location.href = '/orders';
                onOpenChange(false);
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              View All Orders
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
