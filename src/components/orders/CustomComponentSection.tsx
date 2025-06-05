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
import { useState, useEffect } from "react";
import { ConsumptionCalculator, ConsumptionFormulaType } from "@/components/production/ConsumptionCalculator";

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
  details?: string;
  consumption?: string;
  baseConsumption?: string;
  materialRate?: number;
  materialCost?: number;
  formula?: ConsumptionFormulaType;
}

interface CustomComponentSectionProps {
  customComponents: CustomComponent[];
  componentOptions: {
    color: string[];
    gsm?: string[]; // Make gsm optional
  };
  handleCustomComponentChange: (index: number, field: string, value: string) => void;
  removeCustomComponent: (index: number) => void;
  defaultQuantity?: string;
  showConsumption?: boolean;
  onFormulaChange?: (index: number, formula: 'standard' | 'linear' | 'manual') => void;
  onConsumptionCalculated?: (index: number, consumption: number, cost?: number, isManual?: boolean) => void;
}

export const CustomComponentSection = ({
  customComponents,
  componentOptions,
  handleCustomComponentChange,
  removeCustomComponent,
  defaultQuantity,
  showConsumption = false,
  onFormulaChange,
  onConsumptionCalculated
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
              defaultQuantity={defaultQuantity}
              showConsumption={showConsumption}
              onFormulaChange={onFormulaChange}
              onConsumptionCalculated={onConsumptionCalculated}
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
    details?: string;
    consumption?: string;
    baseConsumption?: string;
    materialRate?: number;
    materialCost?: number;
    formula?: ConsumptionFormulaType;
    is_manual_consumption?: boolean;
    baseFormula?: ConsumptionFormulaType;
  };
  index: number;
  componentOptions: {
    color: string[];
    gsm?: string[]; // Make gsm optional
  };
  handleCustomComponentChange: (index: number, field: string, value: string) => void;
  removeCustomComponent: (index: number) => void;
  defaultQuantity?: string;
  showConsumption?: boolean;
  onFormulaChange?: (index: number, formula: 'standard' | 'linear' | 'manual') => void;
  onConsumptionCalculated?: (index: number, consumption: number, cost?: number, isManual?: boolean) => void;
}

const CustomComponentForm = ({
  component,
  index,
  componentOptions,
  handleCustomComponentChange,
  removeCustomComponent,
  defaultQuantity,
  showConsumption = false,
  onFormulaChange,
  onConsumptionCalculated
}: CustomComponentFormProps) => {
  const [customColor, setCustomColor] = useState(component.color === "Custom" ? "" : "");
  const [customGSM, setCustomGSM] = useState(component.gsm === "Custom" ? "" : "");
  const [materialRate, setMaterialRate] = useState<number | undefined>(component.materialRate);
  
  useEffect(() => {
    if (component.materialRate !== materialRate) {
      setMaterialRate(component.materialRate);
    }
  }, [component.materialRate, materialRate]);
  
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

  const handleConsumptionCalculated = (consumption: number, cost?: number) => {
    // Use context handler if available, otherwise fall back to local handling
    if (onConsumptionCalculated) {
      onConsumptionCalculated(index, consumption, cost);
      return;
    }

    // Fallback local handling (for backwards compatibility)
    handleCustomComponentChange(index, 'consumption', consumption.toString());
    if (cost !== undefined) {
      handleCustomComponentChange(index, 'materialCost', cost.toString());
    }
  };
  
  const handleFormulaChange = (formula: ConsumptionFormulaType) => {
    // Use context handler if available, otherwise fall back to local handling
    if (onFormulaChange) {
      onFormulaChange(index, formula);
    } else {
      // Fallback local handling (for backwards compatibility)
      handleCustomComponentChange(index, 'formula', formula);
    }
  };
  
  const consumption = component.consumption || '';
  const baseConsumption = component.baseConsumption || '';
  
  // Get formula for the consumption calculator
  const selectedFormula = component.formula || 'standard';
  const isManual = component.formula === 'manual' || !!component.is_manual_consumption;
  
  // Debug log for manual formula troubleshooting
  useEffect(() => {
    console.log(`Custom component ${index} (${component.customName || 'unnamed'}) loaded with:`, {
      formula: component.formula,
      is_manual_consumption: component.is_manual_consumption,
      selectedFormula,
      isManual,
      consumption: component.consumption
    });
  }, [index, component.customName, component.formula, component.is_manual_consumption, selectedFormula, isManual, component.consumption]);
  
  // Check if any dimensions are filled
  const hasDimensions = component.length || component.width || component.roll_width;
  const customName = component.customName || `Custom Component ${index + 1}`;
  
  // Get material cost if available
  const materialCost = component.materialCost;
  
  // Make sure formula is always set
  useEffect(() => {
    if (!component.formula) {
      // If formula is not set, default to 'standard'
      handleCustomComponentChange(index, 'formula', 'standard');
      console.log(`Set default formula 'standard' for custom component ${index}`);
    }
  }, [component, index, handleCustomComponentChange]);
  
  return (
    <Card className={component.consumption ? "border-blue-200" : ""}>
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <div className="flex flex-col">
          <Label className="text-sm font-medium">{customName}</Label>
          <div className="flex gap-2">
            {showConsumption && component.consumption && (
              <span className="text-xs font-medium text-blue-700">
                {parseFloat(component.consumption).toFixed(2)} m
              </span>
            )}
            {materialCost && (
              <span className="text-xs font-medium text-emerald-700">
                ₹{parseFloat(materialCost.toString()).toFixed(2)}
              </span>
            )}
          </div>
        </div>
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
            
            {/* Only render GSM field if gsm options are provided */}
            {componentOptions.gsm && (
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
            )}
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
          
          {/* Consumption with integrated material cost calculation */}
          {component.length && defaultQuantity ? (
            <ConsumptionCalculator
              length={parseFloat(component.length)}
              width={component.width ? parseFloat(component.width) : 0}
              rollWidth={component.roll_width ? parseFloat(component.roll_width) : 0}
              quantity={parseFloat(defaultQuantity)}
              materialRate={materialRate}
              selectedFormula={selectedFormula}
              initialIsManual={component.formula === 'manual' || !!component.is_manual_consumption}
              initialConsumption={component.consumption ? parseFloat(component.consumption) : undefined}
              onConsumptionCalculated={handleConsumptionCalculated}
              onFormulaChange={handleFormulaChange}
            />
          ) : (
            <div>
              <Label htmlFor={`custom-${index}-consumption`} className="flex justify-between">
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
                id={`custom-${index}-consumption`}
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
            onMaterialSelect={handleMaterialSelect}
            selectedMaterialId={component.material_id || null}
            componentType={customName}
          />
        </div>
      </CardContent>
    </Card>
  );
};
