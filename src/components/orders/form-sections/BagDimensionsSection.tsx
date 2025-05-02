
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { OrderFormData } from "@/types/order";

interface BagDimensionsSectionProps {
  formData: OrderFormData;
  handleOrderChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  formErrors: {
    bag_length?: string;
    bag_width?: string;
  };
  readOnly?: boolean;
}

export const BagDimensionsSection = ({
  formData,
  handleOrderChange,
  formErrors,
  readOnly = false
}: BagDimensionsSectionProps) => {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="bag_length" className="flex items-center gap-1">
          Bag Length (inches)
          <span className="text-destructive">*</span>
        </Label>
        <Input 
          id="bag_length" 
          name="bag_length"
          type="number"
          step="0.01"
          value={formData.bag_length}
          onChange={handleOrderChange}
          placeholder="Length in inches"
          required
          className={formErrors.bag_length ? "border-destructive" : readOnly ? "bg-muted cursor-not-allowed" : ""}
          min="0"
          readOnly={readOnly}
        />
        {formErrors.bag_length && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {formErrors.bag_length}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="bag_width" className="flex items-center gap-1">
          Bag Width (inches)
          <span className="text-destructive">*</span>
        </Label>
        <Input 
          id="bag_width" 
          name="bag_width"
          type="number"
          step="0.01"
          value={formData.bag_width}
          onChange={handleOrderChange}
          placeholder="Width in inches"
          required
          className={formErrors.bag_width ? "border-destructive" : readOnly ? "bg-muted cursor-not-allowed" : ""}
          min="0"
          readOnly={readOnly}
        />
        {formErrors.bag_width && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {formErrors.bag_width}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="border_dimension">
          Border Dimension / Height (inches)
        </Label>
        <Input 
          id="border_dimension" 
          name="border_dimension"
          type="number"
          step="0.01"
          value={formData.border_dimension || ""}
          onChange={handleOrderChange}
          placeholder="Height in inches"
          min="0"
          readOnly={readOnly}
          className={readOnly ? "bg-muted cursor-not-allowed" : ""}
        />
      </div>
    </div>
  );
};
