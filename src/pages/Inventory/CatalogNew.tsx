
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
import { MaterialCostSummary } from "@/components/inventory/MaterialCostSummary";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMaterials } from "@/hooks/use-materials";

const componentOptions = {
  color: ["Red", "Blue", "Green", "Black", "White", "Yellow", "Brown", "Orange", "Purple", "Gray", "Custom"],
  gsm: ["70", "80", "90", "100", "120", "140", "160", "180", "200", "250", "300", "Custom"]
};

const CatalogNew = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const { data: materials } = useMaterials();
  
  // Product details state
  const [productDetails, setProductDetails] = useState({
    name: "",
    description: "",
    bag_length: "",
    bag_width: "",
    default_quantity: "1",
    default_rate: "",
    cutting_charge: "0",
    printing_charge: "0",
    stitching_charge: "0",
    transport_charge: "0",
    total_cost: "0"
  });
  
  // Standard components state
  const [components, setComponents] = useState<Record<string, any>>({});
  
  // Custom added components state
  const [customComponents, setCustomComponents] = useState<CustomComponent[]>([]);
  
  // Track material usages for cost calculation
  const [materialUsages, setMaterialUsages] = useState<Array<{material_id: string, consumption: number}>>([]);
  
  // Update material usages whenever components change
  useEffect(() => {
    const usages: Array<{material_id: string, consumption: number}> = [];
    
    // Add usages from standard components
    Object.values(components).forEach(component => {
      if (component.material_id && component.material_id !== 'not_applicable' && component.consumption) {
        usages.push({
          material_id: component.material_id,
          consumption: parseFloat(component.consumption) || 0
        });
      }
    });
    
    // Add usages from custom components
    customComponents.forEach(component => {
      if (component.material_id && component.material_id !== 'not_applicable' && component.consumption) {
        usages.push({
          material_id: component.material_id,
          consumption: parseFloat(component.consumption.toString()) || 0
        });
      }
    });
    
    setMaterialUsages(usages);
  }, [components, customComponents]);
  
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
  
  const handleTotalCostCalculated = (cost: number) => {
    setProductDetails(prev => ({
      ...prev,
      total_cost: cost.toFixed(2)
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const { name, bag_length, bag_width } = productDetails;
    if (!name || !bag_length || !bag_width) {
      toast.error("Missing required fields", {
        description: "Please fill in all required product details"
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
          default_quantity: productDetails.default_quantity ? parseInt(productDetails.default_quantity) : 1,
          default_rate: productDetails.default_rate ? parseFloat(productDetails.default_rate) : null,
          cutting_charge: parseFloat(productDetails.cutting_charge) || 0,
          printing_charge: parseFloat(productDetails.printing_charge) || 0,
          stitching_charge: parseFloat(productDetails.stitching_charge) || 0,
          transport_charge: parseFloat(productDetails.transport_charge) || 0,
          total_cost: parseFloat(productDetails.total_cost) || null,
          created_by: userData.user?.id
        })
        .select('id')
        .single();
      
      if (catalogError) throw catalogError;
      
      // Prepare component data for insertion with material and consumption info
      const allComponents = [
        ...Object.values(components).filter(Boolean),
        ...customComponents
      ].filter(Boolean);
      
      if (allComponents.length > 0) {
        const componentsToInsert = allComponents.map(comp => ({
          catalog_id: catalogData.id,
          component_type: comp.type === 'custom' ? comp.customName : comp.type,
          length: comp.length ? parseFloat(comp.length) : null,
          width: comp.width ? parseFloat(comp.width) : null,
          size: comp.length && comp.width ? `${comp.length}x${comp.width}` : null,
          color: comp.color || null,
          gsm: comp.gsm ? parseFloat(comp.gsm) : null,
          custom_name: comp.type === 'custom' ? comp.customName : null,
          material_id: comp.material_id !== 'not_applicable' ? comp.material_id : null,
          roll_width: comp.roll_width ? parseFloat(comp.roll_width) : null,
          consumption: comp.consumption ? parseFloat(comp.consumption.toString()) : null
        }));

        const { error: componentsError } = await supabase
          .from("catalog_components")
          .insert(componentsToInsert);
        
        if (componentsError) {
          console.error("Error saving components:", componentsError);
          toast.error("Error saving components", {
            description: componentsError.message
          });
        }
      }
      
      toast.success("Product created successfully", {
        description: `Product "${name}" has been added to catalog`
      });
      
      // Navigate to the catalog list
      navigate("/inventory/catalog");
      
    } catch (error: any) {
      console.error("Error creating product:", error);
      toast.error("Error creating product", {
        description: error.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate production charges
  const cuttingCharge = parseFloat(productDetails.cutting_charge) || 0;
  const printingCharge = parseFloat(productDetails.printing_charge) || 0;
  const stitchingCharge = parseFloat(productDetails.stitching_charge) || 0;
  const transportCharge = parseFloat(productDetails.transport_charge) || 0;
  
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
            <h1 className="text-3xl font-bold tracking-tight">New BOM</h1>
            <p className="text-muted-foreground">Create a new bill of materials</p>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cutting_charge">Cutting Charge (₹)</Label>
                  <Input
                    id="cutting_charge"
                    name="cutting_charge"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={productDetails.cutting_charge}
                    onChange={handleProductChange}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="printing_charge">Printing Charge (₹)</Label>
                  <Input
                    id="printing_charge"
                    name="printing_charge"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={productDetails.printing_charge}
                    onChange={handleProductChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="stitching_charge">Stitching Charge (₹)</Label>
                  <Input
                    id="stitching_charge"
                    name="stitching_charge"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={productDetails.stitching_charge}
                    onChange={handleProductChange}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="transport_charge">Transport Charge (₹)</Label>
                  <Input
                    id="transport_charge"
                    name="transport_charge"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={productDetails.transport_charge}
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
                  {["part", "border", "handle", "chain", "runner"].map((type, index) => (
                    <ComponentForm
                      key={type}
                      title={type.charAt(0).toUpperCase() + type.slice(1)}
                      component={components[type] || { type, width: "", length: "", color: "", material_id: "" }}
                      index={index}
                      componentOptions={componentOptions}
                      onChange={(field, value) => handleComponentChange(type, field, value)}
                      handleChange={() => {}}
                      disableConsumptionFields={type === "chain" || type === "runner"}
                    />
                  ))}
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
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <MaterialCostSummary 
          materialUsages={materialUsages}
          cuttingCharge={cuttingCharge}
          printingCharge={printingCharge}
          stitchingCharge={stitchingCharge}
          transportCharge={transportCharge}
          onTotalCostCalculated={handleTotalCostCalculated}
        />
        
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/inventory/catalog")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save BOM"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CatalogNew;
