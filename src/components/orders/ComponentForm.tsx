
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
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
  custom_name?: string;
  details?: string;
  material_id?: string;
  roll_width?: string;
  consumption?: string;
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
  handleChange?: (index: number, field: string, value: string) => void;
  onChange?: (field: string, value: string) => void;
  onRemove?: () => void;
}

export const ComponentForm = ({ 
  component, 
  index, 
  isCustom = false, 
  componentOptions,
  title,
  handleChange,
  onChange,
  onRemove
}: ComponentFormProps) => {
  // State to track if user wants to enter custom GSM
  const [isCustomGsm, setIsCustomGsm] = useState(false);
  
  // Fetch materials from inventory
  const { data: materials } = useQuery({
    queryKey: ['inventory-materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('id, material_type, color, gsm')
        .order('material_type');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate consumption whenever length, width, or roll_width changes
  useEffect(() => {
    if (component.length && component.width && component.roll_width && 
        component.length !== '' && component.width !== '' && component.roll_width !== '') {
      const length = parseFloat(component.length);
      const width = parseFloat(component.width);
      const rollWidth = parseFloat(component.roll_width);
      
      if (!isNaN(length) && !isNaN(width) && !isNaN(rollWidth) && rollWidth > 0) {
        const consumption = ((length * width) / (rollWidth * 39.39)).toFixed(2);
        onFieldChange('consumption', consumption);
      }
    }
  }, [component.length, component.width, component.roll_width]);

  const onFieldChange = (field: string, value: string) => {
    if (onChange) {
      onChange(field, value);
    } else if (handleChange) {
      handleChange(index, field, value);
    }
  };

  // Don't show roll width and consumption for chain and runner
  const showRollWidthAndConsumption = 
    component.type !== 'chain' && component.type !== 'runner';

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between">
        {title && (
          <h3 className="font-medium mb-4">{title}</h3>
        )}
        {isCustom && onRemove && (
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={onRemove}
          >
            <Trash size={16} className="text-destructive" />
          </Button>
        )}
      </div>
      
      <div className="grid md:grid-cols-4 gap-4">
        {isCustom && (
          <div className="space-y-2">
            <Label>Component Name</Label>
            <Input
              placeholder="Enter component name"
              value={component.name || component.custom_name || component.customName || ''}
              onChange={(e) => onFieldChange(isCustom ? 'custom_name' : 'name', e.target.value)}
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
        <div className="space-y-2">
          <Label>Material</Label>
          <Select 
            value={component.material_id || undefined} 
            onValueChange={(value) => onFieldChange('material_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="not_applicable">Not Applicable</SelectItem>
              {materials?.map(material => (
                <SelectItem key={material.id} value={material.id}>
                  {material.material_type} {material.color ? `(${material.color})` : ''} {material.gsm ? `${material.gsm} GSM` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showRollWidthAndConsumption && (
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
                step="0.01"
                placeholder="Material consumption"
                value={component.consumption || ''}
                readOnly
                className="bg-gray-50"
              />
              <p className="text-xs text-muted-foreground">
                Auto-calculated based on dimensions
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
