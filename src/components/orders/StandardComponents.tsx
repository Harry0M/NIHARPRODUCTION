
import { useState } from "react";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MaterialSelector } from "@/components/inventory/material-selector/MaterialSelector";

interface StandardComponentsProps {
  components: Record<string, any>;
  componentOptions: {
    color: string[];
    gsm?: string[]; // Make gsm optional
  };
  onChange: (type: string, field: string, value: string) => void;
  defaultQuantity?: string;
}

export const StandardComponents = ({ 
  components, 
  componentOptions, 
  onChange,
  defaultQuantity
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

  // Calculate consumption based on dimensions and default quantity
  const calculateConsumption = (component: any) => {
    if (component.length && component.width && component.roll_width && defaultQuantity) {
      const length = parseFloat(component.length);
      const width = parseFloat(component.width);
      const rollWidth = parseFloat(component.roll_width);
      const quantity = parseInt(defaultQuantity);
      
      if (!isNaN(length) && !isNaN(width) && !isNaN(rollWidth) && !isNaN(quantity) && rollWidth > 0) {
        // Formula: (length * width) / (roll_width * 39.39) * quantity
        const consumption = ((length * width) / (rollWidth * 39.39)) * quantity;
        return consumption.toFixed(2);
      }
    }
    return '';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Standard Components</h2>
      
      <div className="grid md:grid-cols-2 gap-4">
        {standardComponents.map((component) => (
          <ComponentForm
            key={component.type}
            component={components[component.type] || { type: component.type }}
            componentOptions={componentOptions}
            onChange={onChange}
            defaultQuantity={defaultQuantity}
            onMaterialSelect={(materialId) => handleMaterialSelect(component.type, materialId)}
            calculateConsumption={calculateConsumption}
          />
        ))}
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
  };
  componentOptions: {
    color: string[];
    gsm?: string[]; // Make gsm optional
  };
  onChange: (type: string, field: string, value: string) => void;
  defaultQuantity?: string;
  onMaterialSelect: (materialId: string | null) => void;
  calculateConsumption: (component: any) => string;
}

const ComponentForm = ({ 
  component, 
  componentOptions, 
  onChange,
  defaultQuantity,
  onMaterialSelect,
  calculateConsumption
}: ComponentFormProps) => {
  const [customColor, setCustomColor] = useState("");
  const [customGSM, setCustomGSM] = useState("");
  
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
  
  // Calculate consumption for this component
  const consumption = calculateConsumption(component);
  
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
          <div>
            <Label htmlFor={`${component.type}-consumption`}>Consumption</Label>
            <Input
              id={`${component.type}-consumption`}
              value={consumption}
              readOnly
              className="bg-gray-100"
            />
            {defaultQuantity && (
              <p className="text-xs text-muted-foreground mt-1">
                Based on dimensions and quantity of {defaultQuantity}
              </p>
            )}
          </div>
          
          {/* Add Material Selector */}
          <MaterialSelector 
            onMaterialSelect={onMaterialSelect}
            selectedMaterialId={component.material_id || null}
            componentType={component.type}
          />
        </div>
      </CardContent>
    </Card>
  );
};
