
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { ComponentFormProps } from "./types";
import { DimensionsFields } from "./DimensionsFields";
import { MaterialSelection } from "./MaterialSelection";
import { ConsumptionFields } from "./ConsumptionFields";
import { CustomNameField } from "./CustomNameField";

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
        {isCustom && <CustomNameField component={component} onFieldChange={onFieldChange} />}
        
        <DimensionsFields component={component} onFieldChange={onFieldChange} />
        
        <MaterialSelection 
          component={component} 
          onFieldChange={onFieldChange} 
          componentOptions={componentOptions}
        />
        
        {showConsumptionFields && (
          <ConsumptionFields 
            component={component} 
            onFieldChange={onFieldChange} 
            selectedMaterial={selectedMaterial} 
          />
        )}
      </div>
    </div>
  );
};
