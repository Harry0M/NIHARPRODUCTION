
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ComponentCost {
  name: string;
  consumption: number;
  rate: number;
  cost: number;
  materialId?: string;
}

interface CostCalculationFormProps {
  productData: {
    cutting_charge: string;
    printing_charge: string;
    stitching_charge: string;
    transport_charge: string;
    material_cost: string;
    total_cost: string;
    selling_rate: string;
    margin: string;
  };
  componentCosts: ComponentCost[];
  handleProductChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  submitting: boolean;
  onCancel: () => void;
}

const CostCalculationForm: React.FC<CostCalculationFormProps> = ({ 
  productData, 
  componentCosts, 
  handleProductChange,
  submitting,
  onCancel
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Calculation</CardTitle>
        <CardDescription>Specify all costs associated with this product</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Material cost breakdown section */}
          {componentCosts.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-md border mb-4">
              <h3 className="text-sm font-medium mb-2">Material Cost Breakdown</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground">
                  <div>Component</div>
                  <div>Consumption (m)</div>
                  <div>Rate (₹/m)</div>
                  <div>Cost (₹)</div>
                </div>
                {componentCosts.map((item, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2 text-sm">
                    <div>{item.name}</div>
                    <div>{item.consumption.toFixed(2)}</div>
                    <div>₹{item.rate.toFixed(2)}</div>
                    <div className="font-medium">₹{item.cost.toFixed(2)}</div>
                  </div>
                ))}
                <div className="border-t pt-2 grid grid-cols-4 gap-2 text-sm">
                  <div className="col-span-3 text-right font-medium">Total Material Cost:</div>
                  <div className="font-bold">₹{parseFloat(productData.material_cost).toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cutting_charge">Cutting Charge</Label>
              <Input 
                id="cutting_charge" 
                name="cutting_charge"
                type="number"
                step="0.01"
                value={productData.cutting_charge}
                onChange={handleProductChange}
                placeholder="Cutting charge"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="printing_charge">Printing Charge</Label>
              <Input 
                id="printing_charge" 
                name="printing_charge"
                type="number"
                step="0.01"
                value={productData.printing_charge}
                onChange={handleProductChange}
                placeholder="Printing charge"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stitching_charge">Stitching Charge</Label>
              <Input 
                id="stitching_charge" 
                name="stitching_charge"
                type="number"
                step="0.01"
                value={productData.stitching_charge}
                onChange={handleProductChange}
                placeholder="Stitching charge"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transport_charge">Transport Charge</Label>
              <Input 
                id="transport_charge" 
                name="transport_charge"
                type="number"
                step="0.01"
                value={productData.transport_charge}
                onChange={handleProductChange}
                placeholder="Transport charge"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="material_cost">Material Cost</Label>
              <Input 
                id="material_cost" 
                name="material_cost"
                type="number"
                step="0.01"
                value={productData.material_cost}
                onChange={handleProductChange}
                placeholder="Material cost"
                min="0"
                className="bg-slate-50 font-medium"
                readOnly={componentCosts.length > 0}
              />
              <p className="text-xs text-muted-foreground">
                {componentCosts.length > 0 
                  ? "Auto-calculated from component materials and consumption"
                  : "Edit this value directly or link materials to components"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_cost">Total Cost</Label>
              <Input 
                id="total_cost" 
                name="total_cost"
                type="number"
                step="0.01"
                value={productData.total_cost}
                readOnly
                className="bg-muted font-medium"
              />
              <p className="text-xs text-muted-foreground">
                Auto-calculated from all cost components
              </p>
            </div>
          </div>
          
          <div className="border-t pt-4 mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="selling_rate">Selling Rate</Label>
                <Input 
                  id="selling_rate" 
                  name="selling_rate"
                  type="number"
                  step="0.01"
                  value={productData.selling_rate}
                  onChange={handleProductChange}
                  placeholder="Selling price per bag"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="margin">Margin (%)</Label>
                <Input 
                  id="margin" 
                  name="margin"
                  type="number"
                  step="0.01"
                  value={productData.margin}
                  onChange={handleProductChange}
                  placeholder="Profit margin percentage"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Margin is calculated as ((Selling Rate - Total Cost) / Total Cost) × 100
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Product"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CostCalculationForm;
