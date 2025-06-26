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
import { PlusCircle, Trash2 } from "lucide-react";
import { isManualFormula } from "@/utils/manualFormulaProcessor";
import { Badge } from "@/components/ui/badge";

interface ComponentType {
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
  is_manual_consumption?: boolean;
}

interface StandardComponentsProps {
  components: Record<string, ComponentType>;
  componentOptions: {
    color: string[];
    gsm?: string[]; // Make gsm optional
  };
  onChange: (type: string, field: string, value: string) => void;
  onRemoveComponent?: (componentType: string) => void; // Add function to remove/reset a component
  defaultQuantity?: string;
  showConsumption?: boolean;
  onFormulaChange?: (componentType: string, formula: 'standard' | 'linear' | 'manual') => void;
  onConsumptionCalculated?: (componentType: string, consumption: number, cost?: number, isManual?: boolean) => void;
}

export const StandardComponents = ({ 
  components, 
  componentOptions, 
  onChange,
  onRemoveComponent,
  defaultQuantity,
  showConsumption = false,
  onFormulaChange,
  onConsumptionCalculated
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

  // Test component function removed

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Standard Components</h2>
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
              onRemoveComponent={onRemoveComponent}
              showConsumption={showConsumption}
              onFormulaChange={onFormulaChange}
              onConsumptionCalculated={onConsumptionCalculated}
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
    is_manual_consumption?: boolean;
    baseFormula?: ConsumptionFormulaType;
  };
  componentOptions: {
    color: string[];
    gsm?: string[]; // Make gsm optional
  };
  onChange: (type: string, field: string, value: string) => void;
  defaultQuantity?: string;
  onMaterialSelect: (materialId: string | null) => void;
  onRemoveComponent?: (componentType: string) => void; // Add function to remove component
  showConsumption?: boolean;
  onFormulaChange?: (componentType: string, formula: 'standard' | 'linear' | 'manual') => void;
  onConsumptionCalculated?: (componentType: string, consumption: number, cost?: number, isManual?: boolean) => void;
}

const ComponentForm = ({ 
  component, 
  componentOptions, 
  onChange,
  defaultQuantity,
  onMaterialSelect,
  onRemoveComponent,
  showConsumption = false,
  onFormulaChange,
  onConsumptionCalculated
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

  // Track the local consumption value to ensure badge and input field match exactly
  const [displayConsumption, setDisplayConsumption] = useState<string>(
    component.consumption || ''
  );

  // Update local display value when component prop changes
  useEffect(() => {
    if (component.consumption !== displayConsumption && component.consumption) {
      setDisplayConsumption(component.consumption);
    }
  }, [component.consumption, displayConsumption]);

  // Synchronize consumption calculation with component state
  const handleConsumptionCalculated = (consumption: number, cost?: number) => {
    // Use context handler if available, otherwise fall back to local handling
    if (onConsumptionCalculated) {
      onConsumptionCalculated(component.type, consumption, cost);
      return;
    }

    // Fallback local handling (for backwards compatibility)
    // CRITICAL FIX: Ensure consumption is properly formatted with high precision
    // This is the value that will be saved to the database
    const preciseConsumption = consumption.toFixed(4);
    
    // Update local display state first to ensure UI consistency
    setDisplayConsumption(preciseConsumption);
    
    // IMPORTANT: Store the exact value directly in the component state 
    // with additional data marker to ensure correct value is saved
    onChange(component.type, 'consumption', preciseConsumption);
    onChange(component.type, 'exactConsumption', preciseConsumption); // Additional safety backup
    
    // Mark the component to ensure this exact value is used during submission
    onChange(component.type, 'finalConsumptionValue', preciseConsumption);
    
    // MATERIAL COST FIX: Ensure material cost is precisely calculated based on rate and consumption
    // Get material rate from component if available
    const materialRate = component.materialRate || 0;
    
    // Calculate the material cost directly based on consumption and rate
    if (materialRate > 0) {
      // Calculate with high precision
      const calculatedCost = consumption * materialRate;
      // Format with 4 decimal places for consistency
      const preciseCost = calculatedCost.toFixed(4);
      
      // Store the calculated cost
      onChange(component.type, 'materialCost', preciseCost);
      
      // Log detailed calculation for debugging
      console.log(`%c ${component.type} COST: ${consumption} meters × ₹${materialRate}/meter = ₹${preciseCost}`, 
        'background:#e67e22;color:white;font-weight:bold;padding:3px;');
    } else if (cost !== undefined) {
      // Fallback to the cost provided by the calculator if available
      const preciseCost = cost.toFixed(4);
      onChange(component.type, 'materialCost', preciseCost);
    }
    
    // Also update baseConsumption if defaultQuantity is available
    if (defaultQuantity && parseFloat(defaultQuantity) > 0) {
      const baseConsumptionValue = consumption / parseFloat(defaultQuantity);
      const preciseBaseConsumption = baseConsumptionValue.toFixed(6);
      onChange(component.type, 'baseConsumption', preciseBaseConsumption);
    }
    
    // Log with clear high-visibility formatting to make it obvious what values are being used
    console.log(`%c ${component.type} CONSUMPTION VALUE %c ${preciseConsumption} %c WILL BE SAVED TO DATABASE`, 
      'background:#3498db;color:white;font-weight:bold;padding:3px;', 
      'background:#e74c3c;color:white;font-weight:bold;padding:3px;', 
      'background:#3498db;color:white;font-weight:bold;padding:3px;');
    
    console.log('Component consumption details:', {
      component: component.type,
      finalConsumptionValue: preciseConsumption,
      materialCost: cost?.toFixed(4),
      baseConsumption: defaultQuantity ? (consumption / parseFloat(defaultQuantity)).toFixed(6) : 'N/A'
    });
  };
  
  const handleFormulaChange = (formula: ConsumptionFormulaType) => {
    // Use context handler if available, otherwise fall back to local handling
    if (onFormulaChange) {
      onFormulaChange(component.type, formula);
    } else {
      // Fallback local handling (for backwards compatibility)
      onChange(component.type, 'formula', formula);
    }
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
  const isManual = isManualFormula(component);
  
  // Debug log for manual consumption troubleshooting
  useEffect(() => {
    console.log(`Component ${component.type} loaded with:`, {
      formula: component.formula,
      is_manual_consumption: component.is_manual_consumption,
      selectedFormula,
      isManual,
      consumption: component.consumption
    });
  }, [component.type, component.formula, component.is_manual_consumption, selectedFormula, isManual, component.consumption]);
  
  return (
    <Card className={component.consumption ? "border-blue-200" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>{component.type}</span>
            {isManual && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                Manual
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onRemoveComponent && (
              <Button 
                type="button"
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600" 
                onClick={() => onRemoveComponent(component.type)}
                title="Clear component data"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
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
              initialIsManual={isManualFormula(component)}
              initialConsumption={component.consumption ? parseFloat(component.consumption) : undefined}
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
