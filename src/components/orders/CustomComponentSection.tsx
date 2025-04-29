
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { ComponentForm } from "./component-form";
import { ComponentData, CustomComponent } from "@/types/order";

export interface CustomComponentSectionProps {
  // Standard props approach
  components?: CustomComponent[];
  onChange?: (index: number, field: string, value: string) => void;
  onRemove?: (index: number) => void;
  
  // Alternative props for OrderEdit.tsx compatibility
  customComponents?: (CustomComponent | ComponentData)[];
  componentOptions?: { color: string[]; gsm: string[] };
  handleCustomComponentChange?: (index: number, field: string, value: string) => void;
  removeCustomComponent?: (index: number) => void;
  addCustomComponent?: () => void;
}

// Use export type when re-exporting with isolatedModules enabled
export type { CustomComponent };

export const CustomComponentSection = ({
  // Use either provided props pattern
  components,
  onChange,
  onRemove,
  
  // Support for OrderEdit.tsx props
  customComponents,
  componentOptions: propComponentOptions,
  handleCustomComponentChange,
  removeCustomComponent
}: CustomComponentSectionProps) => {
  // Use the provided components or fallback to customComponents for compatibility
  const itemsToRender = components || customComponents || [];
  
  // Default component options if not provided
  const componentOptions = propComponentOptions || {
    color: ["White", "Black", "Red", "Blue", "Green", "Yellow"],
    gsm: ["80", "100", "120", "150", "180", "200", "250"]
  };
  
  // Use the provided handlers or fallbacks for compatibility
  const handleChange = onChange || handleCustomComponentChange;
  const handleRemove = onRemove || removeCustomComponent;

  return (
    <>
      {itemsToRender.map((component, index) => (
        <div key={`custom-${component.id || index}`} className="p-4 border rounded-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Custom Component</h3>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={() => handleRemove && handleRemove(index)}
            >
              <Trash size={16} className="text-destructive" />
            </Button>
          </div>
          <ComponentForm
            component={{
              ...component,
              width: component.width || "",
              length: component.length || "",
              color: component.color || "",
              gsm: component.gsm || "",
              name: component.customName || (component as any).details
            }}
            index={index}
            isCustom={true}
            componentOptions={componentOptions}
            handleChange={handleChange as any}
          />
        </div>
      ))}
      
      {itemsToRender.length === 0 && (
        <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground">
          No custom components added yet
        </div>
      )}
    </>
  );
};
