
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";

interface QualityControlsProps {
  quantity: number;
  qualityChecked: boolean;
  quantityChecked: boolean;
  onQualityChange: (checked: boolean) => void;
  onQuantityChange: (checked: boolean) => void;
}

export const QualityControls = ({
  quantity,
  qualityChecked,
  quantityChecked,
  onQualityChange,
  onQuantityChange,
}: QualityControlsProps) => {
  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-md">
      <h3 className="font-medium mb-3 flex items-center gap-2">
        <CheckCircle className="h-4 w-4" />
        Quality Control
      </h3>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="confirm_quality_check" 
            checked={qualityChecked}
            onCheckedChange={(checked) => onQualityChange(checked === true)}
          />
          <Label htmlFor="confirm_quality_check" className="text-sm">
            I confirm that quality check has been performed on all {quantity} bags
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="confirm_quantity_check" 
            checked={quantityChecked}
            onCheckedChange={(checked) => onQuantityChange(checked === true)}
          />
          <Label htmlFor="confirm_quantity_check" className="text-sm">
            I confirm that the quantity matches the order specification ({quantity} bags)
          </Label>
        </div>
      </div>
    </div>
  );
};
