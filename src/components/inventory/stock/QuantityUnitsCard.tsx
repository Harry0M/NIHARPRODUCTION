
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
  };
  unitOptions: string[];
  handleChange: (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: string } }) => void;
  handleSelectChange: (name: string, value: string) => void;
}

export const QuantityUnitsCard = ({ formData, unitOptions, handleChange, handleSelectChange }: QuantityUnitsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quantity & Units</CardTitle>
        <CardDescription>Set quantity and unit information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="0"
              step="0.01"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="Available quantity"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Main Unit *</Label>
            <Select 
              value={formData.unit} 
              onValueChange={(value) => handleSelectChange('unit', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {unitOptions.map(unit => (
                  <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                ))}
                <SelectItem value="custom">Custom...</SelectItem>
              </SelectContent>
            </Select>
            {formData.unit === 'custom' && (
              <Input
                className="mt-2"
                name="unit"
                value={formData.unit === 'custom' ? '' : formData.unit}
                onChange={handleChange}
                placeholder="Enter custom unit"
              />
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="alternate_unit">Alternate Unit</Label>
            <Select 
              value={formData.alternate_unit} 
              onValueChange={(value) => handleSelectChange('alternate_unit', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select alternate unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {unitOptions.map(unit => (
                  <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                ))}
                <SelectItem value="custom">Custom...</SelectItem>
              </SelectContent>
            </Select>
            {formData.alternate_unit === 'custom' && (
              <Input
                className="mt-2"
                name="alternate_unit"
                value={formData.alternate_unit === 'custom' ? '' : formData.alternate_unit}
                onChange={handleChange}
                placeholder="Enter custom unit"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="conversion_rate">Conversion Rate</Label>
            <Input
              id="conversion_rate"
              name="conversion_rate"
              type="number"
              min="0.000001"
              step="0.000001"
              value={formData.conversion_rate}
              onChange={handleChange}
              placeholder="1 main unit = ? alternate units"
              disabled={!formData.alternate_unit || formData.alternate_unit === 'none'}
            />
            {formData.unit && formData.alternate_unit && formData.alternate_unit !== 'none' && formData.conversion_rate && (
              <p className="text-xs text-muted-foreground mt-1">
                1 {formData.unit} = {formData.conversion_rate} {formData.alternate_unit}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
