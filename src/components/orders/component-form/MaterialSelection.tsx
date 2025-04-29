
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MaterialSelectionProps } from "./types";

export const MaterialSelection = ({ 
  component, 
  onFieldChange,
  componentOptions 
}: MaterialSelectionProps) => {
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

  // Get selected material details
  const selectedMaterial = materials?.find(m => m.id === component.material_id);
  
  return (
    <>
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
    </>
  );
};
