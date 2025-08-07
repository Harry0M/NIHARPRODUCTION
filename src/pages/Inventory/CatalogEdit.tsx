import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { createManualFormulaTest } from "@/utils/debug-formula-state";

const componentOptions = {
  color: ["Red", "Blue", "Green", "Black", "White", "Yellow", "Brown", "Orange", "Purple", "Gray", "Custom"],
};

interface ComponentType {
  id: string;
  type: string;
  customName?: string;
  color?: string;
  length?: number;
  width?: number;
  roll_width?: number;
  material_id?: string;
  consumption?: number;
  baseConsumption?: number;
  materialRate?: number;
  materialCost?: number;
  formula?: 'standard' | 'linear' | 'manual';
  is_manual_consumption?: boolean;
  baseFormula?: 'standard' | 'linear';
}

interface DatabaseComponent {
  id: string;
  catalog_id: string;
  component_type: string;
  custom_name: string;
  color: string;
  length: number;
  width: number;
  roll_width: number;
  material_id: string;
  consumption: number;
  formula: string;
  gsm: number;
  created_at: string;
  updated_at: string;
  is_manual_consumption?: boolean;
}

const CatalogEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const testManualFormulas = createManualFormulaTest();

  const { 
    productData, 
    components, 
    customComponents,
    materialPrices,
    componentCosts,
    totalConsumption,
    handleProductChange: originalHandleProductChange,
    calculateTotalCost,
    fetchMaterialPrice,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent,
    removeStandardComponent,
    setProductData,
    setComponents,
    setCustomComponents
  } = useProductForm();

  // Override handleProductChange to delay selling price calculation until Update button
  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Create a new product data object with the updated value
    const updatedProductData = {
      ...productData,
      [name]: value
    };
    
    // Calculate total cost when cost-related fields change
    if (['cutting_charge', 'printing_charge', 'stitching_charge', 'transport_charge', 'material_cost'].includes(name)) {
      const totalCost = calculateTotalCost(updatedProductData);
      updatedProductData.total_cost = totalCost.toString();
    }
    
    // No automatic calculation between margin and selling_rate
    // These will only be calculated when the Update button is pressed
    setProductData(updatedProductData);
  };

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
          // Use consistent precision for margin calculations
          calculatedMargin = parseFloat(calculatedMargin.toFixed(2));
          console.log("Initial calculated margin:", calculatedMargin);
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
      const standardComps: Record<string, ComponentType> = {};
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
        
        componentsData.forEach((comp: DatabaseComponent) => {
          const componentType = comp.component_type?.toLowerCase() || '';
          
          if (standardComponentTypes.includes(componentType)) {
            // For standard components, use the capitalized version as the key
            const componentKey = componentType.charAt(0).toUpperCase() + componentType.slice(1);
            
            // Only add if we don't already have this type
            if (!standardComps[componentKey]) {
              const materialRate = comp.material_id ? materialPrices[comp.material_id] : undefined;
              const consumption = comp.consumption ? Number(comp.consumption) : 0;
              const materialCost = materialRate && consumption ? consumption * materialRate : undefined;
              
              standardComps[componentKey] = {
                id: comp.id,
                type: componentKey,
                color: comp.color || undefined,
                length: comp.length ? Number(comp.length) : undefined,
                width: comp.width ? Number(comp.width) : undefined,
                roll_width: comp.roll_width ? Number(comp.roll_width) : undefined,
                formula: (comp.formula as 'standard' | 'linear' | 'manual') || 'standard',
                consumption: comp.consumption ? Number(comp.consumption) : undefined,
                material_id: comp.material_id || undefined,
                materialRate: materialRate,
                materialCost: materialCost,
                is_manual_consumption: comp.is_manual_consumption || false,
                baseFormula: (comp.formula !== 'manual' ? comp.formula as 'standard' | 'linear' : 'standard')
              };
              
              console.log(`%c Standard component ${componentKey} loaded from DB:`, 'background:#8e44ad;color:white;font-weight:bold;padding:3px;', {
                formula: comp.formula,
                is_manual_consumption: comp.is_manual_consumption,
                consumption: comp.consumption
              });
            }
          } else {
            // For custom components
            const materialRate = comp.material_id ? materialPrices[comp.material_id] : undefined;
            const consumption = comp.consumption ? Number(comp.consumption) : 0;
            const materialCost = materialRate && consumption ? consumption * materialRate : undefined;
            
            customComps.push({
              id: comp.id,
              type: 'custom',
              customName: comp.custom_name || comp.component_type,
              color: comp.color || undefined,
              length: comp.length ? Number(comp.length) : undefined,
              width: comp.width ? Number(comp.width) : undefined,
              roll_width: comp.roll_width ? Number(comp.roll_width) : undefined,
              formula: comp.formula as 'standard' | 'linear' | 'manual' || 'standard',
              consumption: comp.consumption ? Number(comp.consumption) : undefined,
              material_id: comp.material_id || undefined,
              materialRate: materialRate,
              materialCost: materialCost,
              is_manual_consumption: comp.is_manual_consumption || false,
              baseFormula: (comp.formula !== 'manual' ? comp.formula : 'standard') as 'standard' | 'linear'
            });
            
            console.log(`%c Custom component ${comp.custom_name || comp.component_type} loaded from DB:`, 'background:#e67e22;color:white;font-weight:bold;padding:3px;', {
              formula: comp.formula,
              is_manual_consumption: comp.is_manual_consumption,
              consumption: comp.consumption
            });
          }
        });
        
        // Set the components after processing all of them
      setComponents(standardComps);
      setCustomComponents(customComps);
        
      // Debug log focusing specifically on formula and manual consumption values
      console.log("%c PRODUCT EDIT FORM - COMPONENT FORMULA DEBUG", "background:#2c3e50;color:white;font-size:14px;padding:5px;");
      
      // Log standard components formulas
      Object.entries(standardComps).forEach(([key, comp]) => {
        console.log(`%c Standard ${key}: formula=${comp.formula}, is_manual=${comp.is_manual_consumption}`, 
          `background:${comp.formula === 'manual' ? '#e74c3c' : '#3498db'};color:white;padding:3px;`);
      });
      
      // Log custom components formulas
      customComps.forEach((comp, i) => {
        console.log(`%c Custom ${i}: ${comp.customName}, formula=${comp.formula}, is_manual=${comp.is_manual_consumption}`, 
          `background:${comp.formula === 'manual' ? '#e74c3c' : '#3498db'};color:white;padding:3px;`);
      });
        setLoading(false);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
        toast({
          title: "Error loading product",
          description: errorMessage,
          variant: "destructive"
        });
        console.error("Error loading product:", error);
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id, setComponents, setCustomComponents, setProductData]);

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
      
      // NOW perform the selling price and margin calculations on form submission
      let sellingRate = productData.selling_rate ? parseFloat(productData.selling_rate) : null;
      let margin = productData.margin ? parseFloat(productData.margin) : null;
      
      // Calculate the missing value if one is provided but the other is not
      if (totalCost > 0) {
        if (sellingRate !== null && sellingRate > 0 && (margin === null || margin <= 0)) {
          // Calculate margin from selling rate with consistent precision
          margin = ((sellingRate - totalCost) / totalCost) * 100;
          margin = parseFloat(margin.toFixed(2));
          console.log("Calculated margin from selling rate on submit:", margin);
        }
        else if (margin !== null && margin > 0 && (sellingRate === null || sellingRate <= 0)) {
          // Calculate selling rate from margin with consistent precision
          sellingRate = totalCost * (1 + (margin / 100));
          sellingRate = parseFloat(sellingRate.toFixed(2));
          console.log("Calculated selling rate from margin on submit:", sellingRate);
        }
        
        // Always recalculate margin from selling rate for consistency if both exist
        if (sellingRate !== null && sellingRate > 0) {
          margin = ((sellingRate - totalCost) / totalCost) * 100;
          margin = parseFloat(margin.toFixed(2));
          console.log("Final calculated margin for consistency on submit:", margin);
        }
      }
      
      // First, fetch the current catalog record to see all fields
      const { data: currentCatalog, error: catalogFetchError } = await supabase
        .from("catalog")
        .select("*")
        .eq("id", id)
        .single();
        
      if (catalogFetchError) {
        console.error("Error fetching current catalog data:", catalogFetchError);
        throw new Error(`Error fetching catalog data: ${catalogFetchError.message}`);
      }
      
      console.log("Current catalog data:", currentCatalog);
      
      // Prepare complete data for catalog table update
      // Include ALL fields that should be updated in the catalog table
      // Make sure to handle both height and border_dimension
      const catalogDbData = {
        name: formattedName,
        description: productData.description || null,
        bag_length: parseFloat(productData.bag_length),
        bag_width: parseFloat(productData.bag_width),
        border_dimension: productData.border_dimension ? parseFloat(productData.border_dimension) : null,
        // Set height either from border_dimension or keep existing
        height: productData.border_dimension ? parseFloat(productData.border_dimension) : (currentCatalog.height || 0),
        default_quantity: productData.default_quantity ? parseInt(productData.default_quantity) : null,
        default_rate: productData.default_rate ? parseFloat(productData.default_rate) : null,
        selling_rate: sellingRate,
        margin: margin,
        cutting_charge: parseFloat(productData.cutting_charge) || 0,
        printing_charge: parseFloat(productData.printing_charge) || 0,
        stitching_charge: parseFloat(productData.stitching_charge) || 0,
        transport_charge: parseFloat(productData.transport_charge) || 0,
        total_cost: totalCost,
        material_cost: parseFloat(productData.material_cost) || 0,
        updated_at: new Date().toISOString()
      };
      
      console.log("Updating catalog with complete data:", catalogDbData);
      
      console.log("Checking Supabase authentication status...");
      const { data: authData } = await supabase.auth.getSession();
      console.log("Auth session:", authData);
      
      try {
        // Set more detailed logging for debugging
        console.log("Attempting to update catalog with the following data:", catalogDbData);
        console.log("For catalog ID:", id);
        
        // Update the catalog table with ALL fields
        const { data: updateData, error: catalogError } = await supabase
          .from("catalog")
          .update(catalogDbData)
          .eq("id", id)
          .select();
          
        console.log("Raw update response:", updateData);
          
        if (catalogError) {
          console.error("Error updating catalog - DETAILED ERROR:", catalogError);
          if (catalogError.code === 'PGRST301' || catalogError.message.includes('permission denied')) {
            toast({
              title: "Permissions Error",
              description: "You don't have permission to update this product. This may be due to Row Level Security.",
              variant: "destructive"
            });
          }
          throw new Error(`Error updating catalog: ${catalogError.message} (code: ${catalogError.code})`);
        }

        // Also update the product_details table to ensure consistency
        const productDetailsData = {
          catalog_id: id,
          name: formattedName,
          description: productData.description || null,
          bag_length: parseFloat(productData.bag_length),
          bag_width: parseFloat(productData.bag_width),
          border_dimension: productData.border_dimension ? parseFloat(productData.border_dimension) : null,
          height: productData.border_dimension ? parseFloat(productData.border_dimension) : (currentCatalog.height || 0),
          default_quantity: productData.default_quantity ? parseInt(productData.default_quantity) : null,
          default_rate: productData.default_rate ? parseFloat(productData.default_rate) : null,
          selling_rate: sellingRate,
          margin: margin,
          cutting_charge: parseFloat(productData.cutting_charge) || 0,
          printing_charge: parseFloat(productData.printing_charge) || 0,
          stitching_charge: parseFloat(productData.stitching_charge) || 0,
          transport_charge: parseFloat(productData.transport_charge) || 0,
          total_cost: totalCost,
          updated_at: new Date().toISOString()
        };

        // First check if a product_details record exists
        const { data: existingDetails, error: detailsCheckError } = await supabase
          .from("product_details")
          .select("id")
          .eq("catalog_id", id)
          .single();

        let detailsUpdateError;
        if (existingDetails) {
          // Update existing record
          const { error } = await supabase
            .from("product_details")
            .update(productDetailsData)
            .eq("catalog_id", id);
          detailsUpdateError = error;
        } else {
          // Insert new record
          const { error } = await supabase
            .from("product_details")
            .insert(productDetailsData);
          detailsUpdateError = error;
        }

        if (detailsUpdateError) {
          console.error("Error updating product details:", detailsUpdateError);
          toast({
            title: "Warning",
            description: "Product was updated but there was an error syncing the details. Please try refreshing the page.",
            variant: "destructive"
          });
        }
      } catch (updateError) {
        console.error("Caught error during catalog update:", updateError);
        throw updateError;
      }
      
      console.log("Product updated successfully");
      
      // Debug: Log raw custom components before filtering
      console.log("Raw custom components before filtering:", customComponents);
      
      // Get all current components from the form data that have valid information
      // For custom components, include all components that exist (they might have data in fields we're not checking)
      const allComponents = [
        ...Object.values(components).filter(Boolean),
        ...customComponents.filter(comp => {
          // Include any custom component that exists (has id) or has any meaningful data
          const hasData = comp.customName || comp.color || comp.length || comp.width || comp.roll_width || comp.material_id;
          console.log(`Custom component ${comp.customName || 'unnamed'} - hasData: ${hasData}`, comp);
          return hasData;
        })
      ];
      
      console.log("Processing components for update:", allComponents);
      
      // First, get the existing component IDs from the database to determine what to keep/delete
      const { data: existingComponents, error: fetchError } = await supabase
        .from("catalog_components")
        .select("id")
        .eq("catalog_id", id);
        
      if (fetchError) {
        console.error("Error fetching existing components:", fetchError);
        throw fetchError;
      }
      
      // Get related orders to ensure component updates are properly propagated
      // This is just for logging and verification purposes
      const { data: relatedOrders, error: ordersError } = await supabase
        .from("orders")
        .select("id")
        .eq("catalog_id", id);
        
      if (ordersError) {
        console.warn("Error checking related orders:", ordersError);
        // Don't throw, just log the warning
      } else {
        console.log(`Found ${relatedOrders?.length || 0} related orders that will be updated via database trigger`);
      }
        // Create a set of existing component IDs from the database
      const existingComponentIds = new Set(existingComponents.map(comp => comp.id));
      
      // Create a set of component IDs from the current form data (only numeric/database IDs)
      const currentComponentIds = new Set(
        allComponents
          .filter(comp => comp.id && !isNaN(Number(comp.id)))
          .map(comp => comp.id)
      );
      
      // Find components to delete (in database but not in form)
      const componentsToDelete = [...existingComponentIds].filter(id => !currentComponentIds.has(id));
      
      // Delete components that are no longer present
      if (componentsToDelete.length > 0) {
        console.log("Deleting components:", componentsToDelete);
        const { data: deleteData, error: deleteError } = await supabase
          .from("catalog_components")
          .delete()
          .in("id", componentsToDelete)
          .select();
          
        if (deleteError) {
          console.error("Error deleting components - DETAILED ERROR:", deleteError);
          if (deleteError.code === 'PGRST301' || deleteError.message.includes('permission denied')) {
            toast({
              title: "Components Permissions Error",
              description: "You don't have permission to delete components. This may be due to Row Level Security on the catalog_components table.",
              variant: "destructive"
            });
          }
          // Log but don't throw, try to continue with other operations
          console.warn("Continuing despite component delete error");
        } else {
          console.log("Successfully deleted components:", deleteData);
        }
      }
      
      // Process each component - update existing ones and add new ones
      for (const comp of allComponents) {
        // Calculate consumption if we have the required dimensions and it's not manual
        let consumption = comp.consumption;
        if (!comp.is_manual_consumption && comp.length && comp.width && comp.roll_width) {
          const baseConsumption = (Number(comp.length) * Number(comp.width)) / (Number(comp.roll_width) * 39.39);
          consumption = productData.default_quantity 
            ? baseConsumption * parseFloat(productData.default_quantity)
            : baseConsumption;
        }
        
        const componentData = {
          catalog_id: id, // Ensure we link the component to the catalog item
          component_type: comp.type === 'custom' ? (comp.customName || 'custom') : comp.type.toLowerCase(),
          size: comp.length && comp.width ? `${comp.length}x${comp.width}` : null,
          color: comp.color || null,
          roll_width: comp.roll_width ? Number(comp.roll_width) : null,
          length: comp.length ? Number(comp.length) : null,
          width: comp.width ? Number(comp.width) : null,
          custom_name: comp.type === 'custom' ? comp.customName : null,
          material_id: comp.material_id || null,
          material_linked: comp.material_id ? true : false,
          consumption: consumption ? Number(consumption) : null,
          formula: comp.formula || 'standard',
          is_manual_consumption: comp.is_manual_consumption || false,
          updated_at: new Date().toISOString()
        };
          try {
          // Check if this is a database ID (numeric) or a temporary UUID
          const isExistingComponent = comp.id && !isNaN(Number(comp.id));
          
          if (isExistingComponent) {
            // Update existing component
            console.log(`Updating existing component ${comp.id}:`, componentData);
            const { data: updateData, error: updateError } = await supabase
              .from("catalog_components")
              .update(componentData)
              .eq("id", comp.id)
              .select();
              
            if (updateError) {
              console.error("Error updating component - DETAILED:", comp.id, updateError);
              if (updateError.code === 'PGRST301' || updateError.message.includes('permission denied')) {
                toast({
                  title: "Component Update Permission Error",
                  description: "You don't have permission to update components. Check RLS on catalog_components table.",
                  variant: "destructive"
                });
                // Continue with other components
                continue;
              } else {
                throw updateError;
              }
            }
            
            console.log(`Component ${comp.id} update result:`, updateData);
            
            // Verify the update
            const { data: verifyData } = await supabase
              .from("catalog_components")
              .select("*")
              .eq("id", comp.id)
              .single();
              
            if (verifyData) {
              console.log(`Component ${comp.id} verification:`, verifyData);
            }
          } else {
            // Insert new component
            console.log("Adding new component:", componentData);
            const { data: insertData, error: insertError } = await supabase
              .from("catalog_components")
              .insert(componentData)
              .select();
              
            if (insertError) {
              console.error("Error inserting new component - DETAILED:", insertError);
              if (insertError.code === 'PGRST301' || insertError.message.includes('permission denied')) {
                toast({
                  title: "Component Insert Permission Error",
                  description: "You don't have permission to add new components. Check RLS on catalog_components table.",
                  variant: "destructive"
                });
                // Continue with other components
                continue;
              } else {
                throw insertError;
              }
            }
            
            console.log("New component insert result:", insertData);
          }
        } catch (componentError) {
          console.error("Unexpected error handling component:", componentError);
          toast({
            title: "Component Error",
            description: "An error occurred while processing component data.",
            variant: "destructive"
          });
          // Continue with other components
          continue;
        }
      }
      
      toast({
        title: "Product updated successfully",
        description: `${formattedName} has been updated in the catalog`,
        variant: "default"
      });

      // Navigate to the catalog detail page
      navigate(`/inventory/catalog/${id}`);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast({
        title: "Error updating product",
        description: errorMessage,
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
            type="button"
            variant="ghost" 
            size="sm"
            onClick={() => navigate(`/inventory/catalog/${id}`)}
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
                onRemoveComponent={removeStandardComponent}
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
              {/* Material cost breakdown section */}
              {componentCosts.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-md border mb-4">
                  <h3 className="text-sm font-medium mb-2">Material Cost Breakdown</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground">
                      <div>Component</div>
                      <div>Consumption (m)</div>
                      <div>Rate (₹/m)</div>
                      <div>Cost (₹)</div>
                    </div>
                    {componentCosts.map((item, i) => (
                      <div key={i} className="grid grid-cols-4 gap-2 text-sm">
                        <div>{item.name}</div>
                        <div>{item.consumption.toFixed(2)}</div>
                        <div>₹{item.rate.toFixed(2)}</div>
                        <div className="font-medium">₹{item.cost.toFixed(2)}</div>
                      </div>
                    ))}
                    <div className="border-t pt-2 grid grid-cols-4 gap-2 text-sm">
                      <div className="col-span-3 text-right font-medium">Total Material Cost:</div>
                      <div className="font-bold">₹{parseFloat(productData.material_cost).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              )}

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
                    className={componentCosts.length > 0 ? "bg-slate-50 font-medium" : ""}
                    readOnly={componentCosts.length > 0}
                  />
                  <p className="text-xs text-muted-foreground">
                    {componentCosts.length > 0 
                      ? "Auto-calculated from component materials and consumption"
                      : "Edit this value directly or link materials to components"}
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
                    className="bg-muted font-medium"
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
                      type="text"
                      inputMode="decimal"
                      value={productData.selling_rate}
                      onChange={handleProductChange}
                      placeholder="Selling price per bag"
                      className="independent-input"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter any value or leave empty. This field is freely editable.
                    </p>
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
                      Enter margin percentage. Final calculations will be done when you update the product.
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
              onClick={() => window.location.href = `${window.location.origin}/#/inventory/catalog/${id}`}
            >
              Cancel
            </Button>
            {/* Debug button for testing formula state */}
            <Button
              type="button"
              variant="outline"
              onClick={() => testManualFormulas(components, customComponents)}
              className="bg-blue-100 hover:bg-blue-200 text-blue-800"
            >
              Test Formula State
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
