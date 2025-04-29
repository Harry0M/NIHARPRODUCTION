
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DimensionsFieldsProps } from "./types";

export const DimensionsFields = ({ component, onFieldChange }: DimensionsFieldsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label>Length (inches)</Label>
        <Input
          type="number"
          step="0.01"
          placeholder="Length in inches"
          value={component.length || ''}
          onChange={(e) => onFieldChange('length', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Width (inches)</Label>
        <Input
          type="number"
          step="0.01"
          placeholder="Width in inches"
          value={component.width || ''}
          onChange={(e) => onFieldChange('width', e.target.value)}
        />
      </div>
    </>
  );
};
