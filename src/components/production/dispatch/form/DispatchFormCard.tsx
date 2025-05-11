import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Truck } from "lucide-react";
import { StageStatus } from "../../StageStatus";
import type { BatchData, DispatchFormData, DispatchFormProps } from "./types";
import { BatchForm } from "./BatchForm";
import { RecipientForm } from "./RecipientForm";
import { QualityControls } from "./QualityControls";
import { MultipleBatchCreator } from "./MultipleBatchCreator";

export const DispatchFormCard = ({
  orderNumber,
  companyName,
  quantity,
  stages,
  onDispatchSubmit,
}: DispatchFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<DispatchFormData, 'batches'>>({
    recipient_name: "",
    tracking_number: "",
    delivery_address: "",
    notes: "",
    confirm_quality_check: false,
    confirm_quantity_check: false,
  });

  // Initialize with an empty batch instead of pre-filling the quantity
  const [batches, setBatches] = useState<BatchData[]>([
    { quantity: 0, delivery_date: "", notes: "" }
  ]);

  const handleFieldChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBatchChange = (index: number, field: keyof BatchData, value: string | number) => {
    const newBatches = [...batches];
    newBatches[index] = { ...newBatches[index], [field]: value };
    setBatches(newBatches);
  };

  const addBatch = () => {
    setBatches([...batches, { quantity: 0, delivery_date: "", notes: "" }]);
  };
  
  // Create multiple batches at once
  const createMultipleBatches = (newBatches: BatchData[]) => {
    // If there's only one batch with quantity 0, replace it
    if (batches.length === 1 && batches[0].quantity === 0) {
      setBatches(newBatches);
    } else {
      // Otherwise, add new batches to existing ones
      setBatches([...batches, ...newBatches]);
    }
  };

  const removeBatch = (index: number) => {
    const newBatches = batches.filter((_, i) => i !== index);
    setBatches(newBatches);
  };

  const getTotalBatchQuantity = () => {
    return batches.reduce((sum, batch) => sum + Number(batch.quantity), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.delivery_address || !formData.recipient_name) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (!formData.confirm_quality_check || !formData.confirm_quantity_check) {
      alert('Please confirm both quality and quantity checks');
      return;
    }

    // Validate batches
    const totalBatchQuantity = getTotalBatchQuantity();
    if (totalBatchQuantity !== quantity) {
      alert(`Total batch quantity (${totalBatchQuantity}) must equal order quantity (${quantity})`);
      return;
    }

    const allBatchesHaveDate = batches.every(batch => batch.delivery_date);
    if (!allBatchesHaveDate) {
      alert('Please set delivery dates for all batches');
      return;
    }
    
    // Check if all stages are complete
    const allStagesComplete = stages.every(stage => stage.status === "completed");
    if (!allStagesComplete) {
      if (!confirm('Not all production stages are marked as complete. Are you sure you want to proceed with dispatch?')) {
        return;
      }
    }
    
    setLoading(true);
    
    try {
      await onDispatchSubmit({
        ...formData,
        batches
      });
    } catch (error) {
      console.error('Error dispatching order:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Dispatch Information
          </CardTitle>
          <CardDescription>
            Complete the dispatch information for order #{orderNumber} for {companyName}
          </CardDescription>
        </CardHeader>
        {/* Order production stages status */}
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted/50 rounded-md">
            <h3 className="font-medium mb-3">Production Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stages.map((stage, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span>{stage.name}</span>
                  <StageStatus 
                    status={stage.status} 
                    date={stage.completedDate} 
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Recipient Information */}
          <RecipientForm
            recipientName={formData.recipient_name}
            trackingNumber={formData.tracking_number}
            deliveryAddress={formData.delivery_address}
            notes={formData.notes}
            onFieldChange={handleFieldChange}
          />

          {/* Multiple Batch Creator */}
          <MultipleBatchCreator
            orderQuantity={quantity}
            createBatches={createMultipleBatches}
          />
          
          {/* Batch Management */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Dispatch Batches</h3>
                <p className="text-sm text-muted-foreground">
                  Remaining quantity: {quantity - getTotalBatchQuantity()}
                </p>
              </div>
              <Button 
                type="button" 
                onClick={addBatch}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Batch
              </Button>
            </div>

            <div className="space-y-4">
              {batches.map((batch, index) => (
                <BatchForm
                  key={index}
                  batch={batch}
                  index={index}
                  remainingQuantity={quantity - getTotalBatchQuantity() + Number(batch.quantity)}
                  canDelete={batches.length > 1}
                  onBatchChange={handleBatchChange}
                  onBatchDelete={removeBatch}
                />
              ))}
            </div>

            {getTotalBatchQuantity() !== quantity && (
              <Alert variant="destructive">
                <AlertDescription>
                  Total batch quantity ({getTotalBatchQuantity()}) must equal order quantity ({quantity})
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Quality Control */}
          <QualityControls
            quantity={quantity}
            qualityChecked={formData.confirm_quality_check}
            quantityChecked={formData.confirm_quantity_check}
            onQualityChange={(checked) => handleFieldChange('confirm_quality_check', checked)}
            onQuantityChange={(checked) => handleFieldChange('confirm_quantity_check', checked)}
          />
        </CardContent>

        <CardFooter className="flex justify-end space-x-2">
          <Button type="submit" disabled={loading || getTotalBatchQuantity() !== quantity}>
            {loading ? "Processing..." : "Complete Dispatch"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};
