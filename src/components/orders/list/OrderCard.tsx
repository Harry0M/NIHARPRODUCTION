
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Package2Icon, Trash, Pencil, Eye } from "lucide-react";
import { format } from "date-fns";
import { Order, OrderStatus } from "@/types/order";
import { Link } from "react-router-dom";

interface OrderCardProps {
  order: Order;
  onDeleteClick?: (orderId: string) => void;
}

export function OrderCard({ order, onDeleteClick }: OrderCardProps) {
  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "processing":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "delivered":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between">
          <div className="space-y-1">
            <div className="text-xl font-semibold">{order.company_name}</div>
            <div className="text-sm text-muted-foreground">
              Order #{order.order_number}
            </div>
          </div>
          <Badge className={getStatusColor(order.status as OrderStatus)} variant="outline">
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Package2Icon size={14} />
              Quantity
            </div>
            <div className="font-medium">{order.quantity} bags</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <CalendarIcon size={14} />
              Order Date
            </div>
            <div className="font-medium">
              {format(new Date(order.order_date), "PP")}
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-2 bg-muted rounded-sm">
          <div className="text-sm text-muted-foreground">
            Bag Size: {order.bag_length}" × {order.bag_width}"
          </div>
          {order.rate && (
            <div className="text-sm font-medium mt-1">
              Rate: ₹{order.rate.toFixed(2)}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 p-4 flex justify-between">
        <Button asChild size="sm" variant="outline">
          <Link to={`/orders/${order.id}`}>
            <Eye size={16} className="mr-1" />
            View
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to={`/orders/${order.id}/edit`}>
            <Pencil size={16} className="mr-1" />
            Edit
          </Link>
        </Button>
        {onDeleteClick && (
          <Button 
            size="sm" 
            variant="outline" 
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => onDeleteClick(order.id)}
          >
            <Trash size={16} className="mr-1" />
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default OrderCard;
