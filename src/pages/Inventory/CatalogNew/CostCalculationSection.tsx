
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductDetails, Material, MaterialUsage } from "./types";

interface CostCalculationSectionProps {
  usedMaterials: MaterialUsage[];
  materialCost: number;
  totalCost: number;
  productDetails: ProductDetails;
  handleProductChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  allMaterials: Material[];
}

export function CostCalculationSection({ 
  usedMaterials, 
  materialCost, 
  totalCost,
  productDetails,
  handleProductChange
}: CostCalculationSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Calculation</CardTitle>
        <CardDescription>Detailed breakdown of product costs</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Materials used breakdown */}
          <div>
            <h3 className="font-medium mb-3">Materials Used</h3>
            {usedMaterials.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Material</th>
                      <th className="px-4 py-2 text-left font-medium">Quantity</th>
                      <th className="px-4 py-2 text-right font-medium">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usedMaterials.map((material, index) => (
                      <tr key={material.id} className={index % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
                        <td className="px-4 py-2">{material.name}</td>
                        <td className="px-4 py-2">{material.quantity.toFixed(2)} {material.unit}</td>
                        <td className="px-4 py-2 text-right">
                          ₹{material.cost.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t">
                      <td className="px-4 py-2 font-medium" colSpan={2}>Total Material Cost:</td>
                      <td className="px-4 py-2 text-right font-medium">₹{materialCost.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-muted-foreground italic text-center py-4 border rounded-md">
                No materials selected for this product
              </div>
            )}
          </div>

          {/* Additional charges */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium">Additional Charges</h3>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="cutting_charge">Cutting Charge (₹)</Label>
                  <Input
                    id="cutting_charge"
                    name="cutting_charge"
                    type="number"
                    step="0.01"
                    value={Number(productDetails.cutting_charge || 0).toString()}
                    onChange={handleProductChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="printing_charge">Printing Charge (₹)</Label>
                  <Input
                    id="printing_charge"
                    name="printing_charge"
                    type="number"
                    step="0.01"
                    value={Number(productDetails.printing_charge || 0).toString()}
                    onChange={handleProductChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stitching_charge">Stitching Charge (₹)</Label>
                  <Input
                    id="stitching_charge"
                    name="stitching_charge"
                    type="number"
                    step="0.01"
                    value={Number(productDetails.stitching_charge || 0).toString()}
                    onChange={handleProductChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="transport_charge">Transport Charge (₹)</Label>
                  <Input
                    id="transport_charge"
                    name="transport_charge"
                    type="number"
                    step="0.01"
                    value={Number(productDetails.transport_charge || 0).toString()}
                    onChange={handleProductChange}
                  />
                </div>
              </div>
            </div>

            {/* Total cost summary */}
            <div className="space-y-4">
              <h3 className="font-medium">Cost Summary</h3>
              <div className="border rounded-md p-4 bg-muted/20 space-y-3">
                <div className="flex justify-between">
                  <span>Material Cost:</span>
                  <span className="font-medium">₹{materialCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cutting Charge:</span>
                  <span>₹{Number(productDetails.cutting_charge || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Printing Charge:</span>
                  <span>₹{Number(productDetails.printing_charge || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Stitching Charge:</span>
                  <span>₹{Number(productDetails.stitching_charge || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transport Charge:</span>
                  <span>₹{Number(productDetails.transport_charge || 0).toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>TOTAL PRODUCT COST:</span>
                  <span>₹{totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
