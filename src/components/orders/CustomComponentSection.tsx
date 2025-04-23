
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { CustomComponent } from "@/pages/Orders/OrderNew";
import { ComponentForm } from "./ComponentForm";

interface CustomComponentSectionProps {
  components: CustomComponent[];
  onChange: (index: number, field: string, value: string) => void;
  onRemove: (index: number) => void;
}

export const CustomComponentSection = ({
  components,
  onChange,
  onRemove
}: CustomComponentSectionProps) => {
  const componentOptions = {
    color: ["White", "Black", "Red", "Blue", "Green", "Yellow"],
    gsm: ["80", "100", "120", "150", "180", "200", "250"]
  };

  return (
    <>
      {components.map((component, index) => (
        <div key={`custom-${index}`} className="p-4 border rounded-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Custom Component</h3>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={() => onRemove(index)}
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
              name: component.customName
            }}
            index={index}
            isCustom={true}
            componentOptions={componentOptions}
            handleChange={onChange}
          />
        </div>
      ))}
      
      {components.length === 0 && (
        <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground">
          No custom components added yet
        </div>
      )}
    </>
  );
};
