
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, MoreHorizontal, Plus, Trash, ChevronRight, Edit, FileText } from "lucide-react";
import { formatDate, getStatusColor, getStatusDisplay } from "@/utils/orderUtils";
import type { Order } from "@/types/order";
import { Badge } from "@/components/ui/badge";

interface OrderTableProps {
  orders: Order[];
  onDeleteClick: (orderId: string) => void;
  selectedOrders?: string[];
  onSelectOrder?: (orderId: string, isSelected: boolean) => void;
  onSelectAllOrders?: (isSelected: boolean) => void;
}

export const OrderTable = ({ 
  orders, 
  onDeleteClick, 
  selectedOrders = [], 
  onSelectOrder = () => {}, 
  onSelectAllOrders = () => {} 
}: OrderTableProps) => {
  const allSelected = orders.length > 0 && selectedOrders.length === orders.length;
  const someSelected = selectedOrders.length > 0 && selectedOrders.length < orders.length;

  return (
    <div className="rounded-md border border-border/60 shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50 dark:bg-muted/20">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[50px] h-10">
              <Checkbox 
                checked={allSelected}
                onCheckedChange={(checked) => onSelectAllOrders(!!checked)}
                aria-label="Select all orders"
                className={`${someSelected ? "opacity-50" : ""} transition-opacity`}
              />
            </TableHead>
            <TableHead className="w-[180px] font-medium">Order Number</TableHead>
            <TableHead className="font-medium">Company</TableHead>
            <TableHead className="text-right font-medium">Quantity</TableHead>
            <TableHead className="text-right font-medium">Size (in)</TableHead>
            <TableHead className="font-medium">Status</TableHead>
            <TableHead className="text-right font-medium">Date</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order, index) => (
            <TableRow 
              key={order.id} 
              className={`${selectedOrders.includes(order.id) ? "bg-primary/5 dark:bg-primary/10 border-l-2 border-l-primary" : ""} hover:bg-muted/40 dark:hover:bg-muted/20 transition-colors`}
              style={{animationDelay: `${0.05 * index}s`}}
            >
              <TableCell>
                <Checkbox 
                  checked={selectedOrders.includes(order.id)}
                  onCheckedChange={(checked) => onSelectOrder(order.id, !!checked)}
                  aria-label={`Select order ${order.order_number}`}
                />
              </TableCell>
              <TableCell className="font-medium">
                <Link 
                  to={`/orders/${order.id}`}
                  className="text-primary hover:text-primary/80 hover:underline inline-flex items-center gap-1 transition-colors"
                >
                  {order.order_number}
                  <ChevronRight className="h-3 w-3 opacity-70" />
                </Link>
              </TableCell>
              <TableCell className="text-sm">{order.company_name}</TableCell>
              <TableCell className="text-right font-medium text-sm">{order.quantity.toLocaleString()}</TableCell>
              <TableCell className="text-right text-sm">
                <span className="text-muted-foreground font-medium">
                  {order.bag_length} × {order.bag_width}
                </span>
              </TableCell>
              <TableCell>
                <Badge 
                  variant="outline" 
                  className={`${getStatusColor(order.status)} text-xs font-medium border shadow-sm`}
                >
                  {getStatusDisplay(order.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {formatDate(order.order_date)}
              </TableCell>
              <TableCell>
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
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to={`/orders/${order.id}`} className="flex items-center">
                        <Eye className="mr-2 h-4 w-4 text-blue-500" /> 
                        <span>View Details</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to={`/orders/${order.id}/edit`} className="flex items-center">
                        <Edit className="mr-2 h-4 w-4 text-amber-500" /> 
                        <span>Edit Order</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to={`/production/job-cards/new?orderId=${order.id}`} className="flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-green-500" /> 
                        <span>Create Job Card</span>
                      </Link>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
