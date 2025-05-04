
import { 
  Card, 
  CardContent,
  CardHeader 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { MaterialSelector } from "@/components/inventory/material-selector/MaterialSelector";
import { useState } from "react";

// Export this interface for external use
export interface CustomComponent {
  id: string;
  type: string;
  customName?: string;
  color?: string;
  gsm?: string;
  length?: string;
  width?: string;
  roll_width?: string;
  material_id?: string;
  details?: string; // Add details property to match ComponentData
}

interface CustomComponentSectionProps {
  customComponents: CustomComponent[];
  componentOptions: {
    color: string[];
    gsm: string[];
  };
  handleCustomComponentChange: (index: number, field: string, value: string) => void;
  removeCustomComponent: (index: number) => void;
  defaultQuantity?: string;
}

export const CustomComponentSection = ({
  customComponents,
  componentOptions,
  handleCustomComponentChange,
  removeCustomComponent,
  defaultQuantity
}: CustomComponentSectionProps) => {
  return (
    <div className="space-y-4">
      {customComponents.length === 0 ? (
        <div className="text-center p-6 border border-dashed rounded-lg">
          <p className="text-muted-foreground">No custom components added yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {customComponents.map((component, index) => (
            <CustomComponentForm
              key={`custom-${index}`}
              component={component}
              index={index}
              componentOptions={componentOptions}
              handleCustomComponentChange={handleCustomComponentChange}
              removeCustomComponent={removeCustomComponent}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface CustomComponentFormProps {
  component: {
    customName?: string;
    color?: string;
    gsm?: string;
    length?: string;
    width?: string;
    roll_width?: string;
    material_id?: string;
    details?: string; // Add details property here too
  };
  index: number;
  componentOptions: {
    color: string[];
    gsm: string[];
  };
  handleCustomComponentChange: (index: number, field: string, value: string) => void;
  removeCustomComponent: (index: number) => void;
}

const CustomComponentForm = ({
  component,
  index,
  componentOptions,
  handleCustomComponentChange,
  removeCustomComponent
}: CustomComponentFormProps) => {
  const [customColor, setCustomColor] = useState(component.color === "Custom" ? "" : "");
  const [customGSM, setCustomGSM] = useState(component.gsm === "Custom" ? "" : "");
  
  const handleColorChange = (value: string) => {
    handleCustomComponentChange(index, 'color', value);
    if (value !== "Custom") {
      setCustomColor("");
    }
  };
  
  const handleGSMChange = (value: string) => {
    handleCustomComponentChange(index, 'gsm', value);
    if (value !== "Custom") {
      setCustomGSM("");
    }
  };
  
  const handleCustomColorChange = (value: string) => {
    setCustomColor(value);
    handleCustomComponentChange(index, 'color', value);
  };
  
  const handleCustomGSMChange = (value: string) => {
    setCustomGSM(value);
    handleCustomComponentChange(index, 'gsm', value);
  };
  
  const handleMaterialSelect = (materialId: string | null) => {
    handleCustomComponentChange(index, 'material_id', materialId || '');
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <Label className="text-sm font-medium">Custom Component {index + 1}</Label>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => removeCustomComponent(index)}
        >
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-4">
          <div>
            <Label htmlFor={`custom-${index}-name`}>Component Name</Label>
            <Input
              id={`custom-${index}-name`}
              placeholder="Enter component name"
              value={component.customName || ""}
              onChange={(e) => handleCustomComponentChange(index, 'customName', e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`custom-${index}-color`}>Color</Label>
              <Select 
                value={component.color || "none"} 
                onValueChange={handleColorChange}
              >
                <SelectTrigger id={`custom-${index}-color`}>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {componentOptions.color.map(color => (
                    <SelectItem key={`custom-${index}-${color}`} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {component.color === "Custom" && (
                <Input
                  className="mt-2"
                  placeholder="Enter custom color"
                  value={customColor}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                />
              )}
            </div>
            
            <div>
              <Label htmlFor={`custom-${index}-gsm`}>GSM</Label>
              <Select 
                value={component.gsm || "none"} 
                onValueChange={handleGSMChange}
              >
                <SelectTrigger id={`custom-${index}-gsm`}>
                  <SelectValue placeholder="Select GSM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {componentOptions.gsm.map(gsm => (
                    <SelectItem key={`custom-${index}-${gsm}`} value={gsm}>
                      {gsm}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {component.gsm === "Custom" && (
                <Input
                  className="mt-2"
                  placeholder="Enter custom GSM"
                  value={customGSM}
                  onChange={(e) => handleCustomGSMChange(e.target.value)}
                />
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor={`custom-${index}-length`}>Length (inches)</Label>
              <Input
                id={`custom-${index}-length`}
                type="number"
                step="0.01"
                min="0"
                placeholder="Length"
                value={component.length || ""}
                onChange={(e) => handleCustomComponentChange(index, 'length', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`custom-${index}-width`}>Width (inches)</Label>
              <Input
                id={`custom-${index}-width`}
                type="number"
                step="0.01"
                min="0"
                placeholder="Width"
                value={component.width || ""}
                onChange={(e) => handleCustomComponentChange(index, 'width', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`custom-${index}-roll-width`}>Roll Width (inches)</Label>
              <Input
                id={`custom-${index}-roll-width`}
                type="number"
                step="0.01"
                min="0"
                placeholder="Roll width"
                value={component.roll_width || ""}
                onChange={(e) => handleCustomComponentChange(index, 'roll_width', e.target.value)}
              />
            </div>
          </div>
          
          {/* Add Material Selector */}
          <MaterialSelector 
            onMaterialSelect={handleMaterialSelect}
            selectedMaterialId={component.material_id || null}
            componentType={component.customName || `Custom Component ${index + 1}`}
          />
        </div>
      </CardContent>
    </Card>
  );
};
