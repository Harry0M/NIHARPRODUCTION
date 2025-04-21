
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash } from "lucide-react";
import { ComponentForm } from "./ComponentForm";

interface CustomComponentSectionProps {
  customComponents: Array<{
    type: string;
    name?: string;
    width: string;
    length: string;
    color: string;
    gsm: string;
    details?: string;
  }>;
  componentOptions: {
    color: string[];
    gsm: string[];
  };
  handleCustomComponentChange: (index: number, field: string, value: string) => void;
  addCustomComponent: () => void;
  removeCustomComponent: (index: number) => void;
}

export const CustomComponentSection = ({
  customComponents,
  componentOptions,
  handleCustomComponentChange,
  addCustomComponent,
  removeCustomComponent
}: CustomComponentSectionProps) => {
  return (
    <>
      {customComponents.map((component, index) => (
        <div key={`custom-${index}`} className="p-4 border rounded-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Custom Component</h3>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={() => removeCustomComponent(index)}
            >
              <Trash size={16} className="text-destructive" />
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Details</Label>
            <Input 
              placeholder="Component description" 
              value={component.details || ''}
              onChange={(e) => handleCustomComponentChange(index, 'details', e.target.value)}
            />
          </div>
          <ComponentForm
            component={component}
            index={index}
            isCustom={true}
            componentOptions={componentOptions}
            handleChange={handleCustomComponentChange}
          />
        </div>
      ))}
      
      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center justify-center gap-1"
        onClick={addCustomComponent}
      >
        <Plus size={16} />
        Add Custom Component
      </Button>
    </>
  );
};
