
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/enhanced-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCatalogProducts } from "@/hooks/use-catalog-products";

import ProductDetailsForm from "./components/ProductDetailsForm";
import ComponentsManager from "./components/ComponentsManager";
import CostCalculationForm from "./components/CostCalculationForm";
import { useProductEditForm } from "./hooks/useProductEditForm";
import { ComponentProvider } from "../CatalogNew/context/ComponentContext";

const CatalogEditNew = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  
  const { data: products, isLoading } = useCatalogProducts();
  const product = products?.find((p) => p.id === id);

  const { 
    productData, 
    components, 
    customComponents,
    materialPrices,
    componentCosts,
    totalConsumption,
    existingComponents,
    deletedComponentIds,
    handleProductChange,
    calculateTotalCost,
    fetchMaterialPrice,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent,
    initializeFromProduct
  } = useProductEditForm();

  // Initialize form data when product is loaded
  useEffect(() => {
    if (product) {
      initializeFromProduct(product);
    }
  }, [product, initializeFromProduct]);

  const validateForm = () => {
    if (!productData.name) {
      showToast({
        title: "Validation Error",
        description: "Product name is required",
        type: "error"
      });
      return false;
    }
    
    if (!productData.bag_length || parseFloat(productData.bag_length) <= 0) {
      showToast({
        title: "Validation Error", 
        description: "Valid bag length is required",
        type: "error"
      });
      return false;
    }
    
    if (!productData.bag_width || parseFloat(productData.bag_width) <= 0) {
      showToast({
        title: "Validation Error",
        description: "Valid bag width is required", 
        type: "error"
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
    
    const loadingToast = showToast({
      title: "Updating product...",
      description: "Please wait while we save your changes",
      type: "info",
      duration: 10000
    });
    
    try {
      console.log("Starting product update process...");
      
      const totalCost = calculateTotalCost(productData);
      
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
        cutting_charge: parseFloat(productData.cutting_charge) || 0,
        printing_charge: parseFloat(productData.printing_charge) || 0,
        stitching_charge: parseFloat(productData.stitching_charge) || 0,
        transport_charge: parseFloat(productData.transport_charge) || 0,
        material_cost: parseFloat(productData.material_cost) || 0,
        total_cost: totalCost,
        updated_at: new Date().toISOString()
      };
      
      console.log("Product data to update:", productDbData);
      
      const { error: productError } = await supabase
        .from("catalog")
        .update(productDbData)
        .eq("id", id);
      
      if (productError) {
        console.error("Error updating product data:", productError);
        throw productError;
      }
      
      console.log("Product updated successfully");
      
      // Delete removed components
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
          formula: comp.formula || 'standard',
          updated_at: new Date().toISOString()
        };
        
        console.log(`Component ${comp.id} using formula: ${comp.formula || 'standard'}`);
        
        if (isExisting) {
          console.log(`Updating existing component ${comp.id}:`, comp.type);
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
      
      if (loadingToast) {
        loadingToast.dismiss();
      }
      
      showToast({
        title: "Product updated successfully",
        description: `${productData.name} has been updated in the catalog`,
        type: "success"
      });

      window.location.href = `/inventory/catalog/${id}`;
      
    } catch (error: any) {
      if (loadingToast) {
        loadingToast.dismiss();
      }
      
      showToast({
        title: "Error updating product",
        description: error.message || "An unexpected error occurred",
        type: "error"
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
    <ComponentProvider 
      value={{
        components,
        customComponents,
        materialPrices,
        fetchMaterialPrice,
        handleComponentChange,
        handleCustomComponentChange,
        addCustomComponent,
        removeCustomComponent,
        defaultQuantity: productData.default_quantity
      }}
    >
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
          <ProductDetailsForm 
            productData={productData} 
            handleProductChange={handleProductChange} 
          />
          
          <ComponentsManager totalConsumption={totalConsumption} />
          
          <CostCalculationForm 
            productData={productData} 
            componentCosts={componentCosts} 
            handleProductChange={handleProductChange}
            submitting={submitting}
            onCancel={() => window.location.href = `/inventory/catalog/${id}`}
          />
        </form>
      </div>
    </ComponentProvider>
  );
};

export default CatalogEditNew;
