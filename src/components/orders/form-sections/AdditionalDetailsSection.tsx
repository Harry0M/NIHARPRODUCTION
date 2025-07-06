
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OrderFormData } from "@/types/order";

interface AdditionalDetailsSectionProps {
  formData: OrderFormData;
  handleOrderChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  readOnly?: boolean;
}

export const AdditionalDetailsSection = ({
  formData,
  handleOrderChange,
  readOnly = false
}: AdditionalDetailsSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="rate_per_unit">Rate per Unit (optional)</Label>
        <Input 
          id="rate_per_unit" 
          name="rate_per_unit"
          type="number"
          step="0.01"
          value={formData.rate_per_unit || ''}
          onChange={handleOrderChange}
          placeholder="Enter cost per piece for cost calculation"
          readOnly={readOnly}
        />
        <p className="text-xs text-muted-foreground">
          This will be used as the initial selling price per piece in cost calculations
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="wastage_percentage">Wastage Percentage (%)</Label>
        <Input 
          id="wastage_percentage" 
          name="wastage_percentage"
          type="number"
          step="0.1"
          min="0"
          max="100"
          value={formData.wastage_percentage || '5'}
          onChange={handleOrderChange}
          placeholder="Enter wastage percentage (default: 5%)"
          readOnly={readOnly}
        />
        <p className="text-xs text-muted-foreground">
          Wastage cost will be calculated as a percentage of material cost and added to total cost
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="delivery_date">Delivery Date (optional)</Label>
        <Input 
          id="delivery_date" 
          name="delivery_date"
          type="date"
          value={formData.delivery_date || ''}
          onChange={handleOrderChange}
          readOnly={readOnly}
        />
        <p className="text-xs text-muted-foreground">
          Expected date when this order should be delivered
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="special_instructions">Special Instructions (optional)</Label>
        <Textarea 
          id="special_instructions" 
          name="special_instructions"
          value={formData.special_instructions}
          onChange={handleOrderChange}
          placeholder="Any additional notes or requirements"
          rows={3}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
};
