
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, MoreHorizontal, Plus, Trash, ChevronRight, Edit, FileText, Package } from "lucide-react";
import { formatDate, getStatusColor, getStatusDisplay } from "@/utils/orderUtils";
import type { Order } from "@/types/order";
import { Badge } from "@/components/ui/badge";

interface OrderCardProps {
  order: Order;
  onDeleteClick: (orderId: string) => void;
  isSelected?: boolean;
  onSelectChange?: (isSelected: boolean) => void;
}

export const OrderCard = ({ order, onDeleteClick, isSelected = false, onSelectChange }: OrderCardProps) => {
  return (
    <Card className={`mb-4 border-border/60 shadow-sm hover:shadow transition-all ${isSelected ? "border-primary/70 bg-primary/5 dark:bg-primary/10" : "hover:border-border/80"}`}>
      <CardHeader className="pb-2 pt-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            {onSelectChange && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelectChange(!!checked)}
                aria-label={`Select order ${order.order_number}`}
                className="transition-opacity"
              />
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge 
                  variant="outline" 
                  className={`${getStatusColor(order.status)} text-xs font-medium border-none shadow-sm px-2 py-0.5`}
                >
                  {getStatusDisplay(order.status)}
                </Badge>
                <span className="text-xs text-muted-foreground">{formatDate(order.order_date)}</span>
              </div>
              <CardTitle className="text-lg flex items-center gap-1.5">
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-xs">
                  {order.order_number}
                </span>
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = `/orders/${order.id}`;
                  }} 
                  className="text-primary hover:text-primary/80 hover:underline flex items-center gap-1 transition-colors text-sm"
                >
                  View details
                  <ChevronRight className="h-3 w-3 opacity-70" />
                </a>
              </CardTitle>
              <CardDescription className="mt-1 flex items-center gap-1">
                <Package className="h-3 w-3 text-muted-foreground/70" />
                {order.company_name}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 hover:bg-muted/50 dark:hover:bg-muted/20 rounded-full"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-border/60 shadow-md">
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => window.location.href = `/orders/${order.id}`}
              >
                <Eye className="mr-2 h-4 w-4 text-blue-500" /> 
                <span>View Details</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => window.location.href = `/orders/${order.id}/edit`}
              >
                <Edit className="mr-2 h-4 w-4 text-amber-500" /> 
                <span>Edit Order</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => window.location.href = `/production/job-cards/new?orderId=${order.id}`}
              >
                <FileText className="mr-2 h-4 w-4 text-green-500" /> 
                <span>Create Job Card</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDeleteClick(order.id)}
                className="cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20"
              >
                <Trash className="mr-2 h-4 w-4" /> 
                <span>Delete Order</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pb-4 pt-0">
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm p-3 rounded-md bg-muted/30 dark:bg-muted/20 mt-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Quantity:</span>
            <span className="font-medium">{order.quantity.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Size:</span>
            <span className="font-medium">{order.bag_length} × {order.bag_width}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
