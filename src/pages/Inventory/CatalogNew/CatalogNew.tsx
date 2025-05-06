
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/enhanced-toast";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

import ProductDetailsForm from "./components/ProductDetailsForm";
import ComponentsManager from "./components/ComponentsManager";
import CostCalculationForm from "./components/CostCalculationForm";
import { useProductForm } from "./hooks/useProductForm";
import { ComponentProvider } from "./context/ComponentContext";

const CatalogNew = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  
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
    removeCustomComponent
  } = useProductForm();

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
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    // Show a loading toast to indicate the process has started
    const loadingToast = showToast({
      title: "Saving product...",
      description: "Please wait while we create your product",
      type: "info",
      duration: 10000 // Long duration while saving
    });
    
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
        material_cost: parseFloat(productData.material_cost) || 0,
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
          material_linked: comp.material_id ? true : false,
          consumption: comp.consumption || null  // Save the calculated consumption
        }));

        // Insert components
        const { error: componentsError } = await supabase
          .from("catalog_components")
          .insert(componentsToInsert);
        
        if (componentsError) {
          throw componentsError;
        }
      }
      
      // Clear the previous toast
      if (loadingToast) {
        loadingToast.dismiss();
      }
      
      // Show success toast
      showToast({
        title: "Product created successfully",
        description: `${formattedName} has been added to the catalog`,
        type: "success"
      });

      // Set a timeout to ensure navigation happens even if other processes are slow
      setTimeout(() => {
        // Try React Router navigation first
        navigate("/inventory/catalog");
        
        // Use a fallback for navigation after a short delay
        setTimeout(() => {
          window.location.href = "/inventory/catalog";
        }, 500);
      }, 100);
      
    } catch (error: any) {
      // Clear the loading toast
      if (loadingToast) {
        loadingToast.dismiss();
      }
      
      // Show error toast
      showToast({
        title: "Error creating product",
        description: error.message || "An unexpected error occurred",
        type: "error"
      });
      
      console.error("Product creation error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Navigation safety - if the component unmounts during submission,
  // ensure we redirect to the catalog list
  useEffect(() => {
    return () => {
      if (submitting) {
        // Attempting to navigate if we're in a submitting state when unmounting
        try {
          navigate("/inventory/catalog");
        } catch (e) {
          console.error("Navigation failed during cleanup:", e);
          // Fallback
          window.location.href = "/inventory/catalog";
        }
      }
    };
  }, [submitting, navigate]);

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
            onCancel={() => navigate("/inventory/catalog")}
          />
        </form>
      </div>
    </ComponentProvider>
  );
};

export default CatalogNew;
