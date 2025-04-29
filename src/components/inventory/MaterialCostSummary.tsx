
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const [totalMaterialCost, setTotalMaterialCost] = useState(0);
  
  // Fetch material details for cost calculation
  const { data: materials } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('id, material_type, purchase_price, selling_price');
      
      if (error) throw error;
      return data;
    },
  });
  
  // Calculate material costs whenever usages or materials change
  useEffect(() => {
    if (!materials || materialUsages.length === 0) {
      setTotalMaterialCost(0);
      return;
    }
    
    let totalCost = 0;
    
    materialUsages.forEach(usage => {
      const material = materials.find(m => m.id === usage.material_id);
      if (material && material.purchase_price) {
        // Use purchase price for cost calculation
        const cost = material.purchase_price * usage.consumption;
        totalCost += cost;
      }
    });
    
    setTotalMaterialCost(totalCost);
  }, [materials, materialUsages]);
  
  // Calculate total cost and report back to parent
  useEffect(() => {
    const totalCost = totalMaterialCost + cuttingCharge + printingCharge + stitchingCharge + transportCharge;
    
    if (onTotalCostCalculated) {
      onTotalCostCalculated(totalCost);
    }
  }, [totalMaterialCost, cuttingCharge, printingCharge, stitchingCharge, transportCharge, onTotalCostCalculated]);
  
  // Calculate the sum of all production charges
  const totalProductionCharges = cuttingCharge + printingCharge + stitchingCharge + transportCharge;
  const grandTotal = totalMaterialCost + totalProductionCharges;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Summary</CardTitle>
        <CardDescription>
          Estimated costs for production
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Material Costs</h3>
              <p className="text-lg font-semibold">₹{totalMaterialCost.toFixed(2)}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Production Charges</h3>
              <p className="text-lg font-semibold">₹{totalProductionCharges.toFixed(2)}</p>
            </div>
            
            <div className="col-span-2">
              <div className="flex items-center justify-between border-t pt-4 mt-4">
                <h3 className="text-base font-medium">Total Cost</h3>
                <p className="text-xl font-bold">₹{grandTotal.toFixed(2)}</p>
              </div>
              
              <div className="mt-2 text-xs text-muted-foreground">
                <p>* Costs are estimates and may vary based on actual materials used and production time</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
