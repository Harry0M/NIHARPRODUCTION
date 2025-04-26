
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DispatchBatch } from "@/types/dispatch";

interface BatchesListProps {
  batches: DispatchBatch[];
}

export const BatchesList = ({ batches }: BatchesListProps) => {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Dispatch Batches</h3>
      <div className="grid gap-4">
        {batches.map((batch) => (
          <Card key={batch.id}>
            <CardHeader className="py-4">
              <CardTitle className="text-base">Batch {batch.batch_number}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div><strong>Quantity:</strong> {batch.quantity}</div>
              <div><strong>Delivery Date:</strong> {new Date(batch.delivery_date).toLocaleDateString()}</div>
              <div><strong>Status:</strong> {batch.status}</div>
              {batch.notes && <div><strong>Notes:</strong> {batch.notes}</div>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
