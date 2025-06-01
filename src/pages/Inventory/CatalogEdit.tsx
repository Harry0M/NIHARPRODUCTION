
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { useProductForm } from "./CatalogNew/hooks/useProductForm";
import { v4 as uuidv4 } from "uuid";

const componentOptions = {
  color: ["Red", "Blue", "Green", "Black", "White", "Yellow", "Brown", "Orange", "Purple", "Gray", "Custom"],
};

interface ComponentType {
  id: string;
  type: string;
  customName?: string;
  color?: string;
  length?: string;
  width?: string;
  roll_width?: string;
  material_id?: string;
  consumption?: string;
  baseConsumption?: string;
  materialRate?: number;
  materialCost?: number;
  formula?: 'standard' | 'linear';
}

const CatalogEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const { 
    productData, 
    components, 
    customComponents,
    materialPrices,
    componentCosts,
    totalConsumption,
    handleProductChange,
    calculateTotalCost,
    fetchMaterialPrice,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent,
    setProductData,
    setComponents,
    setCustomComponents
  } = useProductForm();

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        console.log("Fetching product data for ID:", id);
        // Fetch product details
        const { data: product, error: productError } = await supabase
          .from("catalog")
          .select("*")
          .eq("id", id)
          .single();
          
        if (productError) throw productError;
        
        console.log("Product data loaded:", product);
        
        // Calculate margin if we have selling rate and total cost
        let calculatedMargin = null;
        if (product.selling_rate && product.total_cost && product.total_cost > 0) {
          calculatedMargin = ((product.selling_rate - product.total_cost) / product.total_cost) * 100;
        }
        
        // Format product data for the form
        setProductData({
          name: product.name,
          description: product.description || "",
          bag_length: product.bag_length.toString(),
          bag_width: product.bag_width.toString(),
          border_dimension: product.border_dimension ? product.border_dimension.toString() : "",
          default_quantity: product.default_quantity ? product.default_quantity.toString() : "",
          default_rate: product.default_rate ? product.default_rate.toString() : "",
          selling_rate: product.selling_rate ? product.selling_rate.toString() : "",
          margin: calculatedMargin ? calculatedMargin.toFixed(2) : "",
          cutting_charge: product.cutting_charge ? product.cutting_charge.toString() : "0",
          printing_charge: product.printing_charge ? product.printing_charge.toString() : "0",
          stitching_charge: product.stitching_charge ? product.stitching_charge.toString() : "0",
          transport_charge: product.transport_charge ? product.transport_charge.toString() : "0",
          material_cost: product.material_cost ? product.material_cost.toString() : "0",
          total_cost: product.total_cost ? product.total_cost.toString() : "0"
        });

        // Fetch components
        const { data: componentsData, error: componentsError } = await supabase
          .from("catalog_components")
          .select("*")
          .eq("catalog_id", id);
          
        if (componentsError) throw componentsError;

        console.log("Components data loaded:", componentsData);

        // Process components
        const standardComponentTypes = ['part', 'border', 'handle', 'chain', 'runner', 'piping'];
        const standardComps: Record<string, any> = {};
        const customComps: ComponentType[] = [];
        
        // First, clear any existing components
        setComponents({});
        setCustomComponents([]);
        
        // Create a map to track processed components
        const processedComponents = new Set<string>();
        
        // Fetch material prices for all components
        const materialIds = componentsData
          .filter(comp => comp.material_id)
          .map(comp => comp.material_id);
        
        let materialPrices: Record<string, number> = {};
        if (materialIds.length > 0) {
          const { data: materials, error: materialsError } = await supabase
            .from("inventory")
            .select("id, purchase_rate, rate")
            .in("id", materialIds);
            
          if (materialsError) throw materialsError;
          
          materialPrices = materials.reduce((acc, material) => ({
            ...acc,
            [material.id]: material.purchase_rate || material.rate || 0
          }), {});
        }
        
        componentsData.forEach(comp => {
          // Skip if we've already processed this component
          if (processedComponents.has(comp.id)) return;
          processedComponents.add(comp.id);
          
          const componentType = comp.component_type.toLowerCase();
          console.log(`Processing component: ${comp.component_type} with formula: ${comp.formula}`);
          
          if (standardComponentTypes.includes(componentType)) {
            // For standard components, use the capitalized version as the key
            const componentKey = componentType.charAt(0).toUpperCase() + componentType.slice(1);
            
            // Only add if we don't already have this type
            if (!standardComps[componentKey]) {
              const materialRate = comp.material_id ? materialPrices[comp.material_id] : undefined;
              const consumption = comp.consumption ? parseFloat(comp.consumption) : 0;
              const materialCost = materialRate && consumption ? (consumption * materialRate).toString() : undefined;
              
              standardComps[componentKey] = {
                id: comp.id,
                type: componentKey,
                color: comp.color || undefined,
                length: comp.length?.toString() || undefined,
                width: comp.width?.toString() || undefined,
                roll_width: comp.roll_width?.toString() || undefined,
                formula: comp.formula || 'standard', // Fix: Use actual formula from database
                consumption: comp.consumption?.toString() || undefined,
                material_id: comp.material_id || undefined,
                materialRate: materialRate?.toString(),
                materialCost: materialCost
              };
              
              console.log(`Standard component ${componentKey} loaded with formula: ${comp.formula || 'standard'}`);
            }
          } else {
            // For custom components
            const materialRate = comp.material_id ? materialPrices[comp.material_id] : undefined;
            const consumption = comp.consumption ? parseFloat(comp.consumption) : 0;
            const materialCost = materialRate && consumption ? (consumption * materialRate).toString() : undefined;
            
            customComps.push({
              id: comp.id,
              type: 'custom',
              customName: comp.custom_name || comp.component_type,
              color: comp.color || undefined,
              length: comp.length?.toString() || undefined,
              width: comp.width?.toString() || undefined,
              roll_width: comp.roll_width?.toString() || undefined,
              formula: comp.formula || 'standard', // Fix: Use actual formula from database
              consumption: comp.consumption?.toString() || undefined,
              material_id: comp.material_id || undefined,
              materialRate: materialRate?.toString(),
              materialCost: materialCost
            });
            
            console.log(`Custom component loaded with formula: ${comp.formula || 'standard'}`);
          }
        });
        
        // Set the components after processing all of them
        setComponents(standardComps);
        setCustomComponents(customComps);
        
        console.log("Final components state:", { standardComps, customComps });
        setLoading(false);
      } catch (error: any) {
        toast({
          title: "Error loading product",
          description: error.message || "An unexpected error occurred",
          variant: "destructive"
        });
        console.error("Error loading product:", error);
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id]);

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
    
    try {
      console.log("Starting save process...");
      
      // Format the name to include quantity if default_quantity is provided
      let formattedName = productData.name;
      if (productData.default_quantity) {
        formattedName = `${productData.name}*${productData.default_quantity}`;
      }
      
      // Calculate the final total cost
      const totalCost = calculateTotalCost(productData);
      
      // Create local variables for selling rate and margin to use in calculations
      let sellingRate = productData.selling_rate ? parseFloat(productData.selling_rate) : null;
      let margin = productData.margin ? parseFloat(productData.margin) : null;
      
      // Now calculate the missing value if one is provided but the other is not
      if (totalCost > 0) {
        // If selling_rate has a value but margin doesn't, calculate margin
        if (sellingRate !== null && sellingRate > 0 && (margin === null || margin <= 0)) {
          margin = ((sellingRate - totalCost) / totalCost) * 100;
        }
        // If margin has a value but selling_rate doesn't, calculate selling_rate
        else if (margin !== null && margin > 0 && (sellingRate === null || sellingRate <= 0)) {
          sellingRate = totalCost * (1 + (margin / 100));
        }
      }
      
      // Prepare product data with formatted name and all cost fields
      const productDbData = {
        name: formattedName,
        description: productData.description || null,
        bag_length: parseFloat(productData.bag_length),
        bag_width: parseFloat(productData.bag_width),
        border_dimension: productData.border_dimension ? parseFloat(productData.border_dimension) : 0,
        default_quantity: productData.default_quantity ? parseInt(productData.default_quantity) : null,
        default_rate: productData.default_rate ? parseFloat(productData.default_rate) : null,
        selling_rate: sellingRate,
        margin: margin,
        cutting_charge: parseFloat(productData.cutting_charge) || 0,
        printing_charge: parseFloat(productData.printing_charge) || 0,
        stitching_charge: parseFloat(productData.stitching_charge) || 0,
        transport_charge: parseFloat(productData.transport_charge) || 0,
        material_cost: parseFloat(productData.material_cost) || 0,
        total_cost: totalCost,
        updated_at: new Date().toISOString()
      };
      
      console.log("Updating product with data:", productDbData);
      
      // Update the product
      const { error: productError } = await supabase
        .from("catalog")
        .update(productDbData)
        .eq("id", id);
      
      if (productError) {
        throw productError;
      }
      
      console.log("Product updated successfully");
      
      // Process components - collect all components
      const allComponents = [
        ...Object.values(components).filter(Boolean),
        ...customComponents.filter(comp => comp.customName || comp.color || comp.length || comp.width || comp.roll_width)
      ];
      
      console.log("Processing components for save:", allComponents);
      
      if (allComponents.length > 0) {
        // Get existing components from database
        const { data: existingComponents, error: fetchError } = await supabase
          .from("catalog_components")
          .select("id")
          .eq("catalog_id", id);
        
        if (fetchError) {
          throw fetchError;
        }
        
        const existingComponentIds = existingComponents.map(comp => comp.id);
        console.log("Existing component IDs:", existingComponentIds);
        
        // Prepare components for database
        const componentsToSave = allComponents.map(comp => {
          const componentData = {
            catalog_id: id,
            component_type: comp.type === 'custom' ? (comp.customName || 'custom') : comp.type.toLowerCase(), // Fix: Convert to lowercase
            size: comp.length && comp.width ? `${comp.length}x${comp.width}` : null,
            color: comp.color || null,
            roll_width: comp.roll_width ? parseFloat(comp.roll_width) : null,
            length: comp.length ? parseFloat(comp.length) : null,
            width: comp.width ? parseFloat(comp.width) : null,
            custom_name: comp.type === 'custom' ? comp.customName : null,
            material_id: comp.material_id || null,
            material_linked: comp.material_id ? true : false,
            consumption: comp.consumption ? parseFloat(comp.consumption) : null,
            formula: comp.formula || 'standard' // Fix: Ensure formula is saved
          };
          
          console.log(`Preparing component for save:`, {
            type: comp.type,
            formula: comp.formula,
            componentData: componentData
          });
          
          return componentData;
        });
        
        console.log("Components prepared for save:", componentsToSave);
        
        // Delete existing components first
        const { error: deleteError } = await supabase
          .from("catalog_components")
          .delete()
          .eq("catalog_id", id);
        
        if (deleteError) {
          throw deleteError;
        }
        
        console.log("Existing components deleted");
        
        // Insert new components
        const { error: componentsError } = await supabase
          .from("catalog_components")
          .insert(componentsToSave);
        
        if (componentsError) {
          console.error("Error saving components:", componentsError);
          throw componentsError;
        }
        
        console.log("New components inserted successfully");
      }
      
      toast({
        title: "Product updated successfully",
        description: `${formattedName} has been updated in the catalog`,
        variant: "default"
      });

      // Navigate back to the product view
      window.location.href = `/inventory/catalog/${id}`;
      
    } catch (error: any) {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
        {/* Basic Product Details Card */}
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
            
            <div className="grid md:grid-cols-2 gap-4">
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

        {/* Components Card */}
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
        </Card>

        {/* Cost Calculation Card */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Calculation</CardTitle>
            <CardDescription>Calculate the total cost and pricing for this product</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Material Costs */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Material Costs</h3>
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
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Pricing</h3>
                <div className="grid md:grid-cols-2 gap-4">
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
                onClick={() => window.location.href = `/inventory/catalog/${id}`}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Updating..." : "Update Product"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default CatalogEdit;
