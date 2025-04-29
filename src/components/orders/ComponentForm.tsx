
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  material_id?: string;
  roll_width?: string;
  consumption?: number;
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
  disableConsumptionFields?: boolean;
}

export const ComponentForm = ({ 
  component, 
  index, 
  isCustom = false, 
  componentOptions,
  title,
  handleChange,
  onChange,
  disableConsumptionFields = false
}: ComponentFormProps) => {
  // State to track if user wants to enter custom GSM
  const [isCustomGsm, setIsCustomGsm] = useState(false);
  
  // Get inventory materials for material selection
  const { data: materials } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('id, material_type, gsm, color, unit');
      
      if (error) throw error;
      return data;
    },
  });
  
  // Calculate consumption whenever dimensions or roll width change
  useEffect(() => {
    // Skip for chain and runner components
    if (disableConsumptionFields || component.type === 'chain' || component.type === 'runner') {
      return;
    }
    
    const length = parseFloat(component.length || '0');
    const width = parseFloat(component.width || '0');
    const roll_width = parseFloat(component.roll_width || '0');
    
    if (length && width && roll_width) {
      const consumption = ((length * width) / (roll_width * 39.39));
      
      if (onChange) {
        onChange('consumption', consumption.toFixed(4));
      } else {
        handleChange(index, 'consumption', consumption.toFixed(4));
      }
    }
  }, [component.length, component.width, component.roll_width, component.type, index]);

  const onFieldChange = (field: string, value: string) => {
    if (onChange) {
      onChange(field, value);
    } else {
      handleChange(index, field, value);
    }
  };

  // Get selected material details
  const selectedMaterial = materials?.find(m => m.id === component.material_id);
  
  // Show consumption calculation fields for all components except chain and runner
  const showConsumptionFields = !disableConsumptionFields && component.type !== 'chain' && component.type !== 'runner';
  
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
            value={component.color || undefined} 
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
        
        {/* Replace GSM dropdown with material selection */}
        <div className="space-y-2">
          <Label>Material</Label>
          <Select 
            value={component.material_id || undefined} 
            onValueChange={(value) => onFieldChange('material_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_applicable">Not Applicable</SelectItem>
              {materials?.map(material => (
                <SelectItem key={material.id} value={material.id}>
                  {material.material_type} 
                  {material.gsm ? ` - ${material.gsm} GSM` : ''}
                  {material.color ? ` - ${material.color}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedMaterial && (
            <p className="text-xs text-muted-foreground mt-1">
              Unit: {selectedMaterial.unit}
            </p>
          )}
        </div>
        
        {/* Add roll width field for all components except chain and runner */}
        {showConsumptionFields && (
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
        )}
      </div>
    </div>
  );
};
