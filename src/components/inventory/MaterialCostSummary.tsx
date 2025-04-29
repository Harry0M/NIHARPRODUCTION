
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMaterials } from "@/hooks/use-materials";
import { useEffect, useState } from "react";

interface MaterialUsage {
  material_id: string;
  consumption: number;
}

interface MaterialCostSummaryProps {
  materialUsages: MaterialUsage[];
  cuttingCharge: number;
  printingCharge: number;
  stitchingCharge: number;
  transportCharge: number;
  onTotalCostCalculated?: (cost: number) => void;
}

export const MaterialCostSummary = ({ 
  materialUsages, 
  cuttingCharge,
  printingCharge,
  stitchingCharge,
  transportCharge,
  onTotalCostCalculated 
}: MaterialCostSummaryProps) => {
  const { data: materials, isLoading } = useMaterials();
  const [totalMaterialCost, setTotalMaterialCost] = useState(0);
  
  useEffect(() => {
    if (!materials || !materialUsages?.length) {
      setTotalMaterialCost(0);
      return;
    }
    
    // Calculate total material cost
    let cost = 0;
    
    materialUsages.forEach(usage => {
      const material = materials.find(m => m.id === usage.material_id);
      if (material && material.purchase_price) {
        cost += usage.consumption * material.purchase_price;
      }
    });
    
    setTotalMaterialCost(cost);
    
    // Calculate and report total cost
    const totalCost = cost + cuttingCharge + printingCharge + stitchingCharge + transportCharge;
    if (onTotalCostCalculated) {
      onTotalCostCalculated(totalCost);
    }
  }, [materials, materialUsages, cuttingCharge, printingCharge, stitchingCharge, transportCharge, onTotalCostCalculated]);
  
  const productionCharges = cuttingCharge + printingCharge + stitchingCharge + transportCharge;
  const grandTotal = totalMaterialCost + productionCharges;
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost Summary</CardTitle>
          <CardDescription>Loading cost data...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-t-primary animate-spin rounded-full"></div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Summary</CardTitle>
        <CardDescription>Breakdown of material and production costs</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Materials</h3>
            {materialUsages.length > 0 ? (
              <div className="space-y-2">
                {materialUsages.map((usage, index) => {
                  const material = materials?.find(m => m.id === usage.material_id);
                  if (!material) return null;
                  
                  const cost = material.purchase_price ? material.purchase_price * usage.consumption : 0;
                  
                  return (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <span className="font-medium">{material.material_type}</span>
                        {material.color && <span className="text-muted-foreground ml-1">({material.color})</span>}
                      </div>
                      <div className="flex-1 text-center">
                        <span>{usage.consumption.toFixed(2)} {material.unit}</span>
                      </div>
                      <div className="flex-1 text-right">
                        {material.purchase_price ? (
                          <span>₹{cost.toFixed(2)}</span>
                        ) : (
                          <span className="text-muted-foreground">No price set</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between pt-2 border-t text-sm font-medium">
                  <span>Total Material Cost</span>
                  <span>₹{totalMaterialCost.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">No materials selected</div>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Production Charges</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Cutting Charge</span>
                <span>₹{cuttingCharge.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Printing Charge</span>
                <span>₹{printingCharge.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Stitching Charge</span>
                <span>₹{stitchingCharge.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Transport Charge</span>
                <span>₹{transportCharge.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t font-medium">
                <span>Total Production Charges</span>
                <span>₹{productionCharges.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Grand Total</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
