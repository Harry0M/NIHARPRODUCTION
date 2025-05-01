
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Order, OrderStatus } from "@/types/order";
import { Link } from "react-router-dom";
import { ArrowUpDown, Eye, Pencil, Trash } from "lucide-react";

interface OrderTableProps {
  orders: Order[];
  onDeleteClick?: (orderId: string) => void;
}

export function OrderTable({ orders, onDeleteClick }: OrderTableProps) {
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
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button variant="ghost" className="p-0 h-8">
                Order # <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" className="p-0 h-8">
                Customer <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Bag Size</TableHead>
            <TableHead>
              <Button variant="ghost" className="p-0 h-8">
                Order Date <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>{order.order_number}</TableCell>
              <TableCell className="font-medium">{order.company_name}</TableCell>
              <TableCell className="text-right">{order.quantity}</TableCell>
              <TableCell className="text-right">
                {order.bag_length}" × {order.bag_width}"
              </TableCell>
              <TableCell>{format(new Date(order.order_date), "PP")}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(order.status as OrderStatus)} variant="outline">
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/orders/${order.id}`}>
                      <Eye size={16} />
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/orders/${order.id}/edit`}>
                      <Pencil size={16} />
                    </Link>
                  </Button>
                  {onDeleteClick && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDeleteClick(order.id)}
                    >
                      <Trash size={16} />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default OrderTable;
