import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { ProductDetailsForm } from "./ProductDetailsForm";
import { ComponentsSection } from "./ComponentsSection";
import { CostCalculationSection } from "./CostCalculationSection";
import { useCatalogForm } from "./hooks/useCatalogForm";
import { Component } from "./types";

const CatalogNew = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;
  
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Fetch inventory materials
  const { data: materials, isLoading: materialsLoading } = useQuery({
    queryKey: ['inventory-materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
  });
  
  // Fetch product data if in edit mode
  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ['catalog-product', id],
    queryFn: async () => {
      if (!id) return null;
      
      // Fetch product details
      const { data: productDetails, error: productError } = await supabase
        .from('catalog')
        .select('*')
        .eq('id', id)
        .single();
      
      if (productError) throw productError;
      
      // Fetch product components
      const { data: componentDetails, error: componentError } = await supabase
        .from('catalog_components')
        .select('*')
        .eq('catalog_id', id);
      
      if (componentError) throw componentError;
      
      return {
        product: productDetails,
        components: componentDetails
      };
    },
    enabled: isEditMode
  });
  
  // Use our custom hook to manage form state and calculations
  const {
    productDetails,
    setProductDetails,
    components,
    setComponents,
    customComponents,
    setCustomComponents,
    materialCost,
    totalCost,
    handleProductChange,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent,
    usedMaterials
  } = useCatalogForm(materials || []);
  
  // Populate form with existing data when in edit mode
  useEffect(() => {
    if (isEditMode && productData && !productLoading) {
      // Set product details
      setProductDetails({
        name: productData.product.name,
        description: productData.product.description || "",
        bag_length: Number(productData.product.bag_length),
        bag_width: Number(productData.product.bag_width),
        height: Number(productData.product.height) || 0,
        default_quantity: Number(productData.product.default_quantity) || 1,
        default_rate: Number(productData.product.default_rate) || 0,
        cutting_charge: Number(productData.product.cutting_charge) || 0,
        printing_charge: Number(productData.product.printing_charge) || 0,
        stitching_charge: Number(productData.product.stitching_charge) || 0,
        transport_charge: Number(productData.product.transport_charge) || 0
      });
      
      // Set components
      const standardComponents: Record<string, any> = {};
      const customComponentsList: CustomComponent[] = [];
      
      productData.components.forEach((comp: any) => {
        const componentData = {
          id: comp.id,
          component_type: comp.component_type,
          type: (comp.component_type || 'custom') as "part" | "border" | "handle" | "chain" | "runner" | "custom",
          length: comp.length ? comp.length.toString() : "",
          width: comp.width ? comp.width.toString() : "",
          color: comp.color || "",
          gsm: comp.gsm ? comp.gsm.toString() : "",
          material_id: comp.material_id || "",
          roll_width: comp.roll_width ? comp.roll_width.toString() : "",
          consumption: comp.consumption ? comp.consumption.toString() : ""
        };
        
        // Categorize as standard or custom component
        if (comp.custom_name) {
          customComponentsList.push({
            ...componentData,
            custom_name: comp.custom_name
          });
        } else {
          standardComponents[comp.component_type] = componentData;
        }
      });
      
      setComponents(standardComponents);
      setCustomComponents(customComponentsList);
    }
  }, [isEditMode, productData, productLoading, setProductDetails, setComponents, setCustomComponents]);
  
  // Server-side validation function
  const validateProductData = () => {
    const errors: string[] = [];
    
    // Required product details
    if (!productDetails.name.trim()) {
      errors.push("Product name is required");
    }
    
    if (!productDetails.bag_length) {
      errors.push("Bag length is required");
    } else if (isNaN(Number(productDetails.bag_length)) || Number(productDetails.bag_length) <= 0) {
      errors.push("Bag length must be a positive number");
    }
    
    if (!productDetails.bag_width) {
      errors.push("Bag width is required");
    } else if (isNaN(Number(productDetails.bag_width)) || Number(productDetails.bag_width) <= 0) {
      errors.push("Bag width must be a positive number");
    }
    
    if (!productDetails.height && productDetails.height !== 0) {
      errors.push("Border height is required");
    } else if (isNaN(Number(productDetails.height)) || Number(productDetails.height) < 0) {
      errors.push("Border height must be a non-negative number");
    }
    
    // Validate numeric fields
    if (productDetails.default_quantity && (isNaN(Number(productDetails.default_quantity)) || Number(productDetails.default_quantity) < 1)) {
      errors.push("Default quantity must be a positive integer");
    }
    
    if (productDetails.default_rate && (isNaN(Number(productDetails.default_rate)) || Number(productDetails.default_rate) < 0)) {
      errors.push("Default rate must be a non-negative number");
    }
    
    // Validate components
    const allComponents = [
      ...Object.values(components).filter(Boolean),
      ...customComponents
    ].filter(Boolean);
    
    // Check for custom components without names
    customComponents.forEach((comp, index) => {
      if (!comp.custom_name || comp.custom_name.trim() === '') {
        errors.push(`Custom component #${index + 1} requires a name`);
      }
    });
    
    // Check for components with invalid measurements
    allComponents.forEach(comp => {
      const componentName = comp.type === 'custom' ? comp.custom_name || 'Custom component' : comp.type;
      
      if (comp.length && (isNaN(parseFloat(comp.length as string)) || parseFloat(comp.length as string) <= 0)) {
        errors.push(`${componentName}: Length must be a positive number`);
      }
      
      if (comp.width && (isNaN(parseFloat(String(comp.width))) || parseFloat(String(comp.width)) <= 0)) {
        errors.push(`${componentName}: Width must be a positive number`);
      }
      
      if (comp.roll_width && (isNaN(parseFloat(String(comp.roll_width))) || parseFloat(String(comp.roll_width)) <= 0)) {
        errors.push(`${componentName}: Roll width must be a positive number`);
      }
    });
    
    return errors;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Perform server-side validation
    const errors = validateProductData();
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      // Display validation errors
      toast({
        title: "Validation errors",
        description: (
          <ul className="list-disc pl-4 mt-2 space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm">{error}</li>
            ))}
          </ul>
        ),
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      const productPayload = {
        name: productDetails.name,
        description: productDetails.description,
        bag_length: Number(productDetails.bag_length),
        bag_width: Number(productDetails.bag_width),
        height: Number(productDetails.height),
        default_quantity: productDetails.default_quantity ? Number(productDetails.default_quantity) : 1,
        default_rate: productDetails.default_rate ? Number(productDetails.default_rate) : null,
        cutting_charge: productDetails.cutting_charge ? Number(productDetails.cutting_charge) : 0,
        printing_charge: productDetails.printing_charge ? Number(productDetails.printing_charge) : 0,
        stitching_charge: productDetails.stitching_charge ? Number(productDetails.stitching_charge) : 0,
        transport_charge: productDetails.transport_charge ? Number(productDetails.transport_charge) : 0,
        total_cost: totalCost > 0 ? totalCost : null,
      };
      
      let catalogId = id;
      
      if (isEditMode) {
        // Update existing product
        const { error: catalogError } = await supabase
          .from("catalog")
          .update({
            ...productPayload,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
        
        if (catalogError) {
          throw catalogError;
        }
        
        // Delete existing components to replace with new ones
        const { error: deleteComponentsError } = await supabase
          .from("catalog_components")
          .delete()
          .eq('catalog_id', id);
        
        if (deleteComponentsError) {
          throw deleteComponentsError;
        }
      } else {
        // Insert new product
        const { data: catalogData, error: catalogError } = await supabase
          .from("catalog")
          .insert({
            ...productPayload,
            created_by: userData.user?.id
          })
          .select('id')
          .single();
        
        if (catalogError) {
          if (catalogError.code === '23505') { // Unique constraint violation
            toast({
              title: "Product already exists",
              description: "A product with this name already exists. Please choose a different name.",
              variant: "destructive"
            });
            setSubmitting(false);
            return;
          }
          throw catalogError;
        }
        
        catalogId = catalogData.id;
      }
      
      // Prepare component data for insertion
      const allComponents = [
        ...Object.values(components).filter(Boolean),
        ...customComponents
      ].filter(Boolean);
      
      if (allComponents.length > 0 && catalogId) {
        const componentsToInsert = allComponents.map(comp => ({
          catalog_id: catalogId,
          component_type: comp.type === 'custom' ? comp.custom_name : comp.type,
          size: comp.length && comp.width ? `${comp.length}x${comp.width}` : null,
          length: comp.length ? Number(comp.length) : null,
          width: comp.width ? Number(comp.width) : null,
          color: comp.color || null,
          gsm: comp.gsm ? Number(comp.gsm) : null,
          custom_name: comp.type === 'custom' ? comp.custom_name : null,
          material_id: comp.material_id && comp.material_id !== 'not_applicable' ? comp.material_id : null,
          roll_width: comp.roll_width ? Number(comp.roll_width) : null,
          consumption: comp.consumption ? Number(comp.consumption) : null
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
        title: isEditMode ? "Product updated successfully" : "Product created successfully",
        description: `Product "${productDetails.name}" has been ${isEditMode ? 'updated in' : 'added to'} catalog`
      });
      
      // Navigate to the catalog list
      navigate("/inventory/catalog");
      
    } catch (error: any) {
      console.error(isEditMode ? "Error updating product:" : "Error creating product:", error);
      
      // Handle specific server-side validation errors from Supabase
      if (error.code === '23514') { // Check constraint violation
        toast({
          title: "Validation error",
          description: "One or more values failed server-side validation. Please check your input and try again.",
          variant: "destructive"
        });
      } else if (error.code === '23502') { // Not null violation
        toast({
          title: "Missing required field",
          description: "A required field is missing. Please check your input and try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: isEditMode ? "Error updating product" : "Error creating product",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if ((isEditMode && productLoading) || materialsLoading) {
    return (
      <div className="flex justify-center items-center p-8 h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
            onClick={() => navigate("/inventory/catalog")}
            className="gap-1"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditMode ? 'Edit Product (BOM)' : 'New Product (BOM)'}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode ? 'Modify existing product details and bill of materials' : 'Add a new product to your catalog with bill of materials'}
            </p>
          </div>
        </div>
      </div>
      
      {validationErrors.length > 0 && (
        <Card className="bg-destructive/10 border-destructive">
          <div className="p-4">
            <h2 className="font-semibold text-destructive">Please fix the following errors:</h2>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm text-destructive">{error}</li>
              ))}
            </ul>
          </div>
        </Card>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <ProductDetailsForm
          productDetails={productDetails}
          handleProductChange={handleProductChange}
        />
        
        <ComponentsSection
          components={components}
          customComponents={customComponents}
          handleComponentChange={handleComponentChange}
          handleCustomComponentChange={handleCustomComponentChange}
          addCustomComponent={addCustomComponent}
          removeCustomComponent={removeCustomComponent}
        />
        
        <CostCalculationSection
          usedMaterials={usedMaterials()}
          materialCost={materialCost}
          totalCost={totalCost}
          productDetails={productDetails}
          handleProductChange={handleProductChange}
          allMaterials={materials || []}
        />
        
        <Card>
          <CardFooter>
            <div className="flex justify-end gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/inventory/catalog")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (isEditMode ? "Updating..." : "Saving...") : (isEditMode ? "Update Product" : "Save Product (BOM)")}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default CatalogNew;
