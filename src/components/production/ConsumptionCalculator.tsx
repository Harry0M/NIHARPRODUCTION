
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Calculator } from "lucide-react";

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
  const [rollWidth, setRollWidth] = useState<number>(0);
  const [consumption, setConsumption] = useState<number>(0);

  // Calculate consumption in meters based on formula: [(length*width)/(6339.39)]*quantity
  useEffect(() => {
    if (length && width && quantity) {
      const calculatedConsumption = ((length * width) / 6339.39) * quantity;
      setConsumption(Math.round(calculatedConsumption * 100) / 100);
      onConsumptionCalculated(Math.round(calculatedConsumption * 100) / 100);
    } else {
      setConsumption(0);
      onConsumptionCalculated(0);
    }
  }, [length, width, quantity, onConsumptionCalculated]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Material Consumption
        </CardTitle>
        <CardDescription>
          Calculate material consumption based on bag dimensions and quantity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="roll_width">Roll Width (inches)</Label>
            <Input 
              id="roll_width" 
              type="number"
              min="0"
              step="0.01"
              value={rollWidth || ''}
              onChange={(e) => setRollWidth(parseFloat(e.target.value) || 0)}
              placeholder="Enter roll width"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="consumption">Consumption (meters)</Label>
            <Input 
              id="consumption" 
              type="number"
              value={consumption || ''}
              readOnly
              className="bg-gray-50"
            />
            <p className="text-xs text-muted-foreground">
              Calculated using formula: [(length×width)÷6339.39]×quantity
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
