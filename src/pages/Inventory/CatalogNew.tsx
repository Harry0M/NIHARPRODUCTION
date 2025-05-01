
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ComponentForm } from "@/components/orders/ComponentForm";
import { CustomComponent, CustomComponentSection } from "@/components/orders/CustomComponentSection";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const componentOptions = {
  color: ["Red", "Blue", "Green", "Black", "White", "Yellow", "Brown", "Orange", "Purple", "Gray", "Custom"],
  gsm: ["70", "80", "90", "100", "120", "140", "160", "180", "200", "250", "300", "Custom"]
};

const CatalogNew = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  
  // Product details state
  const [productDetails, setProductDetails] = useState({
    name: "",
    description: "",
    bag_length: "",
    bag_width: "",
    default_quantity: "",
    default_rate: ""
  });
  
  // Standard components state
  const [components, setComponents] = useState<Record<string, any>>({});
  
  // Custom added components state
  const [customComponents, setCustomComponents] = useState<CustomComponent[]>([]);
  
  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleComponentChange = (type: string, field: string, value: string) => {
    setComponents(prev => {
      const component = prev[type] || { 
        id: uuidv4(),
        type 
      };
      return {
        ...prev,
        [type]: {
          ...component,
          [field]: value
        }
      };
    });
  };
  
  const handleCustomComponentChange = (index: number, field: string, value: string) => {
    setCustomComponents(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };
  
  const addCustomComponent = () => {
    setCustomComponents([
      ...customComponents, 
      { 
        id: uuidv4(),
        type: "custom",
        customName: "" 
      }
    ]);
  };
  
  const removeCustomComponent = (index: number) => {
    setCustomComponents(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const { name, bag_length, bag_width } = productDetails;
    if (!name || !bag_length || !bag_width) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required product details",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      // Insert product into catalog table
      const { data: catalogData, error: catalogError } = await supabase
        .from("catalog")
        .insert({
          name,
          description: productDetails.description,
          bag_length: parseFloat(bag_length),
          bag_width: parseFloat(bag_width),
          default_quantity: productDetails.default_quantity ? parseInt(productDetails.default_quantity) : null,
          default_rate: productDetails.default_rate ? parseFloat(productDetails.default_rate) : null,
          created_by: userData.user?.id
        })
        .select('id')
        .single();
      
      if (catalogError) throw catalogError;
      
      // Prepare component data for insertion
      const allComponents = [
        ...Object.values(components).filter(Boolean),
        ...customComponents
      ].filter(Boolean);
      
      if (allComponents.length > 0) {
        const componentsToInsert = allComponents.map(comp => ({
          catalog_id: catalogData.id,
          component_type: comp.type === 'custom' ? comp.customName : comp.type,
          size: comp.length && comp.width ? `${comp.length}x${comp.width}` : null,
          color: comp.color || null,
          gsm: comp.gsm ? parseFloat(comp.gsm) : null,
          custom_name: comp.type === 'custom' ? comp.customName : null,
          // Add new fields
          roll_width: comp.roll_width ? parseFloat(comp.roll_width) : null,
          consumption: comp.consumption ? parseFloat(comp.consumption) : null,
          material_id: comp.material_id !== "not_applicable" ? comp.material_id : null,
          length: comp.length ? parseFloat(comp.length) : null,
          width: comp.width ? parseFloat(comp.width) : null
        }));

        const { error: componentsError } = await supabase
          .from("catalog_components")
          .insert(componentsToInsert);
        
        if (componentsError) {
          console.error("Error saving components:", componentsError);
          toast({
            title: "Error saving components",
            description: componentsError.message,
            variant: "destructive"
          });
        }
      }
      
      toast({
        title: "Product created successfully",
        description: `Product "${name}" has been added to catalog`
      });
      
      // Navigate to the catalog list
      navigate("/inventory/catalog");
      
    } catch (error: any) {
      console.error("Error creating product:", error);
      toast({
        title: "Error creating product",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => navigate("/inventory/catalog")}
            className="gap-1"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Product</h1>
            <p className="text-muted-foreground">Add a new product to your catalog</p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>
              Enter the basic information for this product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter product name"
                  value={productDetails.name}
                  onChange={handleProductChange}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Enter product description"
                  value={productDetails.description}
                  onChange={handleProductChange}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bag_length">Bag Length (inches) *</Label>
                  <Input
                    id="bag_length"
                    name="bag_length"
                    type="number"
                    step="0.01"
                    placeholder="Enter length"
                    value={productDetails.bag_length}
                    onChange={handleProductChange}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="bag_width">Bag Width (inches) *</Label>
                  <Input
                    id="bag_width"
                    name="bag_width"
                    type="number"
                    step="0.01"
                    placeholder="Enter width"
                    value={productDetails.bag_width}
                    onChange={handleProductChange}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="default_quantity">Default Quantity</Label>
                  <Input
                    id="default_quantity"
                    name="default_quantity"
                    type="number"
                    placeholder="Enter default quantity"
                    value={productDetails.default_quantity}
                    onChange={handleProductChange}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="default_rate">Default Rate (₹)</Label>
                  <Input
                    id="default_rate"
                    name="default_rate"
                    type="number"
                    step="0.01"
                    placeholder="Enter default rate"
                    value={productDetails.default_rate}
                    onChange={handleProductChange}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Bag Components</CardTitle>
            <CardDescription>Specify the details for each component of the bag</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-lg font-medium">Standard Components</h2>
                <div className="divide-y divide-border">
                  <ComponentForm
                    title="Part"
                    component={components.part || { type: "part", width: "", length: "", color: "", gsm: "" }}
                    index={0}
                    componentOptions={componentOptions}
                    onChange={(field, value) => handleComponentChange("part", field, value)}
                    handleChange={() => {}}
                    defaultQuantity={productDetails.default_quantity}
                  />
                  
                  <ComponentForm
                    title="Border"
                    component={components.border || { type: "border", width: "", length: "", color: "", gsm: "" }}
                    index={1}
                    componentOptions={componentOptions}
                    onChange={(field, value) => handleComponentChange("border", field, value)}
                    handleChange={() => {}}
                    defaultQuantity={productDetails.default_quantity}
                  />
                  
                  <ComponentForm
                    title="Handle"
                    component={components.handle || { type: "handle", width: "", length: "", color: "", gsm: "" }}
                    index={2}
                    componentOptions={componentOptions}
                    onChange={(field, value) => handleComponentChange("handle", field, value)}
                    handleChange={() => {}}
                    defaultQuantity={productDetails.default_quantity}
                  />
                  
                  <ComponentForm
                    title="Chain"
                    component={components.chain || { type: "chain", width: "", length: "", color: "", gsm: "" }}
                    index={3}
                    componentOptions={componentOptions}
                    onChange={(field, value) => handleComponentChange("chain", field, value)}
                    handleChange={() => {}}
                    defaultQuantity={productDetails.default_quantity}
                  />
                  
                  <ComponentForm
                    title="Runner"
                    component={components.runner || { type: "runner", width: "", length: "", color: "", gsm: "" }}
                    index={4}
                    componentOptions={componentOptions}
                    onChange={(field, value) => handleComponentChange("runner", field, value)}
                    handleChange={() => {}}
                    defaultQuantity={productDetails.default_quantity}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium">Custom Components</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={addCustomComponent}
                  >
                    <Plus size={16} />
                    Add Custom Component
                  </Button>
                </div>
                
                <CustomComponentSection
                  customComponents={customComponents}
                  componentOptions={componentOptions}
                  handleCustomComponentChange={handleCustomComponentChange}
                  removeCustomComponent={removeCustomComponent}
                  defaultQuantity={productDetails.default_quantity}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/inventory/catalog")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save Product"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default CatalogNew;
