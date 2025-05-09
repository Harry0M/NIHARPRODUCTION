
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface CostCalculationDisplayProps {
  costCalculation: {
    materialCost: number;
    cuttingCharge: number;
    printingCharge: number;
    stitchingCharge: number;
    transportCharge: number;
    productionCost: number;
    totalCost: number;
    margin: number;
    sellingPrice: number;
  };
  onMarginChange?: (margin: number) => void;
}

export const CostCalculationDisplay = ({
  costCalculation,
  onMarginChange
}: CostCalculationDisplayProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMargin = parseFloat(e.target.value);
    if (!isNaN(newMargin) && onMarginChange) {
      onMarginChange(newMargin);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>Cost Calculation</span>
          <button 
            type="button"
            className="text-xs text-blue-600 hover:text-blue-800"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isExpanded ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Material Costs</h3>
              <div className="bg-slate-50 p-3 rounded-md">
                <div className="flex justify-between items-center">
                  <span>Material Cost</span>
                  <span className="font-medium">{formatCurrency(costCalculation.materialCost)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Production Costs</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <span>Cutting</span>
                      <span>{formatCurrency(costCalculation.cuttingCharge)}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <span>Printing</span>
                      <span>{formatCurrency(costCalculation.printingCharge)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <span>Stitching</span>
                      <span>{formatCurrency(costCalculation.stitchingCharge)}</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-md">
                    <div className="flex justify-between items-center">
                      <span>Transport</span>
                      <span>{formatCurrency(costCalculation.transportCharge)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-md">
                  <div className="flex justify-between items-center font-medium">
                    <span>Total Production Cost</span>
                    <span>{formatCurrency(costCalculation.productionCost)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="flex justify-between items-center font-medium">
                <span>Total Cost</span>
                <span>{formatCurrency(costCalculation.totalCost)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="margin">Profit Margin (%)</Label>
              <Input
                id="margin"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={costCalculation.margin}
                onChange={handleMarginChange}
                className="max-w-xs"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Material Cost</Label>
                <div className="font-medium text-lg">{formatCurrency(costCalculation.materialCost)}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Production Cost</Label>
                <div className="font-medium text-lg">{formatCurrency(costCalculation.productionCost)}</div>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground">Total Cost</Label>
                <div className="font-medium text-lg">{formatCurrency(costCalculation.totalCost)}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Margin</Label>
                <div className="font-medium text-lg">{costCalculation.margin}%</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Selling Price</Label>
                <div className="font-medium text-lg text-green-700">{formatCurrency(costCalculation.sellingPrice)}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
