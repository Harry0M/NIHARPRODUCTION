
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
            <h1 className="text-3xl font-bold tracking-tight">New Product (BOM)</h1>
            <p className="text-muted-foreground">Add a new product to your catalog with bill of materials</p>
          </div>
        </div>
      </div>
      
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
