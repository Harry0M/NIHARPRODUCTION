
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MaterialUsage, ProductDetails, Material } from "./types";

interface CostCalculationSectionProps {
  usedMaterials: MaterialUsage[];
  materialCost: number;
  totalCost: number;
  productDetails: ProductDetails;
  handleProductChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  allMaterials: Material[];
}

export const CostCalculationSection = ({
  usedMaterials,
  materialCost,
  totalCost,
  productDetails,
  handleProductChange,
  allMaterials
}: CostCalculationSectionProps) => {
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  
  const handleMaterialClick = (materialId: string) => {
    const material = allMaterials.find(m => m.id === materialId);
    if (material) {
      setSelectedMaterial(material);
    }
  };
  
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
                        <td className="px-4 py-2">
                          <button 
                            className="text-left text-blue-600 hover:underline focus:outline-none"
                            onClick={() => handleMaterialClick(material.id)}
                          >
                            {material.name}
                          </button>
                        </td>
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
                    value={productDetails.cutting_charge}
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
                    value={productDetails.printing_charge}
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
                    value={productDetails.stitching_charge}
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
                    value={productDetails.transport_charge}
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
                  <span>₹{parseFloat(productDetails.cutting_charge || '0').toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Printing Charge:</span>
                  <span>₹{parseFloat(productDetails.printing_charge || '0').toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Stitching Charge:</span>
                  <span>₹{parseFloat(productDetails.stitching_charge || '0').toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transport Charge:</span>
                  <span>₹{parseFloat(productDetails.transport_charge || '0').toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>TOTAL PRODUCT COST:</span>
                  <span>₹{totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Material Detail Dialog */}
        <Dialog open={!!selectedMaterial} onOpenChange={(open) => !open && setSelectedMaterial(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Material Details</DialogTitle>
              <DialogDescription>
                Information about selected inventory material
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="max-h-[60vh]">
              {selectedMaterial && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Material Type</label>
                      <p className="font-medium">{selectedMaterial.material_type}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Color</label>
                      <p className="font-medium">{selectedMaterial.color || "N/A"}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">GSM</label>
                      <p className="font-medium">{selectedMaterial.gsm || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Unit</label>
                      <p className="font-medium">{selectedMaterial.unit}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Purchase Price</label>
                      <p className="font-medium">₹{selectedMaterial.purchase_price}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Selling Price</label>
                      <p className="font-medium">{selectedMaterial.selling_price ? `₹${selectedMaterial.selling_price}` : "N/A"}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Current Quantity</label>
                      <p className="font-medium">{selectedMaterial.quantity} {selectedMaterial.unit}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Reorder Level</label>
                      <p className="font-medium">{selectedMaterial.reorder_level || "N/A"}</p>
                    </div>
                  </div>
                  
                  {selectedMaterial.alternate_unit && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground">Alternate Unit</label>
                        <p className="font-medium">{selectedMaterial.alternate_unit}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Conversion Rate</label>
                        <p className="font-medium">{selectedMaterial.conversion_rate}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
