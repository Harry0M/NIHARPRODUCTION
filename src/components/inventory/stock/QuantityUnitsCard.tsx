
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface QuantityUnitsCardProps {
  formData: {
    quantity: string;
    unit: string;
    alternate_unit: string;
    conversion_rate: string;
    reorder_level: string;
  };
  unitOptions: string[];
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
}

export const QuantityUnitsCard = ({ formData, unitOptions, handleChange, handleSelectChange }: QuantityUnitsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quantity & Units</CardTitle>
        <CardDescription>Set quantity information and unit conversion</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Current Quantity</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="0"
              step="0.01"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="Enter current quantity"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reorder_level">Reorder Level (Optional)</Label>
            <Input
              id="reorder_level"
              name="reorder_level"
              type="number"
              min="0"
              step="0.01"
              value={formData.reorder_level}
              onChange={handleChange}
              placeholder="Quantity at which to reorder"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="unit">Main Unit</Label>
            <Select 
              value={formData.unit} 
              onValueChange={(value) => handleSelectChange('unit', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {unitOptions.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="alternate_unit">Alternate Unit (Optional)</Label>
            <Select 
              value={formData.alternate_unit} 
              onValueChange={(value) => handleSelectChange('alternate_unit', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select alternate unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {unitOptions.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {formData.alternate_unit && (
          <div className="space-y-2">
            <Label htmlFor="conversion_rate">Conversion Rate ({formData.unit} to {formData.alternate_unit})</Label>
            <Input
              id="conversion_rate"
              name="conversion_rate"
              type="number"
              min="0.0001"
              step="0.0001"
              value={formData.conversion_rate}
              onChange={handleChange}
              placeholder={`1 ${formData.unit} = ? ${formData.alternate_unit}`}
              required={!!formData.alternate_unit}
            />
            <p className="text-sm text-muted-foreground">
              Example: If 1 {formData.unit} = 2.54 {formData.alternate_unit}, enter 2.54
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
