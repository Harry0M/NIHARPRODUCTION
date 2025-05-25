import { useEffect, useState } from "react";
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

  // Handle formula change
  const handleFormulaChange = (value: ConsumptionFormulaType) => {
    setFormula(value);
    if (onFormulaChange) {
      onFormulaChange(value);
    }
  };

  // Calculate consumption based on selected formula
  useEffect(() => {
    if (length && quantity) {
      try {
        let calculatedConsumption = 0;
        let canCalculate = true;
        let missingFields = [];
        
        if (formula === "standard") {
          // Standard formula: (length * width) / (roll_width * 39.39) * quantity
          if (!width) {
            missingFields.push("width");
            canCalculate = false;
          }
          if (!rollWidth) {
            missingFields.push("roll width");
            canCalculate = false;
          }
          
          if (canCalculate) {
            calculatedConsumption = ((length * width) / (rollWidth * 39.39)) * quantity;
          } else {
            console.log(`Missing required fields for standard formula: ${missingFields.join(", ")}`);
            // Don't clear existing consumption if switching from linear to standard
            if (!consumption) {
              setConsumption(0);
              setMaterialCost(undefined);
              onConsumptionCalculated(0);
            }
            return;
          }
        } else if (formula === "linear") {
          // Linear formula: (quantity * length) / 39.39
          calculatedConsumption = (quantity * length) / 39.39;
        }
        
        const roundedConsumption = Math.round(calculatedConsumption * 100) / 100;
        
        console.log("Calculated consumption:", roundedConsumption, "using formula:", formula);
        
        // Calculate material cost if rate is provided
        let cost: number | undefined = undefined;
        if (materialRate && materialRate > 0) {
          cost = roundedConsumption * materialRate;
          cost = Math.round(cost * 100) / 100;
          console.log("Calculated material cost:", cost, "using rate:", materialRate);
          setMaterialCost(cost);
        }
        
        setConsumption(roundedConsumption);
        onConsumptionCalculated(roundedConsumption, cost);
      } catch (error) {
        console.error("Error calculating consumption:", error);
        setConsumption(0);
        setMaterialCost(undefined);
        onConsumptionCalculated(0);
      }
    } else {
      console.log("Missing required values for consumption calculation");
      setConsumption(0);
      setMaterialCost(undefined);
      onConsumptionCalculated(0);
    }
  }, [length, width, rollWidth, quantity, materialRate, formula, onConsumptionCalculated]);

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
