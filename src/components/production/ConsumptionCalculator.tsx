import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// Define formula types
export type ConsumptionFormulaType = "standard" | "linear";

interface ConsumptionCalculatorProps {
  length: number;
  width: number;
  quantity: number;
  rollWidth: number;
  materialRate?: number;
  selectedFormula?: ConsumptionFormulaType;
  onConsumptionCalculated: (meters: number, cost?: number) => void;
  onFormulaChange?: (formula: ConsumptionFormulaType) => void;
}

export const ConsumptionCalculator = ({ 
  length, 
  width, 
  quantity,
  rollWidth,
  materialRate,
  selectedFormula = "standard",
  onConsumptionCalculated,
  onFormulaChange
}: ConsumptionCalculatorProps) => {
  const [consumption, setConsumption] = useState<number>(0);
  const [materialCost, setMaterialCost] = useState<number | undefined>(undefined);
  const [formula, setFormula] = useState<ConsumptionFormulaType>(selectedFormula);
  const [isManualMode, setIsManualMode] = useState<boolean>(false);
  const [manualConsumption, setManualConsumption] = useState<string>("");

  // Memoize the calculation function to prevent unnecessary recalculations
  const calculateConsumption = useCallback(() => {
    if (!length || !quantity) return 0;
    
    try {
      let calculatedConsumption = 0;
      let canCalculate = true;
      
      if (formula === "standard") {
        // Standard formula: (length * width) / (roll_width * 39.39) * quantity
        // Width and roll_width are required for this formula
        if (!width || !rollWidth) {
          canCalculate = false;
        }
        
        if (canCalculate) {
          // Convert inches to meters:
          // 1. Calculate area in square inches: length * width
          // 2. Divide by roll width in inches
          // 3. Convert to meters (39.37 inches = 1 meter)
          // 4. Multiply by quantity
          const areaInSqInches = length * width;
          const lengthPerUnit = areaInSqInches / rollWidth; // length in inches per unit
          calculatedConsumption = (lengthPerUnit / 39.37) * quantity; // convert to meters and multiply by quantity
        }
      } else if (formula === "linear") {
        // Linear formula: (length * quantity) / 39.37 
        // This is just a direct conversion of inches to meters multiplied by quantity
        const totalLengthInInches = length * quantity;
        calculatedConsumption = totalLengthInInches / 39.37; // convert to meters
      }
      
      // Round to 4 decimal places for better precision
      return Math.round(calculatedConsumption * 10000) / 10000;
    } catch (error) {
      console.error("Error calculating consumption:", error);
      return 0;
    }
  }, [length, width, rollWidth, quantity, formula]);

  // Handle formula change
  const handleFormulaChange = (value: ConsumptionFormulaType) => {
    setFormula(value);
    if (onFormulaChange) {
      onFormulaChange(value);
    }
  };

  // Auto-detect formula based on provided dimensions
  useEffect(() => {
    // Auto-select formula based on available dimensions
    const newFormula: ConsumptionFormulaType = 
      // If we have length, width and roll_width, use standard formula
      (length && width && rollWidth) ? "standard" :
      // If we only have length, use linear formula
      (length && (!width || !rollWidth)) ? "linear" :
      // Default to current formula if we can't determine
      formula;
    
    // Update formula if it's different from current
    if (newFormula !== formula) {
      setFormula(newFormula);
      if (onFormulaChange) {
        onFormulaChange(newFormula);
      }
      console.log(`Auto-selected formula: ${newFormula} based on dimensions`, 
        { length, width, rollWidth });
    }
  }, [length, width, rollWidth, formula, onFormulaChange]);

  // Calculate consumption whenever inputs change
  useEffect(() => {
    const newConsumption = calculateConsumption();
    if (newConsumption !== consumption) {
      setConsumption(newConsumption);
      if (!isManualMode) {
        onConsumptionCalculated(newConsumption, materialRate ? newConsumption * materialRate : undefined);
      }
    }
  }, [calculateConsumption, materialRate, onConsumptionCalculated, isManualMode]);

  // Update manual consumption when calculated consumption changes
  useEffect(() => {
    if (!isManualMode) {
      setManualConsumption(consumption ? consumption.toString() : '');
    }
  }, [consumption, isManualMode]);

  // Handle manual consumption change
  const handleManualConsumptionChange = (value: string) => {
    setManualConsumption(value);
    const numValue = parseFloat(value) || 0;
    onConsumptionCalculated(numValue, materialRate ? numValue * materialRate : undefined);
  }; 

  // Toggle between manual and calculated mode
  const toggleManualMode = (checked: boolean) => {
    setIsManualMode(checked);
    if (!checked) {
      // When switching back to calculated mode, update with the calculated value
      onConsumptionCalculated(consumption, materialRate ? consumption * materialRate : undefined);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Label htmlFor="formula-select" className="whitespace-nowrap">Formula:</Label>
        <Select value={formula} onValueChange={(value) => handleFormulaChange(value as ConsumptionFormulaType)}>
          <SelectTrigger id="formula-select" className="flex-grow">
            <SelectValue placeholder="Select formula" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard (L×W)÷(RW×39.39)</SelectItem>
            <SelectItem value="linear">Linear (Q×L)÷39.39</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="consumption">Consumption (meters)</Label>
        <div className="flex items-center space-x-2">
          <Label htmlFor="manual-mode" className="text-xs text-muted-foreground">
            Manual
          </Label>
          <Switch
            id="manual-mode"
            checked={isManualMode}
            onCheckedChange={toggleManualMode}
          />
        </div>
      </div>
      <Input 
        id="consumption" 
        type="number"
        step="0.0001"
        min="0"
        value={isManualMode ? manualConsumption : (consumption ? consumption.toString() : '')}
        onChange={(e) => isManualMode && handleManualConsumptionChange(e.target.value)}
        readOnly={!isManualMode}
        className={`${isManualMode ? 'bg-white border-amber-300' : 'bg-gray-50 border-blue-300 text-blue-800 font-medium'}`}
        data-final-consumption={consumption ? consumption.toString() : ''}
      />
      {isManualMode && (
        <p className="text-xs text-muted-foreground">
          {formula === "standard" 
            ? `Calculated: ${consumption.toFixed(4)}m (${formula} formula)`
            : `Calculated: ${consumption.toFixed(4)}m (${formula} formula)`}
        </p>
      )}
      {formula === "standard" && (!width || !rollWidth) && (
        <p className="text-xs text-amber-500">
          {!width && !rollWidth ? "Width and roll width required" : 
           !width ? "Width required" : "Roll width required"}
        </p>
      )}
      {materialRate && materialCost !== undefined && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Rate: ₹{materialRate}/meter
          </span>
          <span className="text-xs font-medium text-emerald-700">
            Cost: ₹{materialCost}
          </span>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {formula === "standard" 
          ? "Formula: [(length×width)÷(roll width×39.39)]×quantity" 
          : "Formula: (quantity×length)÷39.39"}
      </p>
    </div>
  );
};
