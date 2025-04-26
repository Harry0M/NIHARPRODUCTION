
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Minus } from "lucide-react";
import type { BatchData } from "./types";

interface BatchFormProps {
  batch: BatchData;
  index: number;
  maxQuantity: number;
  canDelete: boolean;
  onBatchChange: (index: number, field: keyof BatchData, value: string | number) => void;
  onBatchDelete: (index: number) => void;
}

export const BatchForm = ({
  batch,
  index,
  maxQuantity,
  canDelete,
  onBatchChange,
  onBatchDelete,
}: BatchFormProps) => {
  return (
    <Card>
      <CardHeader className="py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Batch {index + 1}</CardTitle>
          {canDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onBatchDelete(index)}
            >
              <Minus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              value={batch.quantity}
              onChange={(e) => onBatchChange(index, 'quantity', Number(e.target.value))}
              min="1"
              max={maxQuantity}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Delivery Date</Label>
            <Input
              type="date"
              value={batch.delivery_date}
              onChange={(e) => onBatchChange(index, 'delivery_date', e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Notes (Optional)</Label>
          <Textarea
            value={batch.notes}
            onChange={(e) => onBatchChange(index, 'notes', e.target.value)}
            placeholder="Add any notes for this batch"
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
};
