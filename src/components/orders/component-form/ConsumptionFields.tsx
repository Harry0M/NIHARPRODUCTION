
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConsumptionFieldsProps } from "./types";

export const ConsumptionFields = ({ 
  component, 
  onFieldChange, 
  selectedMaterial 
}: ConsumptionFieldsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label>Roll Width (inches)</Label>
        <Input
          type="number"
          step="0.01"
          placeholder="Roll width in inches"
          value={component.roll_width || ''}
          onChange={(e) => onFieldChange('roll_width', e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label>Consumption</Label>
        <Input
          type="number"
          step="0.0001"
          placeholder="Calculated consumption"
          value={component.consumption?.toString() || ''}
          readOnly
          className="bg-gray-50"
        />
        {selectedMaterial && component.consumption && (
          <p className="text-xs text-muted-foreground mt-1">
            {component.consumption.toFixed(4)} {selectedMaterial.unit}
          </p>
        )}
      </div>
    </>
  );
};
