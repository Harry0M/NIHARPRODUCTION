
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMaterials } from "@/hooks/use-materials";

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
  cuttingCharge = 0,
  printingCharge = 0,
  stitchingCharge = 0,
  transportCharge = 0,
  onTotalCostCalculated
}: MaterialCostSummaryProps) => {
  const { data: materials } = useMaterials();
  
  // Calculate total material cost
  let totalMaterialCost = 0;
  const materialCosts = materialUsages
    .filter(item => item.material_id && item.material_id !== 'not_applicable' && item.consumption)
    .map(item => {
      const material = materials?.find(m => m.id === item.material_id);
      if (!material || !material.purchase_price) {
        return {
          id: item.material_id,
          name: material?.material_type || 'Unknown Material',
          unit: material?.unit || '-',
          consumption: item.consumption,
          price: 0,
          cost: 0
        };
      }
      
      const cost = item.consumption * material.purchase_price;
      totalMaterialCost += cost;
      
      return {
        id: item.material_id,
        name: material.material_type,
        unit: material.unit,
        consumption: item.consumption,
        price: material.purchase_price,
        cost
      };
    });
  
  // Calculate total cost including all charges
  const totalProductionCharges = cuttingCharge + printingCharge + stitchingCharge + transportCharge;
  const grandTotal = totalMaterialCost + totalProductionCharges;
  
  // Call the onTotalCostCalculated callback if provided
  React.useEffect(() => {
    if (onTotalCostCalculated) {
      onTotalCostCalculated(grandTotal);
    }
  }, [grandTotal, onTotalCostCalculated]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Material Costs</h3>
            {materialCosts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Consumption</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Price/Unit</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialCosts.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.consumption.toFixed(4)}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>₹{item.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹{item.cost.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={4} className="font-medium">Total Material Cost</TableCell>
                    <TableCell className="text-right font-medium">₹{totalMaterialCost.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No material costs to display.</p>
            )}
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Production Charges</h3>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>Cutting Charge</TableCell>
                  <TableCell className="text-right">₹{cuttingCharge.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Printing Charge</TableCell>
                  <TableCell className="text-right">₹{printingCharge.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Stitching Charge</TableCell>
                  <TableCell className="text-right">₹{stitchingCharge.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Transport Charge</TableCell>
                  <TableCell className="text-right">₹{transportCharge.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Total Production Charges</TableCell>
                  <TableCell className="text-right font-medium">₹{totalProductionCharges.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-lg font-medium">
              <span>Grand Total</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
