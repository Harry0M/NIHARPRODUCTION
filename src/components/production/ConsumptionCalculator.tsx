
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ConsumptionCalculatorProps {
  length: number;
  width: number;
  quantity: number;
  onConsumptionCalculated: (meters: number) => void;
}

export const ConsumptionCalculator = ({ 
  length, 
  width, 
  quantity,
  onConsumptionCalculated
}: ConsumptionCalculatorProps) => {
  const [consumption, setConsumption] = useState<number>(0);

  // Calculate consumption in meters based on formula: [(length*width)/(6339.39)]*quantity
  useEffect(() => {
    if (length && width && quantity) {
      try {
        const calculatedConsumption = ((length * width) / 6339.39) * quantity;
        const roundedConsumption = Math.round(calculatedConsumption * 100) / 100;
        console.log("Calculated consumption:", roundedConsumption);
        setConsumption(roundedConsumption);
        onConsumptionCalculated(roundedConsumption);
      } catch (error) {
        console.error("Error calculating consumption:", error);
        setConsumption(0);
        onConsumptionCalculated(0);
      }
    } else {
      setConsumption(0);
      onConsumptionCalculated(0);
    }
  }, [length, width, quantity, onConsumptionCalculated]);

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
      <p className="text-xs text-muted-foreground">
        Calculated using formula: [(length×width)÷6339.39]×quantity
      </p>
    </div>
  );
};
