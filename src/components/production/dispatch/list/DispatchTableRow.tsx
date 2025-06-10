
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Check, AlertTriangle, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { OrderWithJobStatus } from "../types";

interface DispatchTableRowProps {
  order: OrderWithJobStatus;
  isOrderReadyForDispatch: boolean;
  onUpdateStatus: (orderId: string, newStatus: string) => Promise<void>;
}

export const DispatchTableRow = ({ 
  order, 
  isOrderReadyForDispatch,
  onUpdateStatus,
}: DispatchTableRowProps) => {
  const navigate = useNavigate();
  const isDispatched = order.status === "dispatched";
  
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

  return (
    <TableRow>
      <TableCell className="font-medium">{order.order_number}</TableCell>
      <TableCell>{order.company_name}</TableCell>
      <TableCell>{order.quantity.toLocaleString()} bags</TableCell>
      <TableCell>
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(order.status)}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </TableCell>
      <TableCell>
        {isOrderReadyForDispatch ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <Check size={12} /> Ready
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
            <AlertTriangle size={12} /> In Progress
          </Badge>
        )}
      </TableCell>
      <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
      <TableCell className="text-right">        <div className="flex justify-end gap-2">
          {isDispatched ? (
            <>
              <Button
                size="sm"
                onClick={() => navigate(`/dispatch/${order.id}`)}
                variant="outline"
              >
                View Dispatch Details
              </Button>
              <Button
                size="sm"
                onClick={() => navigate(`/dispatch/${order.id}/batches`)}
                variant="outline"
              >
                <Package className="h-4 w-4 mr-1" />
                Manage Batches
              </Button>
              <Button
                size="sm"
                onClick={() => onUpdateStatus(order.id, "completed")}
                variant="outline"
              >
                Mark Completed
              </Button>
            </>
          ) : isOrderReadyForDispatch && (
            <>
              <Button
                size="sm"
                onClick={() => navigate(`/orders/${order.id}`)}
                variant="outline"
              >
                View Order
              </Button>
              <Button
                size="sm"
                onClick={() => navigate(`/dispatch/${order.id}`)}
              >
                Create Dispatch
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};
