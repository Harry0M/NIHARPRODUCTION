
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export interface ComponentProps {
  id?: string;
  type: string;
  width?: string;
  length?: string;
  color?: string;
  gsm?: string;
  name?: string;
  customName?: string;
  details?: string;
}

interface ComponentFormProps {
  component: ComponentProps;
  index: number;
  isCustom?: boolean;
  componentOptions: {
    color: string[];
    gsm: string[];
  };
  title?: string;
  handleChange: (index: number, field: string, value: string) => void;
  onChange?: (field: string, value: string) => void;
}

export const ComponentForm = ({ 
  component, 
  index, 
  isCustom = false, 
  componentOptions,
  title,
  handleChange,
  onChange
}: ComponentFormProps) => {
  // State to track if user wants to enter custom GSM
  const [isCustomGsm, setIsCustomGsm] = useState(false);

  const onFieldChange = (field: string, value: string) => {
    if (onChange) {
      onChange(field, value);
    } else {
      handleChange(index, field, value);
    }
  };

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      {title && !isCustom && (
        <h3 className="font-medium mb-4">{title}</h3>
      )}
      <div className="grid md:grid-cols-4 gap-4">
        {isCustom && (
          <div className="space-y-2">
            <Label>Component Name</Label>
            <Input
              placeholder="Enter component name"
              value={component.name || component.customName || ''}
              onChange={(e) => onFieldChange('customName', e.target.value)}
              required={isCustom}
            />
          </div>
        )}
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
        <div className="space-y-2">
          <Label>Color</Label>
          <Select 
            value={component.color || "not_applicable"} 
            onValueChange={(value) => onFieldChange('color', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_applicable">Not Applicable</SelectItem>
              {componentOptions.color.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>GSM</Label>
          {isCustomGsm ? (
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Enter GSM value"
                value={component.gsm || ''}
                onChange={(e) => onFieldChange('gsm', e.target.value)}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => setIsCustomGsm(false)}
                className="px-3 py-2 text-xs border rounded hover:bg-secondary"
              >
                Use List
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Select 
                value={component.gsm || "not_applicable"} 
                onValueChange={(value) => onFieldChange('gsm', value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select GSM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_applicable">Not Applicable</SelectItem>
                  {componentOptions.gsm.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() => setIsCustomGsm(true)}
                className="px-3 py-2 text-xs border rounded hover:bg-secondary"
              >
                Custom
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
