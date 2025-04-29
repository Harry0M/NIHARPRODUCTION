
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface CostInfoCardProps {
  formData: {
    track_cost: boolean;
    purchase_price: string;
    selling_price: string;
  };
  id?: string;
  submitting: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCheckboxChange: (name: string, checked: boolean) => void;
}

export const CostInfoCard = ({ formData, id, submitting, handleChange, handleCheckboxChange }: CostInfoCardProps) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Information</CardTitle>
        <CardDescription>Track costs for this material</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch 
            id="track_cost" 
            checked={formData.track_cost} 
            onCheckedChange={(checked) => handleCheckboxChange('track_cost', checked)}
          />
          <Label htmlFor="track_cost">Enable Cost Tracking</Label>
        </div>

        {formData.track_cost && (
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_price">Purchase Price</Label>
              <Input
                id="purchase_price"
                name="purchase_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.purchase_price}
                onChange={handleChange}
                placeholder="Purchase price per unit"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="selling_price">Selling Price</Label>
              <Input
                id="selling_price"
                name="selling_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.selling_price}
                onChange={handleChange}
                placeholder="Selling price per unit"
              />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/inventory/stock")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <span className="animate-spin mr-2">⌛</span>
                Saving...
              </>
            ) : id ? (
              'Update Stock'
            ) : (
              'Add Stock'
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
