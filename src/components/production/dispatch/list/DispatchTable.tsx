
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DispatchTableRow } from "./DispatchTableRow";
import type { OrderWithJobStatus } from "../types";

interface DispatchTableProps {
  orders: OrderWithJobStatus[];
  isOrderReadyForDispatch: (order: OrderWithJobStatus) => boolean;
  onUpdateStatus: (orderId: string, newStatus: string) => Promise<void>;
}

export const DispatchTable = ({
  orders,
  isOrderReadyForDispatch,
  onUpdateStatus,
}: DispatchTableProps) => {
  return (
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
          {orders.map((order) => (
            <DispatchTableRow
              key={order.id}
              order={order}
              isOrderReadyForDispatch={isOrderReadyForDispatch(order)}
              onUpdateStatus={onUpdateStatus}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
