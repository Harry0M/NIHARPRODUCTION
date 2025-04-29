
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

type StockFormData = {
  material_type: string;
  color: string;
  gsm: string;
  quantity: string;
  unit: string;
  alternate_unit: string;
  conversion_rate: string;
  purchase_price: string;
  selling_price: string;
  track_cost: boolean;
  supplier_id: string;
  reorder_level: string;
}

const StockJournalForm = ({ id }: { id?: string }) => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<StockFormData>({
    material_type: "",
    color: "",
    gsm: "",
    quantity: "0",
    unit: "Meters",
    alternate_unit: "",
    conversion_rate: "1",
    purchase_price: "",
    selling_price: "",
    track_cost: false,
    supplier_id: "",
    reorder_level: "",
  });

  const { data: suppliers, isLoading: loadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('status', 'active');

      if (error) throw error;
      return data;
    },
  });

  // Fetch stock data if editing
  useQuery({
    queryKey: ['inventory', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      
      setFormData({
        material_type: data.material_type || "",
        color: data.color || "",
        gsm: data.gsm || "",
        quantity: data.quantity?.toString() || "0",
        unit: data.unit || "Meters",
        alternate_unit: data.alternate_unit || "",
        conversion_rate: data.conversion_rate?.toString() || "1",
        purchase_price: data.purchase_price?.toString() || "",
        selling_price: data.selling_price?.toString() || "",
        track_cost: data.track_cost || false,
        supplier_id: data.supplier_id || "",
        reorder_level: data.reorder_level?.toString() || "",
      });
      
      return data;
    },
    enabled: !!id,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.material_type || !formData.unit) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    
    try {
      const stockData = {
        material_type: formData.material_type,
        color: formData.color || null,
        gsm: formData.gsm || null,
        quantity: parseFloat(formData.quantity) || 0,
        unit: formData.unit,
        alternate_unit: formData.alternate_unit || null,
        conversion_rate: parseFloat(formData.conversion_rate) || 1,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
        selling_price: formData.selling_price ? parseFloat(formData.selling_price) : null,
        track_cost: formData.track_cost,
        supplier_id: formData.supplier_id || null,
        reorder_level: formData.reorder_level ? parseFloat(formData.reorder_level) : null,
      };
      
      if (id) {
        // Update existing stock
        const { error } = await supabase
          .from('inventory')
          .update(stockData)
          .eq('id', id);
          
        if (error) throw error;
        
        toast.success("Stock updated successfully");
      } else {
        // Create new stock
        const { error } = await supabase
          .from('inventory')
          .insert([stockData]);
          
        if (error) throw error;
        
        toast.success("Stock added successfully");
      }
      
      navigate('/inventory/stock');
    } catch (error: any) {
      console.error('Error saving stock:', error);
      toast.error(`Failed to save stock: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const unitOptions = ["Meters", "Kilograms", "Pieces", "Rolls", "Yards", "Inches", "Centimeters"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => navigate("/inventory/stock")}
            className="gap-1"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{id ? 'Edit Stock' : 'Add Stock'}</h1>
            <p className="text-muted-foreground">{id ? 'Update stock details' : 'Add new stock to inventory'}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
                    <SelectItem value="">None</SelectItem>
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
                    <SelectItem value="">None</SelectItem>
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
                  disabled={!formData.alternate_unit}
                />
                {formData.unit && formData.alternate_unit && formData.conversion_rate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    1 {formData.unit} = {formData.conversion_rate} {formData.alternate_unit}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

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
      </form>
    </div>
  );
};

export default StockJournalForm;
