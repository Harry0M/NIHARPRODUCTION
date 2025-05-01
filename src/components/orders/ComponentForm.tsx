
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
  roll_width?: string;
  consumption?: string;
  material_id?: string;
}

interface StockItem {
  id: string;
  material_type: string;
  gsm: string;
  color: string;
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
  defaultQuantity?: string;
}

export const ComponentForm = ({ 
  component, 
  index, 
  isCustom = false, 
  componentOptions,
  title,
  handleChange,
  onChange,
  defaultQuantity
}: ComponentFormProps) => {
  // State to track if user wants to enter custom GSM
  const [isCustomGsm, setIsCustomGsm] = useState(false);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);

  const onFieldChange = (field: string, value: string) => {
    if (onChange) {
      onChange(field, value);
    } else {
      handleChange(index, field, value);
    }
  };

  useEffect(() => {
    const fetchStockItems = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('inventory')
          .select('id, material_type, gsm, color')
          .order('material_type');
        
        if (error) throw error;
        setStockItems(data || []);
      } catch (err) {
        console.error('Error fetching stock items:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStockItems();
  }, []);

  // Calculate consumption when length, width, roll width or quantity changes
  useEffect(() => {
    if (component.length && component.width && component.roll_width && defaultQuantity) {
      try {
        const length = parseFloat(component.length);
        const width = parseFloat(component.width);
        const rollWidth = parseFloat(component.roll_width);
        const quantity = parseFloat(defaultQuantity);
        
        if (length > 0 && width > 0 && rollWidth > 0 && quantity > 0) {
          // Formula: ([(length*width)/(roll width*39.39)]*quantity)
          const consumption = ((length * width) / (rollWidth * 39.39)) * quantity;
          const roundedConsumption = Math.round(consumption * 100) / 100;
          onFieldChange('consumption', roundedConsumption.toString());
        }
      } catch (error) {
        console.error('Error calculating consumption:', error);
      }
    }
  }, [component.length, component.width, component.roll_width, defaultQuantity]);

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

        {/* Material Selection (replaces GSM) */}
        <div className="space-y-2">
          <Label>Material</Label>
          <Select 
            value={component.material_id || "not_applicable"} 
            onValueChange={(value) => {
              onFieldChange('material_id', value);
              if (value !== "not_applicable") {
                const selectedStock = stockItems.find(item => item.id === value);
                if (selectedStock) {
                  onFieldChange('gsm', selectedStock.gsm || '');
                }
              }
            }}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select Material" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_applicable">Not Applicable</SelectItem>
              {loading ? (
                <SelectItem disabled value="loading">Loading...</SelectItem>
              ) : (
                stockItems.map(item => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.material_type} - {item.gsm}GSM {item.color ? `(${item.color})` : ''}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Roll Width Field - Not added to Chain and Runner */}
        {component.type !== 'chain' && component.type !== 'runner' && (
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
        )}

        {/* Consumption Field - Not added to Chain and Runner */}
        {component.type !== 'chain' && component.type !== 'runner' && (
          <div className="space-y-2">
            <Label>Consumption</Label>
            <Input
              type="text"
              placeholder="Auto calculated"
              value={component.consumption || ''}
              readOnly
              className="bg-gray-50"
            />
            <p className="text-xs text-muted-foreground">
              Calculated using formula: (length×width)÷(roll width×39.39)×quantity
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
