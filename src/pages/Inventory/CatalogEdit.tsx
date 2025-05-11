import { useParams, useNavigate } from "react-router-dom";
import { useCatalogProducts } from "@/hooks/use-catalog-products";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { StandardComponents } from "@/components/orders/StandardComponents";
import { CustomComponentSection } from "@/components/orders/CustomComponentSection";
import { v4 as uuidv4 } from "uuid";

const componentOptions = {
  color: ["Red", "Blue", "Green", "Black", "White", "Yellow", "Brown", "Orange", "Purple", "Gray", "Custom"],
  gsm: ["70", "80", "90", "100", "120", "140", "160", "180", "200", "250", "300", "Custom"]
};

interface ComponentType {
  id: string;
  type: string;
  customName?: string;
  color?: string;
  gsm?: string;
  length?: string;
  width?: string;
  roll_width?: string;
  material_id?: string;
  material_linked?: boolean;
  consumption?: string;
  baseConsumption?: string;
  materialRate?: number;
  materialCost?: number;
}

const CatalogEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  
  const { data: products, isLoading } = useCatalogProducts();
  const product = products?.find((p) => p.id === id);
  
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
    // Add cost breakdown fields
    cutting_charge: "0",
    printing_charge: "0",
    stitching_charge: "0",
    transport_charge: "0",
    material_cost: "0",
    total_cost: "0"
  });
  
  const [components, setComponents] = useState<Record<string, any>>({});
  const [customComponents, setCustomComponents] = useState<ComponentType[]>([]);
  const [existingComponents, setExistingComponents] = useState<any[]>([]);
  const [deletedComponentIds, setDeletedComponentIds] = useState<string[]>([]);
  const [materialPrices, setMaterialPrices] = useState<Record<string, number>>({});
  const [lastCalculation, setLastCalculation] = useState<string>("");

  useEffect(() => {
    if (product) {
      setProductData({
        name: product.name,
        description: product.description || "",
        bag_length: product.bag_length.toString(),
        bag_width: product.bag_width.toString(),
        border_dimension: product.border_dimension ? product.border_dimension.toString() : "",
        default_quantity: product.default_quantity ? product.default_quantity.toString() : "",
        default_rate: product.default_rate ? product.default_rate.toString() : "",
        selling_rate: product.selling_rate ? product.selling_rate.toString() : "",
        margin: product.margin ? product.margin.toString() : "",
        // Cost fields
        cutting_charge: product.cutting_charge ? product.cutting_charge.toString() : "0",
        printing_charge: product.printing_charge ? product.printing_charge.toString() : "0",
        stitching_charge: product.stitching_charge ? product.stitching_charge.toString() : "0",
        transport_charge: product.transport_charge ? product.transport_charge.toString() : "0",
        material_cost: product.total_cost ? (product.total_cost - (product.cutting_charge || 0) - (product.printing_charge || 0) - (product.stitching_charge || 0) - (product.transport_charge || 0)).toString() : "0",
        total_cost: product.total_cost ? product.total_cost.toString() : "0"
      });

      // Process components from product
      const standardComponentTypes = ['part', 'border', 'handle', 'chain', 'runner'];
      const productComponents = product.catalog_components || [];
      
      // Standard components
      const standardComps: Record<string, any> = {};
      const customComps: ComponentType[] = [];
      
      productComponents.forEach(comp => {
        if (standardComponentTypes.includes(comp.component_type)) {
          standardComps[comp.component_type] = {
            id: comp.id,
            type: comp.component_type,
            color: comp.color || undefined,
            gsm: comp.gsm?.toString() || undefined,
            length: comp.length?.toString() || undefined,
            width: comp.width?.toString() || undefined,
            roll_width: comp.roll_width?.toString() || undefined,
          };
        } else {
          // Custom components
          customComps.push({
            id: comp.id,
            type: 'custom',
            customName: comp.custom_name || comp.component_type,
            color: comp.color || undefined,
            gsm: comp.gsm?.toString() || undefined,
            length: comp.length?.toString() || undefined,
            width: comp.width?.toString() || undefined,
            roll_width: comp.roll_width?.toString() || undefined,
          });
        }
      });
      
      setComponents(standardComps);
      setCustomComponents(customComps);
      setExistingComponents(productComponents);
    }
  }, [product]);

  // Function to calculate material cost for components
  const calculateTotalMaterialCost = () => {
    let totalCost = 0;
    
    // Skip calculation if components aren't loaded yet
    if (Object.keys(components).length === 0 && customComponents.length === 0) {
      return 0;
    }
    
    // Add costs from standard components
    Object.values(components).forEach((component: any) => {
      if (component && component.material_id && materialPrices[component.material_id]) {
        const consumption = parseFloat(component.consumption || '0');
        const rate = materialPrices[component.material_id];
        if (!isNaN(consumption) && !isNaN(rate)) {
          totalCost += consumption * rate;
        }
      }
    });
    
    // Add costs from custom components
    customComponents.forEach((component) => {
      if (component.material_id && materialPrices[component.material_id]) {
        const consumption = parseFloat(component.consumption || '0');
        const rate = materialPrices[component.material_id];
        if (!isNaN(consumption) && !isNaN(rate)) {
          totalCost += consumption * rate;
        }
      }
    });
    
    return totalCost;
  };

  useEffect(() => {
    // Calculate a hash of the current state to prevent unnecessary updates
    const currentCalculationState = JSON.stringify({
      components: Object.keys(components).length,
      customComponents: customComponents.length,
      materialPrices: Object.keys(materialPrices).length
    });
    
    // Skip if nothing relevant has changed
    if (currentCalculationState === lastCalculation) return;
    
    // Calculate the total material cost
    const totalMaterialCost = calculateTotalMaterialCost();
    const formattedMaterialCost = totalMaterialCost.toFixed(2);
    
    // Skip if the material cost hasn't changed
    if (formattedMaterialCost === productData.material_cost) {
      setLastCalculation(currentCalculationState);
      return;
    }
    
    // Update the product data with the new material cost
    setProductData(prev => {
      // Calculate total cost with new material cost
      const updatedData = {
        ...prev,
        material_cost: formattedMaterialCost
      };
      
      // Update total cost
      const totalCost = calculateTotalCost();
      const formattedTotalCost = totalCost.toFixed(2);
      
      // Only update if actually changed
      if (formattedTotalCost !== prev.total_cost) {
        updatedData.total_cost = formattedTotalCost;
        
        // Update margin if selling rate exists
        if (updatedData.selling_rate && parseFloat(updatedData.selling_rate) > 0 && totalCost > 0) {
          const calculatedMargin = ((parseFloat(updatedData.selling_rate) - totalCost) / totalCost) * 100;
          updatedData.margin = calculatedMargin.toFixed(2);
        }
      }
      
      return updatedData;
    });
    
    // Save the current calculation state to prevent unnecessary recalculations
    setLastCalculation(currentCalculationState);
  }, [components, customComponents, materialPrices, lastCalculation]);

  // Calculate the total cost by summing all component costs
  const calculateTotalCost = () => {
    const materialCost = parseFloat(productData.material_cost) || 0;
    const cuttingCharge = parseFloat(productData.cutting_charge) || 0;
    const printingCharge = parseFloat(productData.printing_charge) || 0;
    const stitchingCharge = parseFloat(productData.stitching_charge) || 0;
    const transportCharge = parseFloat(productData.transport_charge) || 0;
    
    const totalCost = materialCost + cuttingCharge + printingCharge + stitchingCharge + transportCharge;
    return totalCost;
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductData(prev => ({
      ...prev,
      [name]: value
    }));

    // Calculate margin when selling_rate or default_rate changes
    if (name === "selling_rate" || name === "default_rate") {
      const costRate = parseFloat(name === "default_rate" ? value : productData.default_rate);
      const sellingRate = parseFloat(name === "selling_rate" ? value : productData.selling_rate);
      
      if (!isNaN(costRate) && !isNaN(sellingRate) && costRate > 0) {
        const calculatedMargin = ((sellingRate - costRate) / costRate) * 100;
        setProductData(prev => ({
          ...prev,
          margin: calculatedMargin.toFixed(2)
        }));
      }
    }
    
    // Update selling_rate when margin changes
    if (name === "margin") {
      const costRate = parseFloat(productData.default_rate);
      const marginValue = parseFloat(value);
      
      if (!isNaN(costRate) && !isNaN(marginValue) && costRate > 0) {
        const calculatedSellingRate = costRate * (1 + (marginValue / 100));
        setProductData(prev => ({
          ...prev,
          selling_rate: calculatedSellingRate.toFixed(2)
        }));
      }
    }
    
    // Recalculate total cost when cost components change
    if (["cutting_charge", "printing_charge", "stitching_charge", "transport_charge", "material_cost"].includes(name)) {
      setTimeout(() => {
        const totalCost = calculateTotalCost();
        setProductData(prev => ({
          ...prev,
          total_cost: totalCost.toFixed(2)
        }));
      }, 0);
    }
  };

  const handleComponentChange = (type: string, field: string, value: string) => {
    setComponents(prev => {
      const component = prev[type] || { 
        id: existingComponents.find(c => c.component_type === type)?.id || uuidv4(),
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
    const componentToRemove = customComponents[index];
    
    // If it's an existing component (has an ID that's in the existing components), 
    // add it to the deleted list
    if (componentToRemove.id && existingComponents.some(c => c.id === componentToRemove.id)) {
      setDeletedComponentIds(prev => [...prev, componentToRemove.id]);
    }
    
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
    
    if (!validateForm() || !id) {
      return;
    }
    
    setSubmitting(true);
    
    // Show a pending toast to indicate the process has started
    const pendingToast = toast({
      title: "Saving changes...",
      description: "Please wait while your changes are being saved",
      variant: "default"
    });
    
    try {
      console.log("Starting product update process...");
      
      // Prepare product data with all required fields
      const productDbData = {
        name: productData.name,
        description: productData.description || null,
        bag_length: parseFloat(productData.bag_length),
        bag_width: parseFloat(productData.bag_width),
        border_dimension: productData.border_dimension ? parseFloat(productData.border_dimension) : null,
        default_quantity: productData.default_quantity ? parseInt(productData.default_quantity) : null,
        default_rate: productData.default_rate ? parseFloat(productData.default_rate) : null,
        selling_rate: productData.selling_rate ? parseFloat(productData.selling_rate) : null,
        margin: productData.margin ? parseFloat(productData.margin) : null,
        // Add all the cost fields
        cutting_charge: parseFloat(productData.cutting_charge) || 0,
        printing_charge: parseFloat(productData.printing_charge) || 0,
        stitching_charge: parseFloat(productData.stitching_charge) || 0,
        transport_charge: parseFloat(productData.transport_charge) || 0,
        total_cost: parseFloat(productData.total_cost) || 0,
        updated_at: new Date().toISOString()
      };
      
      console.log("Product data to update:", productDbData);
      
      // Update the product
      const { error: productError } = await supabase
        .from("catalog")
        .update(productDbData)
        .eq("id", id);
      
      if (productError) {
        console.error("Error updating product data:", productError);
        throw productError;
      }
      
      console.log("Product updated successfully with ID:", id);
      
      // Delete components that were removed
      if (deletedComponentIds.length > 0) {
        console.log("Deleting removed components:", deletedComponentIds);
        
        const { error: deleteError } = await supabase
          .from("catalog_components")
          .delete()
          .in("id", deletedComponentIds);
          
        if (deleteError) {
          console.error("Error deleting components:", deleteError);
          throw deleteError;
        }
      }
      
      // Process components
      const allComponents = [
        ...Object.values(components).filter(Boolean),
        ...customComponents.filter(comp => comp.customName || comp.color || comp.length || comp.width || comp.roll_width)
      ];
      
      console.log("Components to update:", allComponents.length);
      
      // Update or insert components
      for (const comp of allComponents) {
        const isExisting = existingComponents.some(ec => ec.id === comp.id);
        
        const componentData = {
          catalog_id: id,
          component_type: comp.type === 'custom' ? (comp.customName || 'custom') : comp.type,
          size: comp.length && comp.width ? `${comp.length}x${comp.width}` : null,
          color: comp.color || null,
          gsm: comp.gsm ? parseFloat(comp.gsm) : null,
          roll_width: comp.roll_width ? parseFloat(comp.roll_width) : null,
          custom_name: comp.type === 'custom' ? comp.customName : null,
          length: comp.length ? parseFloat(comp.length) : null,
          width: comp.width ? parseFloat(comp.width) : null,
          material_id: comp.material_id || null,
          material_linked: comp.material_id ? true : false,
          consumption: comp.consumption || null,
          updated_at: new Date().toISOString()
        };
        
        if (isExisting) {
          console.log(`Updating existing component ${comp.id}:`, comp.type);
          // Update existing component
          const { error } = await supabase
            .from("catalog_components")
            .update(componentData)
            .eq("id", comp.id);
            
          if (error) {
            console.error(`Error updating component ${comp.id}:`, error);
            throw error;
          }
          
          console.log(`Component ${comp.id} updated successfully`);
        } else {
          console.log(`Creating new component of type ${comp.type}:`, comp);
          // Insert new component
          const { error } = await supabase
            .from("catalog_components")
            .insert({
              ...componentData,
              id: comp.id
            });
            
          if (error) {
            console.error(`Error creating component ${comp.id}:`, error);
            throw error;
          }
          
          console.log(`New component created with ID:`, comp.id);
        }
      }
      
      // Clear the pending toast
      pendingToast?.dismiss();
      
      toast({
        title: "Product updated successfully",
        description: `${productData.name} has been updated in the catalog`,
        variant: "default"
      });

      // Immediate redirect with a full page refresh
      // This resolves navigation issues by forcing a complete page reload
      window.location.href = `/inventory/catalog/${id}`;
      
    } catch (error: any) {
      // Clear the pending toast
      pendingToast?.dismiss();
      
      toast({
        title: "Error updating product",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
      console.error("Error updating product:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <div className="text-2xl font-semibold text-muted-foreground">Product not found</div>
        <Button onClick={() => window.location.href = "/inventory/catalog"}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Catalog
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.location.href = `/inventory/catalog/${id}`}
            className="gap-1"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
            <p className="text-muted-foreground">Update this catalog product</p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>Update the basic information for this product</CardDescription>
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_rate">Cost Rate</Label>
                <Input 
                  id="default_rate" 
                  name="default_rate"
                  type="number"
                  step="0.01"
                  value={productData.default_rate}
                  onChange={handleProductChange}
                  placeholder="Cost price per bag"
                  min="0"
                />
              </div>
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
                Margin is calculated as ((Selling Rate - Cost Rate) / Cost Rate) × 100
              </p>
            </div>
            
            {/* Add Cost Breakdown Section */}
            <div className="col-span-2 mt-4">
              <h3 className="text-lg font-medium mb-4">Cost Breakdown</h3>
              <div className="grid md:grid-cols-2 gap-4">
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
                  />
                </div>
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
                  <Label htmlFor="total_cost">Total Cost</Label>
                  <Input 
                    id="total_cost" 
                    name="total_cost"
                    type="number"
                    step="0.01"
                    value={productData.total_cost}
                    readOnly
                    className="bg-slate-50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Sum of material cost and all charges
                  </p>
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
              <StandardComponents 
                components={components}
                componentOptions={componentOptions}
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
                  componentOptions={componentOptions}
                  handleCustomComponentChange={handleCustomComponentChange}
                  removeCustomComponent={removeCustomComponent}
                  defaultQuantity={productData.default_quantity}
                />
              </div>
            </div>
          </CardContent>
          <div className="flex justify-end gap-2 p-6 pt-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.href = `/inventory/catalog/${id}`}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="gap-1">
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Update Product</span>
                </>
              )}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default CatalogEdit;
