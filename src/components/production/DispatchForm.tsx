
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { StageStatus } from "./StageStatus";
import { Truck, Package, Calendar, User, Clipboard, CheckCircle } from "lucide-react";

interface ProductionStage {
  name: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  completedDate?: string;
}

interface DispatchFormProps {
  jobCardId: string;
  orderNumber: string;
  companyName: string;
  quantity: number;
  stages: ProductionStage[];
  onDispatchSubmit: (data: {
    delivery_date: string;
    tracking_number: string;
    recipient_name: string;
    delivery_address: string;
    notes: string;
    confirm_quality_check: boolean;
    confirm_quantity_check: boolean;
  }) => Promise<void>;
}

export const DispatchForm = ({
  jobCardId,
  orderNumber,
  companyName,
  quantity,
  stages,
  onDispatchSubmit
}: DispatchFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    delivery_date: "",
    tracking_number: "",
    recipient_name: "",
    delivery_address: "",
    notes: "",
    confirm_quality_check: false,
    confirm_quantity_check: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.delivery_date || !formData.recipient_name || !formData.delivery_address) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (!formData.confirm_quality_check || !formData.confirm_quantity_check) {
      alert('Please confirm both quality and quantity checks');
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
      await onDispatchSubmit(formData);
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
        <CardContent className="space-y-6">
          {/* Order production stages status */}
          <div className="p-4 bg-muted/50 rounded-md">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Clipboard className="h-4 w-4" />
              Production Status
            </h3>
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

          {/* Dispatch form fields */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_date" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Delivery Date
              </Label>
              <Input
                id="delivery_date"
                name="delivery_date"
                type="date"
                value={formData.delivery_date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tracking_number" className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                Tracking Number (optional)
              </Label>
              <Input
                id="tracking_number"
                name="tracking_number"
                value={formData.tracking_number}
                onChange={handleChange}
                placeholder="Enter tracking number if available"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipient_name" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              Recipient Name
            </Label>
            <Input
              id="recipient_name"
              name="recipient_name"
              value={formData.recipient_name}
              onChange={handleChange}
              placeholder="Enter recipient name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_address">Delivery Address</Label>
            <Textarea
              id="delivery_address"
              name="delivery_address"
              value={formData.delivery_address}
              onChange={handleChange}
              placeholder="Enter complete delivery address"
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any additional dispatch notes"
              rows={2}
            />
          </div>

          {/* Confirmation checkboxes */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-md">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Quality Control
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="confirm_quality_check" 
                  checked={formData.confirm_quality_check}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('confirm_quality_check', checked === true)
                  } 
                />
                <Label htmlFor="confirm_quality_check" className="text-sm">
                  I confirm that quality check has been performed on all {quantity} bags
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="confirm_quantity_check" 
                  checked={formData.confirm_quantity_check}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('confirm_quantity_check', checked === true)
                  } 
                />
                <Label htmlFor="confirm_quantity_check" className="text-sm">
                  I confirm that the quantity matches the order specification ({quantity} bags)
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Complete Dispatch"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};
