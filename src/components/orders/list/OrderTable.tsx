
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, MoreHorizontal, Plus, Trash } from "lucide-react";
import { formatDate, getStatusColor, getStatusDisplay } from "@/utils/orderUtils";
import type { Order } from "@/types/order";

interface OrderTableProps {
  orders: Order[];
  onDeleteClick: (orderId: string) => void;
}

export const OrderTable = ({ orders, onDeleteClick }: OrderTableProps) => {
  return (
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
                    <DropdownMenuItem onClick={() => onDeleteClick(order.id)}>
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
  );
};
