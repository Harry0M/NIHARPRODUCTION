
import { useState } from "react";
import { DispatchFormCard } from "./dispatch/form/DispatchFormCard";
import { BatchForm } from "./dispatch/form/BatchForm";
import { toast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MultipleBatchCreator } from "./dispatch/form/MultipleBatchCreator";
import type { DispatchFormData } from "./dispatch/form/types";

interface Props {
  jobCardId: string;
  orderNumber: string;
  companyName: string;
  companyAddress?: string;
  recipientName?: string;
  quantity: number;
  stages: {
    name: string;
    status: "pending" | "in_progress" | "completed" | "cancelled";
    completedDate?: string;
  }[];
  onDispatchSubmit: (data: DispatchFormData) => Promise<void>;
}

export function DispatchForm({
  jobCardId,
  orderNumber,
  companyName,
  companyAddress,
  recipientName,
  quantity,
  stages,
  onDispatchSubmit
}: Props) {
  const [formData, setFormData] = useState<DispatchFormData>({
    recipient_name: recipientName || '',
    tracking_number: "",
    delivery_address: companyAddress || '',
    notes: "",
    confirm_quality_check: false,
    confirm_quantity_check: false,
    batches: []
  });

  const [submitting, setSubmitting] = useState(false);

  const handleFormChange = (name: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddBatch = () => {
    const nextBatchNumber = formData.batches.length + 1;
    setFormData(prev => ({
      ...prev,
      batches: [...prev.batches, {
        quantity: 0,
        delivery_date: new Date().toISOString().split("T")[0],
        notes: ""
      }]
    }));
  };

  const handleBatchChange = (index: number, name: string, value: any) => {
    const updatedBatches = [...formData.batches];
    updatedBatches[index] = { ...updatedBatches[index], [name]: value };
    setFormData(prev => ({ ...prev, batches: updatedBatches }));
  };

  const handleRemoveBatch = (index: number) => {
    const updatedBatches = [...formData.batches];
    updatedBatches.splice(index, 1);
    setFormData(prev => ({ ...prev, batches: updatedBatches }));
  };

  const handleMultipleBatchCreate = (numBatches: number, totalQuantity: number, deliveryDate: string) => {
    if (numBatches <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid batch count",
        description: "Number of batches must be greater than 0"
      });
      return;
    }

    // Calculate base quantity per batch
    const baseQuantityPerBatch = Math.floor(totalQuantity / numBatches);
    // Calculate remainder to distribute
    const remainder = totalQuantity % numBatches;

    // Create the batches
    const newBatches = Array.from({ length: numBatches }, (_, i) => ({
      quantity: baseQuantityPerBatch + (i < remainder ? 1 : 0), // Distribute remainder
      delivery_date: deliveryDate,
      notes: ""
    }));

    setFormData(prev => ({
      ...prev,
      batches: [...prev.batches, ...newBatches]
    }));
    
    toast({
      title: "Batches created",
      description: `Created ${numBatches} batches with total quantity ${totalQuantity}`
    });
  };

  const validateForm = (): boolean => {
    // Basic validation checks
    if (!formData.recipient_name.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Recipient name is required"
      });
      return false;
    }

    if (!formData.delivery_address.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Delivery address is required"
      });
      return false;
    }

    if (formData.batches.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "At least one batch is required"
      });
      return false;
    }

    // Check that the total quantity matches the order quantity
    const totalBatchQuantity = formData.batches.reduce(
      (sum, batch) => sum + (Number(batch.quantity) || 0),
      0
    );

    if (totalBatchQuantity !== quantity) {
      toast({
        variant: "destructive",
        title: "Quantity Mismatch",
        description: `Total batch quantity (${totalBatchQuantity}) doesn't match order quantity (${quantity})`
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await onDispatchSubmit(formData);
      toast({
        title: "Success",
        description: "Dispatch created successfully"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create dispatch"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Check if production stages are complete
  const isProductionComplete = stages.every(stage => stage.status === "completed");

  return (
    <div className="space-y-6">
      {!isProductionComplete && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Production not complete</AlertTitle>
          <AlertDescription>
            Some production stages are still in progress. Are you sure you want to create a dispatch?
          </AlertDescription>
        </Alert>
      )}

      <DispatchFormCard
        formData={formData}
        onChange={handleFormChange}
      />

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Dispatch Batches</h3>
            <Button onClick={handleAddBatch} size="sm">
              Add Batch
            </Button>
          </div>
          
          <MultipleBatchCreator 
            orderQuantity={quantity}
            onCreateBatches={handleMultipleBatchCreate}
          />

          <div className="space-y-4 mt-4">
            {formData.batches.map((batch, index) => (
              <BatchForm
                key={index}
                batchIndex={index}
                batchNumber={index + 1}
                batch={batch}
                onChange={handleBatchChange}
                onRemove={handleRemoveBatch}
              />
            ))}
            {formData.batches.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                No batches added yet. Add a batch to continue.
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              onClick={handleSubmit} 
              disabled={submitting || formData.batches.length === 0}
            >
              {submitting ? "Creating..." : "Create Dispatch"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
