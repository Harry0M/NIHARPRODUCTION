import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wand2 } from "lucide-react";
import { useState } from "react";
import { BatchData } from "./types";

interface MultipleBatchCreatorProps {
  orderQuantity: number;
  createBatches: (batches: BatchData[]) => void;
}

export const MultipleBatchCreator = ({
  orderQuantity,
  createBatches,
}: MultipleBatchCreatorProps) => {
  const [batchCount, setBatchCount] = useState<number>(2);
  const [quantityPerBatch, setQuantityPerBatch] = useState<number>(Math.floor(orderQuantity / 2)); // Default to half the order quantity
  const [deliveryDate, setDeliveryDate] = useState<string>("");

  const handleBatchCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow empty field for fresh input
    if (e.target.value === '') {
      setBatchCount(0);
      return;
    }
    
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setBatchCount(value);
    }
  };

  const handleQuantityPerBatchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow empty field for fresh input
    if (e.target.value === '') {
      setQuantityPerBatch(0);
      return;
    }
    
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setQuantityPerBatch(value);
    }
  };

  const handleDeliveryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeliveryDate(e.target.value);
  };

  const handleCreateBatches = () => {
    if (batchCount <= 0 || quantityPerBatch <= 0 || !deliveryDate) {
      alert("Please fill in all batch creation fields");
      return;
    }

    // Calculate total quantity from batch count × quantity per batch
    const calculatedTotalQuantity = batchCount * quantityPerBatch;
    
    if (calculatedTotalQuantity !== orderQuantity) {
      if (!confirm(`Total quantity (${calculatedTotalQuantity}) doesn't match order quantity (${orderQuantity}). Continue anyway?`)) {
        return;
      }
    }

    // Create identical batches with the same quantity
    const newBatches: BatchData[] = [];
    
    for (let i = 0; i < batchCount; i++) {
      newBatches.push({
        quantity: quantityPerBatch,
        delivery_date: deliveryDate,
        notes: ""
      });
    }
    
    createBatches(newBatches);
  };

  return (
    <Card className="bg-muted/30 mb-4">
      <CardContent className="pt-6">
        <div className="mb-4">
          <h3 className="font-medium">Create Multiple Batches</h3>
          <p className="text-sm text-muted-foreground">
            Create multiple identical batches with the same quantity per batch
          </p>
          <div className="mt-2 text-sm">
            Total: <span className={`font-medium ${batchCount * quantityPerBatch !== orderQuantity ? 'text-amber-500' : 'text-green-500'}`}>
              {batchCount * quantityPerBatch}
            </span> / {orderQuantity}
            {batchCount * quantityPerBatch !== orderQuantity && (
              <span className="text-muted-foreground ml-1">
                {batchCount * quantityPerBatch < orderQuantity ? 
                  `(${orderQuantity - batchCount * quantityPerBatch} remaining)` : 
                  `(${batchCount * quantityPerBatch - orderQuantity} extra)`}
              </span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="batch-count">Number of Batches</Label>
            <Input
              id="batch-count"
              type="text" // Use text instead of number for more free-form entry
              inputMode="numeric" // Show numeric keyboard on mobile
              pattern="[0-9]*" // Only allow digits
              value={batchCount === 0 ? '' : batchCount.toString()}
              onChange={handleBatchCountChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quantity-per-batch">Quantity Per Batch</Label>
            <Input
              id="quantity-per-batch"
              type="text" // Use text instead of number for more free-form entry
              inputMode="numeric" // Show numeric keyboard on mobile
              pattern="[0-9]*" // Only allow digits
              value={quantityPerBatch === 0 ? '' : quantityPerBatch.toString()}
              onChange={handleQuantityPerBatchChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="delivery-date">Delivery Date</Label>
            <Input
              id="delivery-date"
              type="date"
              value={deliveryDate}
              onChange={handleDeliveryDateChange}
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            onClick={handleCreateBatches}
            className="gap-2"
          >
            <Wand2 className="h-4 w-4" />
            Create Batches
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
