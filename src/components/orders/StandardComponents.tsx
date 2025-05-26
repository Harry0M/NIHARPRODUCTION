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
import { MaterialSelector } from "@/components/inventory/material-selector/MaterialSelector";
import { ConsumptionCalculator, ConsumptionFormulaType } from "@/components/production/ConsumptionCalculator";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface StandardComponentsProps {
  components: Record<string, any>;
  componentOptions: {
    color: string[];
    gsm?: string[]; // Make gsm optional
  };
  onChange: (type: string, field: string, value: string) => void;
  defaultQuantity?: string;
  showConsumption?: boolean;
}

export const StandardComponents = ({ 
  components, 
  componentOptions, 
  onChange,
  defaultQuantity,
  showConsumption = false
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

  // For debugging: Manually add a test component
  const addTestComponent = () => {
    // Create a test component with all required fields and a valid component_type
    const testComponent = {
      type: "Part", // This matches one of the standardComponents types
      color: "Red",
      length: "10",
      width: "5",
      roll_width: "40",
      formula: "standard", // Ensure formula field is set
      consumption: "0.32"
    };
    
    // Add the test component to components
    console.log("Adding test component:", testComponent);
    
    // Update each field individually
    Object.entries(testComponent).forEach(([field, value]) => {
      if (field !== 'type') {
        onChange("Part", field, value);
      }
    });
    
    // Log for confirmation that component was added with correct type
    console.log("Test component added with type: Part (lowercase: part)");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Standard Components</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={addTestComponent}
          className="h-7 text-xs bg-blue-50 border-blue-200 hover:bg-blue-100"
        >
          <PlusCircle className="mr-1 h-3 w-3" />
          Add Test Component
        </Button>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        {standardComponents.map((component) => {
          // Get the actual component data if it exists
          const componentData = components[component.type] || { type: component.type };
          
          return (
            <ComponentForm
              key={component.type}
              component={componentData}
              componentOptions={componentOptions}
              onChange={onChange}
              defaultQuantity={defaultQuantity}
              onMaterialSelect={(materialId) => handleMaterialSelect(component.type, materialId)}
              showConsumption={showConsumption}
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
    materialRate?: number;
    materialCost?: number;
    formula?: ConsumptionFormulaType;
  };
  componentOptions: {
    color: string[];
    gsm?: string[]; // Make gsm optional
  };
  onChange: (type: string, field: string, value: string) => void;
  defaultQuantity?: string;
  onMaterialSelect: (materialId: string | null) => void;
  showConsumption?: boolean;
}

const ComponentForm = ({ 
  component, 
  componentOptions, 
  onChange,
  defaultQuantity,
  onMaterialSelect,
  showConsumption = false
}: ComponentFormProps) => {
  const [customColor, setCustomColor] = useState("");
  const [customGSM, setCustomGSM] = useState("");
  const [materialRate, setMaterialRate] = useState<number | undefined>(component.materialRate);
  
  useEffect(() => {
    if (component.materialRate !== materialRate) {
      setMaterialRate(component.materialRate);
    }
  }, [component.materialRate, materialRate]);
  
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

  const handleConsumptionCalculated = (consumption: number, cost?: number) => {
    onChange(component.type, 'consumption', consumption.toString());
    if (cost !== undefined) {
      onChange(component.type, 'materialCost', cost.toString());
    }
  };
  
  const handleFormulaChange = (formula: ConsumptionFormulaType) => {
    onChange(component.type, 'formula', formula);
  };
  
  // Make sure formula is always set - run only once when component is mounted
  useEffect(() => {
    if (!component.formula) {
      // If formula is not set, default to 'standard'
      onChange(component.type, 'formula', 'standard');
    }
  }, [component.type, component.formula, onChange]);
  
  // Get consumption - it should be already calculated from the parent component
  const consumption = component.consumption || '';
  const baseConsumption = component.baseConsumption || '';
  
  // Check if any dimensions are filled
  const hasDimensions = component.length || component.width || component.roll_width;

  // Get material cost if available
  const materialCost = component.materialCost;
  
  // Get selected formula or default to standard
  const selectedFormula = component.formula || 'standard';
  
  return (
    <Card className={component.consumption ? "border-blue-200" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex justify-between items-center">
          <span>{component.type}</span>
          <div className="flex gap-2 items-center">
            {showConsumption && component.consumption && (
              <span className="text-sm font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                {parseFloat(component.consumption).toFixed(2)} m
              </span>
            )}
            {materialCost && (
              <span className="text-sm font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                ₹{parseFloat(materialCost.toString()).toFixed(2)}
              </span>
            )}
          </div>
        </CardTitle>
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
          
          {/* Consumption with integrated material cost calculation */}
          {component.length && defaultQuantity ? (
            <ConsumptionCalculator
              length={parseFloat(component.length)}
              width={component.width ? parseFloat(component.width) : 0}
              rollWidth={component.roll_width ? parseFloat(component.roll_width) : 0}
              quantity={parseFloat(defaultQuantity)}
              materialRate={materialRate}
              selectedFormula={selectedFormula}
              onConsumptionCalculated={handleConsumptionCalculated}
              onFormulaChange={handleFormulaChange}
            />
          ) : (
            <div>
              <Label htmlFor={`${component.type}-consumption`} className="flex justify-between">
                <span>Consumption</span>
                {hasDimensions && !consumption && (
                  <span className="text-amber-600 text-xs">
                    {selectedFormula === 'standard' 
                      ? 'Enter all dimensions + quantity' 
                      : 'Enter length + quantity'}
                  </span>
                )}
              </Label>
              <Input
                id={`${component.type}-consumption`}
                value={consumption}
                readOnly
                className={`bg-gray-50 ${consumption ? "border-blue-300 text-blue-800 font-medium" : ""}`}
              />
              {defaultQuantity && baseConsumption && (
                <p className="text-xs text-muted-foreground mt-1">
                  Base: {baseConsumption} × Quantity: {defaultQuantity}
                </p>
              )}
            </div>
          )}
          
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
