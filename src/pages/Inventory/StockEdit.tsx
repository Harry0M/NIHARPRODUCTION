
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, SaveIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const StockEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    material_type: "",
    color: "",
    gsm: "",
    quantity: "",
    reorder_level: "",
    unit: "",
    alternate_unit: "",
    conversion_rate: "1",
    supplier_id: "",
    track_cost: false,
    purchase_price: "",
    selling_price: "",
  });
  
  // Fetch inventory item data
  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });
  
  // Fetch suppliers for dropdown
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('status', 'active')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
  
  // Set form data from fetched inventory
  useEffect(() => {
    if (inventory) {
      setFormData({
        material_type: inventory.material_type || "",
        color: inventory.color || "",
        gsm: inventory.gsm || "",
        quantity: inventory.quantity?.toString() || "",
        reorder_level: inventory.reorder_level?.toString() || "",
        unit: inventory.unit || "",
        alternate_unit: inventory.alternate_unit || "",
        conversion_rate: inventory.conversion_rate?.toString() || "1",
        supplier_id: inventory.supplier_id || "",
        track_cost: inventory.track_cost || false,
        purchase_price: inventory.purchase_price?.toString() || "",
        selling_price: inventory.selling_price?.toString() || "",
      });
    }
  }, [inventory]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (name: string) => (checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Convert string values to numbers for the database
      const dataToSubmit = {
        material_type: formData.material_type,
        color: formData.color || null,
        gsm: formData.gsm || null,
        quantity: parseFloat(formData.quantity),
        reorder_level: formData.reorder_level ? parseFloat(formData.reorder_level) : null,
        unit: formData.unit,
        alternate_unit: formData.alternate_unit || null,
        conversion_rate: formData.conversion_rate ? parseFloat(formData.conversion_rate) : 1,
        supplier_id: formData.supplier_id || null,
        track_cost: formData.track_cost,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
        selling_price: formData.selling_price ? parseFloat(formData.selling_price) : null,
      };
      
      const { error } = await supabase
        .from('inventory')
        .update(dataToSubmit)
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Inventory Updated",
        description: "The inventory item has been successfully updated.",
      });
      
      // Navigate back to inventory detail page
      navigate(`/inventory/stock/${id}`);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update inventory item",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!inventory) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Inventory Not Found</CardTitle>
          <CardDescription>The requested inventory item could not be found.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" onClick={() => navigate('/inventory/stock')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Stock List
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Edit Inventory Item</CardTitle>
            <Button variant="outline" onClick={() => navigate(`/inventory/stock/${id}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>
          <CardDescription>
            Update the details of this inventory item.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="material_type">Material Type</Label>
                <Input
                  id="material_type"
                  name="material_type"
                  value={formData.material_type}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="color">Color (Optional)</Label>
                <Input
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gsm">GSM (Optional)</Label>
                <Input
                  id="gsm"
                  name="gsm"
                  value={formData.gsm}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supplier_id">Supplier (Optional)</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={handleSelectChange("supplier_id")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a supplier" />
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
            
            {/* Inventory Management Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Inventory Management</h3>
              
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reorder_level">Reorder Level (Optional)</Label>
                <Input
                  id="reorder_level"
                  name="reorder_level"
                  type="number"
                  step="0.01"
                  value={formData.reorder_level}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="alternate_unit">Alternate Unit (Optional)</Label>
                <Input
                  id="alternate_unit"
                  name="alternate_unit"
                  value={formData.alternate_unit}
                  onChange={handleChange}
                />
              </div>
              
              {formData.alternate_unit && (
                <div className="space-y-2">
                  <Label htmlFor="conversion_rate">Conversion Rate (1:{formData.conversion_rate})</Label>
                  <Input
                    id="conversion_rate"
                    name="conversion_rate"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.conversion_rate}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    How many primary units equal one alternate unit
                  </p>
                </div>
              )}
            </div>
            
            {/* Cost Tracking Section */}
            <div className="space-y-4 col-span-1 md:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Cost Tracking</h3>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="track_cost" className="cursor-pointer">Enable Cost Tracking</Label>
                  <Switch
                    id="track_cost"
                    checked={formData.track_cost}
                    onCheckedChange={handleSwitchChange("track_cost")}
                  />
                </div>
              </div>
              
              {formData.track_cost && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchase_price">Purchase Price</Label>
                    <Input
                      id="purchase_price"
                      name="purchase_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.purchase_price}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="selling_price">Selling Price (Optional)</Label>
                    <Input
                      id="selling_price"
                      name="selling_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.selling_price}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex justify-end w-full gap-2">
            <Button variant="outline" type="button" onClick={() => navigate(`/inventory/stock/${id}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
              {!submitting && <SaveIcon className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
};

export default StockEdit;
