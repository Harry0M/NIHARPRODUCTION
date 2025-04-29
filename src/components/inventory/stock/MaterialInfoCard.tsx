
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
  };
  suppliers: Array<{ id: string; name: string }> | undefined;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
}

export const MaterialInfoCard = ({ formData, suppliers, handleChange, handleSelectChange }: MaterialInfoCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Material Information</CardTitle>
        <CardDescription>Enter details about this material</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="material_type">Material Type</Label>
            <Input
              id="material_type"
              name="material_type"
              value={formData.material_type}
              onChange={handleChange}
              placeholder="Enter material type"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier_id">Supplier (Optional)</Label>
            <Select 
              value={formData.supplier_id} 
              onValueChange={(value) => handleSelectChange('supplier_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {suppliers?.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="color">Color (Optional)</Label>
            <Input
              id="color"
              name="color"
              value={formData.color}
              onChange={handleChange}
              placeholder="Enter color"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="gsm">GSM (Optional)</Label>
            <Input
              id="gsm"
              name="gsm"
              value={formData.gsm}
              onChange={handleChange}
              placeholder="Enter GSM"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
