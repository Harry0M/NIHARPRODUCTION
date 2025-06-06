import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Truck, Minus } from "lucide-react";
import { StageStatus } from "../../StageStatus";
import type { BatchData, DispatchFormData, DispatchFormProps } from "./types";
import { BatchForm } from "./BatchForm";
import { RecipientForm } from "./RecipientForm";
import { QualityControls } from "./QualityControls";
import { MultipleBatchCreator } from "./MultipleBatchCreator";
import { Input } from "@/components/ui/input";

export const DispatchFormCard = ({
  orderNumber,
  companyName,
  companyAddress,
  quantity,
  stages,
  onDispatchSubmit,
}: DispatchFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<DispatchFormData, 'batches'>>({
    recipient_name: companyName || "",
    tracking_number: "",
    delivery_address: companyAddress || "",
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
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  onClick={() => setBatches([{ quantity: 0, delivery_date: "", notes: "" }])}
                  variant="outline"
                  size="sm"
                >
                  Clear All
                </Button>
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
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="max-h-[400px] overflow-y-auto relative">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-muted/50 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium border-b">Batch</th>
                        <th className="px-4 py-3 text-left text-sm font-medium border-b">Quantity</th>
                        <th className="px-4 py-3 text-left text-sm font-medium border-b">Delivery Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium border-b">Notes</th>
                        <th className="px-4 py-3 text-right text-sm font-medium border-b">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {batches.map((batch, index) => (
                        <tr key={index} className="hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm whitespace-nowrap">Batch {index + 1}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Input
                              type="number"
                              value={batch.quantity}
                              onChange={(e) => handleBatchChange(index, 'quantity', Number(e.target.value))}
                              min="1"
                              max={quantity - getTotalBatchQuantity() + Number(batch.quantity)}
                              className="w-24"
                              required
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Input
                              type="date"
                              value={batch.delivery_date}
                              onChange={(e) => handleBatchChange(index, 'delivery_date', e.target.value)}
                              className="w-40"
                              required
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              value={batch.notes}
                              onChange={(e) => handleBatchChange(index, 'notes', e.target.value)}
                              placeholder="Add notes"
                              className="w-48"
                            />
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {batches.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeBatch(index)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

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
