
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Eye, MoreHorizontal, Plus, Trash } from "lucide-react";
import { formatDate, getStatusColor, getStatusDisplay } from "@/utils/orderUtils";
import type { Order } from "@/types/order";

interface OrderCardProps {
  order: Order;
  onDeleteClick: (orderId: string) => void;
}

export const OrderCard = ({ order, onDeleteClick }: OrderCardProps) => {
  return (
    <Card className="mb-4">
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
              <DropdownMenuItem onClick={() => onDeleteClick(order.id)}>
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
};
