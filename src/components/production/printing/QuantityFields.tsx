
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface QuantityFieldsProps {
  pulling: string;
  receivedQuantity: string;
  totalCuttingQuantity: number;
  remainingQuantity: number;
  currentPullingQuantity: number;
  onPullingChange: (value: string) => void;
  onReceivedQuantityChange: (value: string) => void;
}

export const QuantityFields = ({
  pulling,
  receivedQuantity,
  totalCuttingQuantity,
  remainingQuantity,
  currentPullingQuantity,
  onPullingChange,
  onReceivedQuantityChange
}: QuantityFieldsProps) => {
  const [localRemainingQuantity, setLocalRemainingQuantity] = useState(remainingQuantity);

  // Update available quantity as the user types
  useEffect(() => {
    setLocalRemainingQuantity(remainingQuantity + currentPullingQuantity - (Number(pulling) || 0));
  }, [pulling, remainingQuantity, currentPullingQuantity]);

  return (
    <div className="space-y-4">
      {totalCuttingQuantity > 0 && (
        <Card className="bg-primary/5 border-primary">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-primary">Total Cutting Quantity</h3>
                <p className="text-sm text-muted-foreground">Combined received quantity from cutting jobs</p>
              </div>
              <div className="text-2xl font-bold text-primary">{totalCuttingQuantity}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {totalCuttingQuantity > 0 && (
        <Card className={`${localRemainingQuantity >= 0 ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className={`text-lg font-semibold ${localRemainingQuantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {localRemainingQuantity >= 0 ? 'Available Quantity' : 'Quantity Exceeded'}
                </h3>
                <p className="text-sm text-muted-foreground">Remaining quantity available for allocation</p>
              </div>
              <div className={`text-2xl font-bold ${localRemainingQuantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {localRemainingQuantity}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {Number(pulling) > 0 && localRemainingQuantity < 0 && (
        <Alert variant="destructive">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            You're allocating more quantity than what's available from cutting jobs.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pulling">Pulling Quantity</Label>
          <Input
            id="pulling"
            type="number"
            value={pulling}
            onChange={(e) => onPullingChange(e.target.value)}
            className={localRemainingQuantity < 0 ? "border-red-500" : ""}
            placeholder="Enter pulling quantity"
          />
          <p className="text-sm text-muted-foreground">
            Quantity allocated to this printing job from the cutting jobs
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="received_quantity" className="text-red-600 font-medium">Received Quantity</Label>
          <Input
            id="received_quantity"
            type="number"
            value={receivedQuantity}
            onChange={(e) => onReceivedQuantityChange(e.target.value)}
            placeholder="Enter received quantity"
            className="border-red-500 focus:border-red-600 focus:ring-red-500"
          />
          <p className="text-sm text-muted-foreground">
            Final quantity produced from this printing job
          </p>
        </div>
      </div>
    </div>
  );
};
