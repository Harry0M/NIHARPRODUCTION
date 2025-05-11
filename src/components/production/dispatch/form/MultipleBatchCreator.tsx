
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface MultipleBatchCreatorProps {
  orderQuantity: number;
  onCreateBatches: (numBatches: number, totalQuantity: number, deliveryDate: string) => void;
}

export function MultipleBatchCreator({ orderQuantity, onCreateBatches }: MultipleBatchCreatorProps) {
  const [numBatches, setNumBatches] = useState(1);
  const [totalQuantity, setTotalQuantity] = useState(orderQuantity);
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split("T")[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateBatches(numBatches, totalQuantity, deliveryDate);
  };

  return (
    <Card className="bg-muted/50">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="num-batches">Number of Batches</Label>
            <Input
              id="num-batches"
              type="number"
              min="1"
              value={numBatches}
              onChange={(e) => setNumBatches(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="total-quantity">Total Quantity</Label>
            <Input
              id="total-quantity"
              type="number"
              min="1"
              value={totalQuantity}
              onChange={(e) => setTotalQuantity(parseInt(e.target.value) || orderQuantity)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Order quantity: {orderQuantity}</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="delivery-date">Delivery Date</Label>
            <Input
              id="delivery-date"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="md:col-span-3 flex justify-end">
            <Button type="submit">Create Batches</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
