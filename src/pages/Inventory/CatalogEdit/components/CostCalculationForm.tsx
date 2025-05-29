
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface CostCalculationFormProps {
  productData: {
    cutting_charge: string;
    printing_charge: string;
    stitching_charge: string;
    transport_charge: string;
    material_cost: string;
    total_cost: string;
  };
  componentCosts: number;
  handleProductChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
        <CardTitle>Cost Breakdown</CardTitle>
        <CardDescription>
          Configure the cost structure for this product
          {componentCosts > 0 && (
            <span className="block mt-1 text-sm font-medium text-blue-600">
              Calculated Material Cost: ₹{componentCosts.toFixed(2)}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
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
            />
          </div>
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
            <Label htmlFor="total_cost">Total Cost</Label>
            <Input 
              id="total_cost" 
              name="total_cost"
              type="number"
              step="0.01"
              value={productData.total_cost}
              readOnly
              className="bg-slate-50"
            />
            <p className="text-xs text-muted-foreground">
              Sum of material cost and all charges
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="gap-1">
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Update Product</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CostCalculationForm;
