
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComponentProps } from "./types";

interface CustomNameFieldProps {
  component: ComponentProps;
  onFieldChange: (field: string, value: string) => void;
}

export const CustomNameField = ({ component, onFieldChange }: CustomNameFieldProps) => {
  return (
    <div className="space-y-2">
      <Label>Component Name</Label>
      <Input
        placeholder="Enter component name"
        value={component.name || component.customName || ''}
        onChange={(e) => onFieldChange('customName', e.target.value)}
        required
      />
    </div>
  );
};
