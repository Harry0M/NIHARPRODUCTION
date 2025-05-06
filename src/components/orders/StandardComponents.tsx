
import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MaterialLinkSelector } from "../inventory/MaterialLinkSelector";

interface StandardComponentsProps {
  components: Record<string, any>;
  componentOptions: {
    color: string[];
    gsm?: string[]; // Make gsm optional
  };
  onChange: (type: string, field: string, value: string) => void;
  defaultQuantity?: string;
  showConsumption?: boolean; // Added prop for showing consumption in real-time
  inventoryItems?: any[]; // Added prop for inventory items
}

export const StandardComponents = ({
  components,
  componentOptions,
  onChange,
  defaultQuantity,
  showConsumption = false, // Default to false if not provided
  inventoryItems = [] // Default to empty array if not provided
}: StandardComponentsProps) => {
  // Define standard component types with proper capitalization as they appear in UI
  const standardComponents = [
    { type: "Part" },
    { type: "Border" },
    { type: "Chain" },
    { type: "Piping" },
    { type: "Runner" },
    { type: "Handle" },
  ];

  // Handle material selection
  const handleMaterialSelect = (componentType: string, materialId: string | null) => {
    onChange(componentType, 'material_id', materialId || '');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Standard Components</h2>
      
      <div className="grid md:grid-cols-2 gap-4">
        {standardComponents.map((component) => {
          // Get the actual component data if it exists
          const componentData = components[component.type] || { type: component.type };
          
          console.log(`Rendering ${component.type}, data:`, componentData);
          
          return (
            <ComponentForm
              key={component.type}
              component={componentData}
              componentOptions={componentOptions}
              onChange={onChange}
              defaultQuantity={defaultQuantity}
              onMaterialSelect={(materialId) => handleMaterialSelect(component.type, materialId)}
              showConsumption={showConsumption}
              inventoryItems={inventoryItems}
            />
          );
        })}
      </div>
    </div>
  );
};

interface ComponentFormProps {
  component: {
    type: string;
    color?: string;
    gsm?: string;
    length?: string;
    width?: string;
    roll_width?: string;
    material_id?: string;
    consumption?: string;
    baseConsumption?: string;
  };
  componentOptions: {
    color: string[];
    gsm?: string[]; // Make gsm optional
  };
  onChange: (type: string, field: string, value: string) => void;
  defaultQuantity?: string;
  onMaterialSelect: (materialId: string | null) => void;
  showConsumption?: boolean;
  inventoryItems?: any[];
}

const ComponentForm = ({ 
  component, 
  componentOptions, 
  onChange,
  defaultQuantity,
  onMaterialSelect,
  showConsumption = false,
  inventoryItems = []
}: ComponentFormProps) => {
  const [customColor, setCustomColor] = useState("");
  const [customGSM, setCustomGSM] = useState("");
  
  console.log("Component Form rendering for:", component.type, "with data:", component);
  
  const handleCustomColorChange = (value: string) => {
    setCustomColor(value);
    onChange(component.type, 'color', value);
  };
  
  const handleCustomGSMChange = (value: string) => {
    setCustomGSM(value);
    onChange(component.type, 'gsm', value);
  };
  
  const handleSelectChange = (field: string, value: string) => {
    if (value === "Custom") {
      if (field === "color") {
        setCustomColor("");
      } else if (field === "gsm") {
        setCustomGSM("");
      }
    }
    onChange(component.type, field, value);
  };
  
  // Get consumption - it should be already calculated from the parent component
  const consumption = component.consumption || '';
  const baseConsumption = component.baseConsumption || '';
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{component.type}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`${component.type}-color`}>Color</Label>
              <Select 
                value={component.color || "none"} 
                onValueChange={(value) => handleSelectChange('color', value)}
              >
                <SelectTrigger id={`${component.type}-color`}>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {componentOptions.color.map(color => (
                    <SelectItem key={`${component.type}-${color}`} value={color}>
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
            
            {/* Only render GSM field if gsm options are provided */}
            {componentOptions.gsm && (
              <div>
                <Label htmlFor={`${component.type}-gsm`}>GSM</Label>
                <Select 
                  value={component.gsm || "none"} 
                  onValueChange={(value) => handleSelectChange('gsm', value)}
                >
                  <SelectTrigger id={`${component.type}-gsm`}>
                    <SelectValue placeholder="Select GSM" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {componentOptions.gsm.map(gsm => (
                      <SelectItem key={`${component.type}-${gsm}`} value={gsm}>
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
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor={`${component.type}-length`}>Length (inches)</Label>
              <Input
                id={`${component.type}-length`}
                type="number"
                step="0.01"
                min="0"
                placeholder="Length"
                value={component.length || ""}
                onChange={(e) => onChange(component.type, 'length', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`${component.type}-width`}>Width (inches)</Label>
              <Input
                id={`${component.type}-width`}
                type="number"
                step="0.01"
                min="0"
                placeholder="Width"
                value={component.width || ""}
                onChange={(e) => onChange(component.type, 'width', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`${component.type}-roll-width`}>Roll Width (inches)</Label>
              <Input
                id={`${component.type}-roll-width`}
                type="number"
                step="0.01"
                min="0"
                placeholder="Roll width"
                value={component.roll_width || ""}
                onChange={(e) => onChange(component.type, 'roll_width', e.target.value)}
              />
            </div>
          </div>
          
          {/* Consumption based on dimensions and default quantity */}
          {showConsumption && (
            <div>
              <Label htmlFor={`${component.type}-consumption`}>Consumption</Label>
              <Input
                id={`${component.type}-consumption`}
                value={consumption}
                readOnly
                className="bg-gray-100"
              />
              {defaultQuantity && baseConsumption && (
                <p className="text-xs text-muted-foreground mt-1">
                  Base consumption: {baseConsumption} × Quantity: {defaultQuantity}
                </p>
              )}
            </div>
          )}
          
          {/* Add Material Selector */}
          <MaterialLinkSelector 
            onMaterialSelect={onMaterialSelect}
            selectedMaterialId={component.material_id || null}
            componentType={component.type}
            inventoryItems={inventoryItems}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default StandardComponents;
