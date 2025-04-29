
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MaterialInfoCardProps {
  formData: {
    material_type: string;
    color: string;
    gsm: string;
    supplier_id: string;
    reorder_level: string;
  };
  suppliers: any[] | undefined;
  handleChange: (e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: string } }) => void;
  handleSelectChange: (name: string, value: string) => void;
}

export const MaterialInfoCard = ({ formData, suppliers, handleChange, handleSelectChange }: MaterialInfoCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Material Information</CardTitle>
        <CardDescription>Enter the basic information for this material</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="material_type">Material Name/Type *</Label>
            <Input
              id="material_type"
              name="material_type"
              value={formData.material_type}
              onChange={handleChange}
              placeholder="Enter material name or type"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier_id">Supplier</Label>
            <Select 
              value={formData.supplier_id} 
              onValueChange={(value) => handleSelectChange('supplier_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {suppliers?.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Input
              id="color"
              name="color"
              value={formData.color}
              onChange={handleChange}
              placeholder="Material color"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gsm">GSM</Label>
            <Input
              id="gsm"
              name="gsm"
              value={formData.gsm}
              onChange={handleChange}
              placeholder="GSM value"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reorder_level">Reorder Level</Label>
            <Input
              id="reorder_level"
              name="reorder_level"
              type="number"
              min="0"
              step="0.01"
              value={formData.reorder_level}
              onChange={handleChange}
              placeholder="Minimum quantity threshold"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
