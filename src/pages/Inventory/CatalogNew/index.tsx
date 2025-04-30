
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

const CatalogNew = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Fetch inventory materials
  const { data: materials } = useQuery({
    queryKey: ['inventory-materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
  });
  
  // Use our custom hook to manage form state and calculations
  const {
    productDetails,
    components,
    customComponents,
    materialCost,
    totalCost,
    handleProductChange,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent,
    usedMaterials
  } = useCatalogForm(materials);
  
  // Server-side validation function
  const validateProductData = () => {
    const errors: string[] = [];
    
    // Required product details
    if (!productDetails.name.trim()) {
      errors.push("Product name is required");
    }
    
    if (!productDetails.bag_length) {
      errors.push("Bag length is required");
    } else if (isNaN(parseFloat(productDetails.bag_length)) || parseFloat(productDetails.bag_length) <= 0) {
      errors.push("Bag length must be a positive number");
    }
    
    if (!productDetails.bag_width) {
      errors.push("Bag width is required");
    } else if (isNaN(parseFloat(productDetails.bag_width)) || parseFloat(productDetails.bag_width) <= 0) {
      errors.push("Bag width must be a positive number");
    }
    
    // Validate numeric fields
    if (productDetails.default_quantity && (isNaN(parseInt(productDetails.default_quantity)) || parseInt(productDetails.default_quantity) < 1)) {
      errors.push("Default quantity must be a positive integer");
    }
    
    if (productDetails.default_rate && (isNaN(parseFloat(productDetails.default_rate)) || parseFloat(productDetails.default_rate) < 0)) {
      errors.push("Default rate must be a non-negative number");
    }
    
    // Validate components
    const allComponents = [
      ...Object.values(components).filter(Boolean),
      ...customComponents
    ].filter(Boolean);
    
    // Check for custom components without names
    customComponents.forEach((comp, index) => {
      if (!comp.customName || comp.customName.trim() === '') {
        errors.push(`Custom component #${index + 1} requires a name`);
      }
    });
    
    // Check for components with invalid measurements
    allComponents.forEach(comp => {
      const componentName = comp.type === 'custom' ? comp.customName || 'Custom component' : comp.type;
      
      if (comp.length && (isNaN(parseFloat(comp.length)) || parseFloat(comp.length) <= 0)) {
        errors.push(`${componentName}: Length must be a positive number`);
      }
      
      if (comp.width && (isNaN(parseFloat(comp.width)) || parseFloat(comp.width) <= 0)) {
        errors.push(`${componentName}: Width must be a positive number`);
      }
      
      if (comp.roll_width && (isNaN(parseFloat(comp.roll_width)) || parseFloat(comp.roll_width) <= 0)) {
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
      
      // Insert product into catalog table
      const { data: catalogData, error: catalogError } = await supabase
        .from("catalog")
        .insert({
          name,
          description: productDetails.description,
          bag_length: parseFloat(productDetails.bag_length),
          bag_width: parseFloat(productDetails.bag_width),
          default_quantity: productDetails.default_quantity ? parseInt(productDetails.default_quantity) : 1,
          default_rate: productDetails.default_rate ? parseFloat(productDetails.default_rate) : null,
          cutting_charge: productDetails.cutting_charge ? parseFloat(productDetails.cutting_charge) : 0,
          printing_charge: productDetails.printing_charge ? parseFloat(productDetails.printing_charge) : 0,
          stitching_charge: productDetails.stitching_charge ? parseFloat(productDetails.stitching_charge) : 0,
          transport_charge: productDetails.transport_charge ? parseFloat(productDetails.transport_charge) : 0,
          total_cost: totalCost > 0 ? totalCost : null,
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
          length: comp.length ? parseFloat(comp.length) : null,
          width: comp.width ? parseFloat(comp.width) : null,
          color: comp.color || null,
          gsm: comp.gsm ? parseFloat(comp.gsm) : null,
          custom_name: comp.type === 'custom' ? comp.customName : null,
          material_id: comp.material_id && comp.material_id !== 'not_applicable' ? comp.material_id : null,
          roll_width: comp.roll_width ? parseFloat(comp.roll_width) : null,
          consumption: comp.consumption ? parseFloat(comp.consumption) : null
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
        description: `Product "${productDetails.name}" has been added to catalog`
      });
      
      // Navigate to the catalog list
      navigate("/inventory/catalog");
      
    } catch (error: any) {
      console.error("Error creating product:", error);
      
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
          title: "Error creating product",
          description: error.message,
          variant: "destructive"
        });
      }
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
            <h1 className="text-3xl font-bold tracking-tight">New Product (BOM)</h1>
            <p className="text-muted-foreground">Add a new product to your catalog with bill of materials</p>
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
                {submitting ? "Saving..." : "Save Product (BOM)"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default CatalogNew;
