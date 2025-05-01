
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
import { ValidationErrors } from "./components/ValidationErrors";
import { useCatalogForm } from "./hooks/useCatalogForm";
import { useValidation } from "./hooks/useValidation";
import { useFormSubmission } from "./hooks/useFormSubmission";
import { ProductData } from "./types";

const CatalogNew = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;
  
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
      } as ProductData;
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
  
  // Custom hooks for validation and submission
  const { validateProductData } = useValidation();
  const { submitting, handleSubmit } = useFormSubmission(id, isEditMode);
  
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
      const customComponentsList: any[] = [];
      
      productData.components.forEach((comp: any) => {
        const componentData = {
          id: comp.id,
          type: (comp.component_type === "part" || comp.component_type === "border" || 
                comp.component_type === "handle" || comp.component_type === "chain" || 
                comp.component_type === "runner") 
                ? comp.component_type as "part" | "border" | "handle" | "chain" | "runner" 
                : "custom",
          length: comp.length ? comp.length.toString() : "",
          width: comp.width ? comp.width.toString() : "",
          color: comp.color || "",
          gsm: comp.gsm ? comp.gsm.toString() : "",
          material_id: comp.material_id || "",
          roll_width: comp.roll_width ? comp.roll_width.toString() : "",
          consumption: comp.consumption ? comp.consumption.toString() : "",
          component_type: comp.component_type
        };
        
        // Categorize as standard or custom component
        if (comp.custom_name) {
          customComponentsList.push({
            ...componentData,
            custom_name: comp.custom_name,
            component_type: comp.component_type,
            type: "custom"
          });
        } else if (componentData.type !== "custom") {
          standardComponents[componentData.type] = componentData;
        }
      });
      
      setComponents(standardComponents);
      setCustomComponents(customComponentsList);
    }
  }, [isEditMode, productData, productLoading, setProductDetails, setComponents, setCustomComponents]);
  
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Perform validation
    const errors = validateProductData(productDetails, components, customComponents);
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
    
    // Submit the form
    await handleSubmit(productDetails, components, customComponents, totalCost);
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
      
      <ValidationErrors errors={validationErrors} />
      
      <form onSubmit={onSubmit} className="space-y-6">
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
