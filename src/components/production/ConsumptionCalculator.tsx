import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
        } else {
          // Don't recalculate if missing required fields
          return consumption;
        }
      } else if (formula === "linear") {
        // Linear formula: (length * quantity) / 39.37 
        // This is just a direct conversion of inches to meters multiplied by quantity
        const totalLengthInInches = length * quantity;
        calculatedConsumption = totalLengthInInches / 39.37; // convert to meters
      }
      
      // Round to 2 decimal places for better precision
      return Math.round(calculatedConsumption * 100) / 100;
    } catch (error) {
      console.error("Error calculating consumption:", error);
      return 0;
    }
  }, [length, width, rollWidth, quantity, formula, consumption]);

  // Handle formula change
  const handleFormulaChange = (value: ConsumptionFormulaType) => {
    setFormula(value);
    if (onFormulaChange) {
      onFormulaChange(value);
    }
  };

  // Calculate consumption and cost when inputs change
  useEffect(() => {
    const newConsumption = calculateConsumption();
    
    // Only update state and call the callback if the value has changed
    if (newConsumption !== consumption) {
      setConsumption(newConsumption);
      
      // Calculate material cost if rate is provided
      let cost: number | undefined = undefined;
      if (materialRate && materialRate > 0 && newConsumption > 0) {
        cost = newConsumption * materialRate;
        cost = Math.round(cost * 100) / 100;
        setMaterialCost(cost);
      } else {
        setMaterialCost(undefined);
      }
      
      // Notify parent component of the new consumption and cost
      onConsumptionCalculated(newConsumption, cost);
    }
  }, [length, width, rollWidth, quantity, materialRate, formula, calculateConsumption, consumption, onConsumptionCalculated]);

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

      <Label htmlFor="consumption">Consumption (meters)</Label>
      <Input 
        id="consumption" 
        type="text"
        value={consumption ? consumption.toString() : ''}
        readOnly
        className="bg-gray-50"
      />
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
