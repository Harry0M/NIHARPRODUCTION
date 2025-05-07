
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ConsumptionCalculatorProps {
  length: number;
  width: number;
  quantity: number;
  rollWidth: number; // Added roll width as a required parameter
  materialRate?: number;
  onConsumptionCalculated: (meters: number, cost?: number) => void;
}

export const ConsumptionCalculator = ({ 
  length, 
  width, 
  quantity,
  rollWidth, // Add roll width to destructuring
  materialRate,
  onConsumptionCalculated
}: ConsumptionCalculatorProps) => {
  const [consumption, setConsumption] = useState<number>(0);
  const [materialCost, setMaterialCost] = useState<number | undefined>(undefined);

  // Calculate consumption in meters based on formula: [(length*width)/(roll_width*39.39)]*quantity
  useEffect(() => {
    if (length && width && quantity && rollWidth) {
      try {
        // Updated formula: (length * width) / (roll_width * 39.39) * quantity
        const calculatedConsumption = ((length * width) / (rollWidth * 39.39)) * quantity;
        const roundedConsumption = Math.round(calculatedConsumption * 100) / 100;
        
        console.log("Calculated consumption:", roundedConsumption, "for length:", length, "width:", width, "roll width:", rollWidth, "quantity:", quantity);
        
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
      console.log("Missing values for consumption calculation:", { length, width, rollWidth, quantity });
      setConsumption(0);
      setMaterialCost(undefined);
      onConsumptionCalculated(0);
    }
  }, [length, width, rollWidth, quantity, materialRate, onConsumptionCalculated]);

  return (
    <div className="space-y-2">
      <Label htmlFor="consumption">Consumption (meters)</Label>
      <Input 
        id="consumption" 
        type="text"
        value={consumption ? consumption.toString() : ''}
        readOnly
        className="bg-gray-50"
      />
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
        Calculated using formula: [(length×width)÷(roll width×39.39)]×quantity
      </p>
    </div>
  );
};
