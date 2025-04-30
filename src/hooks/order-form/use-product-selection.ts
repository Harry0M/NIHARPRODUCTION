
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { OrderFormData, Component } from "@/types/order";

export function useProductSelection(
  selectedProductId: string | null,
  setSelectedProductId: (id: string | null) => void,
  orderDetails: OrderFormData,
  setOrderDetails: React.Dispatch<React.SetStateAction<OrderFormData>>,
  setComponents: React.Dispatch<React.SetStateAction<Record<string, any>>>,
  setCustomComponents: React.Dispatch<React.SetStateAction<Component[]>>
) {
  // Fetch catalog product details when a product is selected
  const { data: selectedProduct } = useQuery({
    queryKey: ['catalog-product', selectedProductId],
    queryFn: async () => {
      if (!selectedProductId) return null;
      
      const { data, error } = await supabase
        .from('catalog')
        .select(`
          *,
          catalog_components(*)
        `)
        .eq('id', selectedProductId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProductId,
  });

  // Update components when product data changes
  useEffect(() => {
    if (selectedProduct && selectedProduct.catalog_components) {
      processCatalogComponents(selectedProduct.catalog_components);
      
      // Auto-fill the bag dimensions and rate
      setOrderDetails(prev => ({
        ...prev,
        bag_length: selectedProduct.bag_length?.toString() || prev.bag_length,
        bag_width: selectedProduct.bag_width?.toString() || prev.bag_width,
        rate: selectedProduct.default_rate?.toString() || prev.rate,
      }));
    }
  }, [selectedProduct]);

  const processCatalogComponents = (catalogComponents: any[]) => {
    console.log("Processing catalog components:", catalogComponents);
    
    if (!catalogComponents || catalogComponents.length === 0) {
      console.log("No components to process");
      return;
    }
    
    // Get order quantity multiplier
    const orderQuantity = parseInt(orderDetails.quantity) || 1;
    
    // Clear existing components first
    const standardTypes = ['part', 'border', 'handle', 'chain', 'runner'];
    const newOrderComponents: Record<string, any> = {};
    const newCustomComponents: Component[] = [];

    catalogComponents.forEach(component => {
      if (!component) return;
      
      // Extract length and width from size format "length x width"
      let length = '', width = '';
      if (component.size) {
        const sizeValues = component.size.split('x').map((s: string) => s.trim());
        length = sizeValues[0] || '';
        width = sizeValues[1] || '';
      } else {
        length = component.length?.toString() || '';
        width = component.width?.toString() || '';
      }
      
      // Calculate consumption based on order quantity
      let consumption = '';
      if (component.consumption) {
        consumption = (parseFloat(component.consumption.toString()) * orderQuantity).toFixed(2);
      }
      
      if (component.component_type === 'custom' || !standardTypes.includes(component.component_type)) {
        newCustomComponents.push({
          id: crypto.randomUUID(),
          type: 'custom',
          customName: component.custom_name || component.component_type,
          color: component.color || '',
          gsm: component.gsm?.toString() || '',
          length,
          width,
          material_id: component.material_id || '',
          roll_width: component.roll_width?.toString() || '',
          consumption
        });
      } else if (standardTypes.includes(component.component_type)) {
        newOrderComponents[component.component_type] = {
          id: crypto.randomUUID(),
          type: component.component_type,
          color: component.color || '',
          gsm: component.gsm?.toString() || '',
          length,
          width,
          material_id: component.material_id || '',
          roll_width: component.roll_width?.toString() || '',
          consumption
        };
      }
    });

    console.log("Setting standard components:", newOrderComponents);
    console.log("Setting custom components:", newCustomComponents);

    // Replace all components with the new ones
    setComponents(newOrderComponents);
    setCustomComponents(newCustomComponents);
  };

  const handleProductSelect = (productId: string) => {
    console.log("Selected product ID:", productId);
    setSelectedProductId(productId);
    // The rest will be handled by the useEffect that watches selectedProduct
  };

  const updateComponentConsumptions = (quantityStr: string) => {
    const quantity = parseInt(quantityStr) || 1;
    
    // Ignore if no components are loaded or no product is selected
    if (!selectedProduct || !selectedProduct.catalog_components) return;
    
    // Update standard components
    setComponents(prevComponents => {
      const updatedComponents = {...prevComponents};
      
      Object.keys(updatedComponents).forEach(type => {
        const component = updatedComponents[type];
        const catalogComponent = selectedProduct.catalog_components.find(
          (c: any) => c.component_type === type
        );
        
        if (catalogComponent && component) {
          const baseConsumption = parseFloat(catalogComponent.consumption.toString()) || 0;
          const newConsumption = (baseConsumption * quantity).toFixed(2);
          updatedComponents[type] = {
            ...component,
            consumption: newConsumption
          };
        }
      });
      
      return updatedComponents;
    });
    
    // Update custom components
    setCustomComponents(prevCustomComponents => {
      return prevCustomComponents.map(component => {
        const catalogComponent = selectedProduct.catalog_components.find(
          (c: any) => c.component_type === 'custom' && c.custom_name === component.customName
        );
        
        if (catalogComponent) {
          const baseConsumption = parseFloat(catalogComponent.consumption.toString()) || 0;
          const newConsumption = (baseConsumption * quantity).toFixed(2);
          return {
            ...component,
            consumption: newConsumption
          };
        }
        
        return component;
      });
    });
  };

  return {
    selectedProduct,
    handleProductSelect,
    updateComponentConsumptions
  };
}
