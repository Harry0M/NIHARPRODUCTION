
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck } from "lucide-react";
import type { DispatchData } from "@/types/dispatch";
import { BatchesList } from "./BatchesList";
import type { DispatchBatch } from "@/types/dispatch";

interface DispatchDetailsProps {
  dispatch: DispatchData;
  batches: DispatchBatch[];
}

export const DispatchDetails = ({ dispatch, batches }: DispatchDetailsProps) => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" /> Dispatch Details
        </CardTitle>
        <CardDescription>
          This order was dispatched on {new Date(dispatch.created_at || '').toLocaleDateString()} to {dispatch.recipient_name}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div><strong>Recipient Name:</strong> {dispatch.recipient_name}</div>
          <div><strong>Delivery Address:</strong> {dispatch.delivery_address}</div>
          <div><strong>Tracking Number:</strong> {dispatch.tracking_number || "—"}</div>
          <div><strong>Notes:</strong> {dispatch.notes || "—"}</div>
          <div><strong>Quality Check:</strong> {dispatch.quality_checked ? "Yes" : "No"}</div>
          <div><strong>Quantity Check:</strong> {dispatch.quantity_checked ? "Yes" : "No"}</div>
        </div>

        <BatchesList batches={batches} />
      </CardContent>
    </Card>
  );
};
