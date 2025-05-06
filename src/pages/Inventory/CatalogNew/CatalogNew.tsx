
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/enhanced-toast";
import { supabase } from "@/integrations/supabase/client";

import ProductDetailsForm from "./components/ProductDetailsForm";
import ComponentsManager from "./components/ComponentsManager";
import CostCalculationForm from "./components/CostCalculationForm";
import { useProductForm } from "./hooks/useProductForm";
import { ComponentProvider } from "./context/ComponentContext";

const CatalogNew = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [navigationTriggered, setNavigationTriggered] = useState(false);
  
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

  // Effect to handle navigation after successful submission
  useEffect(() => {
    if (navigationTriggered) {
      const redirectTimer = setTimeout(() => {
        navigate("/inventory/catalog");
      }, 100);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [navigationTriggered, navigate]);

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
    
    try {
      // Show loading toast to indicate progress
      const loadingToastId = showToast({
        title: "Creating product...",
        description: "Please wait while we save your product",
        type: "info"
      }).id;
      
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
      
      // Insert the product with timeout to prevent UI freeze
      const productPromise = new Promise<{id: string}>((resolve, reject) => {
        setTimeout(async () => {
          try {
            const { data, error } = await supabase
              .from("catalog")
              .insert(productDbData)
              .select('id')
              .single();
            
            if (error) {
              reject(error);
            } else {
              resolve(data);
            }
          } catch (error) {
            reject(error);
          }
        }, 0);
      });
      
      // Wait for product insert to complete
      const productResult = await productPromise;
      
      // Update toast to show progress
      showToast({
        title: "Product created, saving components...",
        description: "Almost done!",
        type: "info",
        id: loadingToastId
      });
      
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

        // Insert components with a slight delay to improve UI responsiveness
        await new Promise<void>((resolve) => {
          setTimeout(async () => {
            try {
              await supabase.from("catalog_components").insert(componentsToInsert);
              resolve();
            } catch (error) {
              console.error("Error saving components:", error);
              resolve(); // Continue even if there's an error with components
            }
          }, 0);
        });
      }
      
      // Success toast
      showToast({
        title: "Product created successfully",
        description: `${formattedName} has been added to the catalog`,
        type: "success",
        id: loadingToastId
      });
      
      // Trigger navigation through state to ensure it happens after state updates
      setNavigationTriggered(true);
      
      // Fallback navigation after a timeout in case the useEffect doesn't trigger
      setTimeout(() => {
        if (window.location.pathname.includes('/catalog/new')) {
          window.location.href = "/inventory/catalog";
        }
      }, 500);
      
    } catch (error: any) {
      setSubmitting(false);
      showToast({
        title: "Error creating product",
        description: error.message || "An unexpected error occurred",
        type: "error"
      });
    }
  };

  // Safely handle navigation with fallback
  const handleCancel = () => {
    if (submitting) return;
    navigate("/inventory/catalog");
  };

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
              onClick={handleCancel}
              disabled={submitting}
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
            onCancel={handleCancel}
          />
        </form>
      </div>
    </ComponentProvider>
  );
};

export default CatalogNew;
