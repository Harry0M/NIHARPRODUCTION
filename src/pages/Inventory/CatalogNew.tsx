
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StandardComponents } from "@/components/orders/StandardComponents";
import { CustomComponentSection } from "@/components/orders/CustomComponentSection";
import { v4 as uuidv4 } from "uuid";

const componentOptions = {
  color: ["Red", "Blue", "Green", "Black", "White", "Yellow", "Brown", "Orange", "Purple", "Gray", "Custom"],
  // GSM has been completely removed
};

interface ComponentType {
  id: string;
  type: string;
  customName?: string;
  color?: string;
  // Removed gsm field
  length?: string;
  width?: string;
  roll_width?: string;
  material_id?: string;
}

const CatalogNew = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  
  const [productData, setProductData] = useState({
    name: "",
    description: "",
    bag_length: "",
    bag_width: "",
    border_dimension: "", 
    default_quantity: "",
    default_rate: "",
    selling_rate: "",
    margin: "",
    // New cost fields
    cutting_charge: "0",
    printing_charge: "0",
    stitching_charge: "0",
    transport_charge: "0",
    material_cost: "0", // This will be calculated based on components
    total_cost: "0"     // This will be the sum of all costs
  });
  
  const [components, setComponents] = useState<Record<string, any>>({});
  const [customComponents, setCustomComponents] = useState<ComponentType[]>([]);

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductData(prev => {
      const updatedData = {
        ...prev,
        [name]: value
      };
      
      // Calculate total cost whenever cost-related fields change
      if (['cutting_charge', 'printing_charge', 'stitching_charge', 'transport_charge', 'material_cost'].includes(name)) {
        const totalCost = calculateTotalCost({
          ...updatedData
        });
        
        updatedData.total_cost = totalCost.toString();
        
        // If selling_rate exists, update margin
        if (updatedData.selling_rate && parseFloat(updatedData.selling_rate) > 0 && totalCost > 0) {
          const calculatedMargin = ((parseFloat(updatedData.selling_rate) - totalCost) / totalCost) * 100;
          updatedData.margin = calculatedMargin.toFixed(2);
        }
      }

      // Calculate margin when selling_rate changes
      if (name === "selling_rate") {
        const totalCost = parseFloat(updatedData.total_cost);
        const sellingRate = parseFloat(value);
        
        if (!isNaN(totalCost) && !isNaN(sellingRate) && totalCost > 0) {
          const calculatedMargin = ((sellingRate - totalCost) / totalCost) * 100;
          updatedData.margin = calculatedMargin.toFixed(2);
        }
      }
      
      // Update selling_rate when margin changes
      if (name === "margin") {
        const totalCost = parseFloat(updatedData.total_cost);
        const marginValue = parseFloat(value);
        
        if (!isNaN(totalCost) && !isNaN(marginValue) && totalCost > 0) {
          const calculatedSellingRate = totalCost * (1 + (marginValue / 100));
          updatedData.selling_rate = calculatedSellingRate.toFixed(2);
        }
      }
      
      return updatedData;
    });
  };
  
  // Function to calculate total cost
  const calculateTotalCost = (data: typeof productData) => {
    const cuttingCharge = parseFloat(data.cutting_charge) || 0;
    const printingCharge = parseFloat(data.printing_charge) || 0;
    const stitchingCharge = parseFloat(data.stitching_charge) || 0;
    const transportCharge = parseFloat(data.transport_charge) || 0;
    const materialCost = parseFloat(data.material_cost) || 0;
    
    return cuttingCharge + printingCharge + stitchingCharge + transportCharge + materialCost;
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

  const validateForm = () => {
    if (!productData.name) {
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive"
      });
      return false;
    }
    
    if (!productData.bag_length || parseFloat(productData.bag_length) <= 0) {
      toast({
        title: "Validation Error",
        description: "Valid bag length is required",
        variant: "destructive"
      });
      return false;
    }
    
    if (!productData.bag_width || parseFloat(productData.bag_width) <= 0) {
      toast({
        title: "Validation Error",
        description: "Valid bag width is required",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Format the name to include quantity if default_quantity is provided
      let formattedName = productData.name;
      if (productData.default_quantity) {
        formattedName = `${productData.name}*${productData.default_quantity}`;
      }
      
      // Calculate the final total cost
      const totalCost = calculateTotalCost(productData);
      
      // Prepare product data with formatted name and all cost fields
      const productDbData = {
        name: formattedName,
        description: productData.description || null,
        bag_length: parseFloat(productData.bag_length),
        bag_width: parseFloat(productData.bag_width),
        border_dimension: productData.border_dimension ? parseFloat(productData.border_dimension) : 0,
        default_quantity: productData.default_quantity ? parseInt(productData.default_quantity) : null,
        default_rate: productData.default_rate ? parseFloat(productData.default_rate) : null,
        selling_rate: productData.selling_rate ? parseFloat(productData.selling_rate) : null,
        margin: productData.margin ? parseFloat(productData.margin) : null,
        // Add all the new cost fields
        cutting_charge: parseFloat(productData.cutting_charge) || 0,
        printing_charge: parseFloat(productData.printing_charge) || 0,
        stitching_charge: parseFloat(productData.stitching_charge) || 0,
        transport_charge: parseFloat(productData.transport_charge) || 0,
        total_cost: totalCost
      };
      
      // Insert the product
      const { data: productResult, error: productError } = await supabase
        .from("catalog")
        .insert(productDbData)
        .select('id')
        .single();
      
      if (productError) {
        throw productError;
      }
      
      // Process components
      const allComponents = [
        ...Object.values(components).filter(Boolean),
        ...customComponents.filter(comp => comp.customName || comp.color || comp.length || comp.width || comp.roll_width)
      ];
      
      if (allComponents.length > 0) {
        const componentsToInsert = allComponents.map(comp => ({
          catalog_id: productResult.id,
          component_type: comp.type === 'custom' ? comp.customName || 'custom' : comp.type,
          size: comp.length && comp.width ? `${comp.length}x${comp.width}` : null,
          color: comp.color || null,
          gsm: null, // Always set GSM to null as we don't need it
          roll_width: comp.roll_width || null,
          length: comp.length || null,
          width: comp.width || null,
          custom_name: comp.type === 'custom' ? comp.customName : null,
          material_id: comp.material_id || null,
          material_linked: comp.material_id ? true : false
        }));

        // Insert components
        const { error: componentsError } = await supabase
          .from("catalog_components")
          .insert(componentsToInsert);
        
        if (componentsError) {
          throw componentsError;
        }
      }
      
      toast({
        title: "Product created successfully",
        description: `${formattedName} has been added to the catalog`
      });

      navigate("/inventory/catalog");
      
    } catch (error: any) {
      toast({
        title: "Error creating product",
        description: error.message || "An unexpected error occurred",
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
            <h1 className="text-2xl font-bold tracking-tight">Add New Product</h1>
            <p className="text-muted-foreground">Create a new catalog product template</p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Product Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>Enter the basic information for this product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="name" 
                name="name"
                value={productData.name}
                onChange={handleProductChange}
                placeholder="Enter product name"
                required
              />
              <p className="text-xs text-muted-foreground">
                Product name without quantity (e.g., "Test Bag"). Quantity will be automatically appended if provided below.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description"
                value={productData.description}
                onChange={handleProductChange}
                placeholder="Enter product description"
                rows={3}
              />
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bag_length">
                  Bag Length (inches) <span className="text-destructive">*</span>
                </Label>
                <Input 
                  id="bag_length" 
                  name="bag_length"
                  type="number"
                  step="0.01"
                  value={productData.bag_length}
                  onChange={handleProductChange}
                  placeholder="Length in inches"
                  required
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bag_width">
                  Bag Width (inches) <span className="text-destructive">*</span>
                </Label>
                <Input 
                  id="bag_width" 
                  name="bag_width"
                  type="number"
                  step="0.01"
                  value={productData.bag_width}
                  onChange={handleProductChange}
                  placeholder="Width in inches"
                  required
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="border_dimension">
                  Border Dimension / Height (inches)
                </Label>
                <Input 
                  id="border_dimension" 
                  name="border_dimension"
                  type="number"
                  step="0.01"
                  value={productData.border_dimension}
                  onChange={handleProductChange}
                  placeholder="Height/Border dimension in inches"
                  min="0"
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default_quantity">Default Quantity</Label>
                <Input 
                  id="default_quantity" 
                  name="default_quantity"
                  type="number"
                  value={productData.default_quantity}
                  onChange={handleProductChange}
                  placeholder="Default order quantity"
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Will be shown in product name as "Product Name*Quantity"
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Bag Components Card */}
        <Card>
          <CardHeader>
            <CardTitle>Bag Components</CardTitle>
            <CardDescription>Specify the details for each component of the bag</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <StandardComponents 
                components={components}
                componentOptions={componentOptions as any} // Type cast to fix TypeScript error
                onChange={handleComponentChange}
                defaultQuantity={productData.default_quantity}
              />
              
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
                    + Add Custom Component
                  </Button>
                </div>
                
                <CustomComponentSection 
                  customComponents={customComponents}
                  componentOptions={componentOptions as any} // Type cast to fix TypeScript error
                  handleCustomComponentChange={handleCustomComponentChange}
                  removeCustomComponent={removeCustomComponent}
                  defaultQuantity={productData.default_quantity}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Cost Calculation Card - New section for detailed costs */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Calculation</CardTitle>
            <CardDescription>Specify all costs associated with this product</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    readOnly={false} // We'll make this editable for now
                  />
                  <p className="text-xs text-muted-foreground">
                    Edit this value directly or it will be calculated from linked materials
                  </p>
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
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-calculated from all cost components
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="selling_rate">Selling Rate</Label>
                    <Input 
                      id="selling_rate" 
                      name="selling_rate"
                      type="number"
                      step="0.01"
                      value={productData.selling_rate}
                      onChange={handleProductChange}
                      placeholder="Selling price per bag"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="margin">Margin (%)</Label>
                    <Input 
                      id="margin" 
                      name="margin"
                      type="number"
                      step="0.01"
                      value={productData.margin}
                      onChange={handleProductChange}
                      placeholder="Profit margin percentage"
                      min="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Margin is calculated as ((Selling Rate - Total Cost) / Total Cost) × 100
                    </p>
                  </div>
                </div>
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
                {submitting ? "Creating..." : "Create Product"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default CatalogNew;
