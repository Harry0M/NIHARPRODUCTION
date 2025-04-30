import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { OrderFormData } from "@/types/order";
import { useQuery } from "@tanstack/react-query";

interface Component {
  id: string;
  type: string;
  customName?: string;
  color?: string;
  gsm?: string;
  length?: string;
  width?: string;
  material_id?: string;
  roll_width?: string;
  consumption?: string;
}

interface FormErrors {
  company?: string;
  quantity?: string;
  bag_length?: string;
  bag_width?: string;
  order_date?: string;
}

interface UseOrderFormReturn {
  orderDetails: OrderFormData;
  components: Record<string, any>;
  customComponents: Component[];
  submitting: boolean;
  formErrors: FormErrors;
  totalMaterialCost: number;
  handleOrderChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { 
    target: { name: string; value: string | null } 
  }) => void;
  handleComponentChange: (type: string, field: string, value: string) => void;
  handleCustomComponentChange: (index: number, field: string, value: string) => void;
  addCustomComponent: () => void;
  removeCustomComponent: (index: number) => void;
  handleProductSelect: (productId: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<string | undefined>;
  validateForm: () => boolean;
}

export function useOrderForm(): UseOrderFormReturn {
  const [submitting, setSubmitting] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderFormData>({
    company_name: "",
    company_id: null,
    quantity: "",
    bag_length: "",
    bag_width: "",
    rate: "",
    special_instructions: "",
    sales_account_id: null,
    order_date: new Date().toISOString().split('T')[0]
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [components, setComponents] = useState<Record<string, any>>({});
  const [customComponents, setCustomComponents] = useState<Component[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [totalMaterialCost, setTotalMaterialCost] = useState<number>(0);
  
  // Fetch inventory data for calculations
  const { data: inventoryItems } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
  });

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

  // Calculate total material cost whenever components or quantity changes
  useEffect(() => {
    calculateTotalMaterialCost();
  }, [components, customComponents, orderDetails.quantity, inventoryItems]);

  const calculateTotalMaterialCost = () => {
    if (!inventoryItems) return;
    
    let totalCost = 0;
    const orderQuantity = parseInt(orderDetails.quantity) || 0;
    
    // Calculate cost from standard components
    Object.values(components).forEach(component => {
      if (component.material_id && component.consumption) {
        const material = inventoryItems.find(item => item.id === component.material_id);
        if (material && material.purchase_price) {
          const consumption = parseFloat(component.consumption) || 0;
          totalCost += consumption * parseFloat(material.purchase_price);
        }
      }
    });
    
    // Calculate cost from custom components
    customComponents.forEach(component => {
      if (component.material_id && component.consumption) {
        const material = inventoryItems.find(item => item.id === component.material_id);
        if (material && material.purchase_price) {
          const consumption = parseFloat(component.consumption) || 0;
          totalCost += consumption * parseFloat(material.purchase_price);
        }
      }
    });
    
    setTotalMaterialCost(totalCost);
  };

  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { 
    target: { name: string; value: string | null } 
  }) => {
    const { name, value } = e.target;
    
    // Handle special case for sales_account_id
    if (name === 'sales_account_id') {
      setOrderDetails(prev => ({
        ...prev,
        [name]: value === 'none' ? null : value
      }));
    } else {
      setOrderDetails(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // If we're changing the quantity, update component consumption values if BOM is selected
    if (name === 'quantity' && selectedProduct) {
      updateComponentConsumptions(value);
    }
    
    // Clear validation error when field is changed
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const updateComponentConsumptions = (quantityStr: string) => {
    const quantity = parseInt(quantityStr) || 1;
    
    // Ignore if no components are loaded or no product is selected
    if (!selectedProduct || !selectedProduct.catalog_components) return;
    
    // Update standard components
    const updatedComponents = {...components};
    
    Object.keys(updatedComponents).forEach(type => {
      const component = updatedComponents[type];
      const catalogComponent = selectedProduct.catalog_components.find(c => c.component_type === type);
      
      if (catalogComponent && component) {
        const baseConsumption = catalogComponent.consumption || 0;
        const newConsumption = (baseConsumption * quantity).toFixed(2);
        updatedComponents[type] = {
          ...component,
          consumption: newConsumption
        };
      }
    });
    
    setComponents(updatedComponents);
    
    // Update custom components
    const updatedCustomComponents = customComponents.map(component => {
      const catalogComponent = selectedProduct.catalog_components.find(
        c => c.component_type === 'custom' && c.custom_name === component.customName
      );
      
      if (catalogComponent) {
        const baseConsumption = catalogComponent.consumption || 0;
        const newConsumption = (baseConsumption * quantity).toFixed(2);
        return {
          ...component,
          consumption: newConsumption
        };
      }
      
      return component;
    });
    
    setCustomComponents(updatedCustomComponents);
  };

  const handleComponentChange = (type: string, field: string, value: string) => {
    setComponents(prev => {
      const component = prev[type] || { 
        id: uuidv4(),
        type 
      };
      
      const updatedComponent = {
        ...component,
        [field]: value
      };
      
      // Recalculate consumption if length, width or roll_width changes
      if ((field === 'length' || field === 'width' || field === 'roll_width') && 
          updatedComponent.length && updatedComponent.width && updatedComponent.roll_width) {
        const length = parseFloat(updatedComponent.length);
        const width = parseFloat(updatedComponent.width);
        const rollWidth = parseFloat(updatedComponent.roll_width);
        
        if (!isNaN(length) && !isNaN(width) && !isNaN(rollWidth) && rollWidth > 0) {
          const orderQuantity = parseInt(orderDetails.quantity) || 1;
          updatedComponent.consumption = ((length * width) / (rollWidth * 39.39) * orderQuantity).toFixed(2);
        }
      }
      
      return {
        ...prev,
        [type]: updatedComponent
      };
    });
  };

  const handleCustomComponentChange = (index: number, field: string, value: string) => {
    setCustomComponents(prev => {
      const updated = [...prev];
      
      // Update the specified field
      updated[index] = { 
        ...updated[index], 
        [field]: value 
      };
      
      // Recalculate consumption if needed
      if ((field === 'length' || field === 'width' || field === 'roll_width') && 
          updated[index].length && updated[index].width && updated[index].roll_width) {
        const length = parseFloat(updated[index].length);
        const width = parseFloat(updated[index].width);
        const rollWidth = parseFloat(updated[index].roll_width);
        
        if (!isNaN(length) && !isNaN(width) && !isNaN(rollWidth) && rollWidth > 0) {
          const orderQuantity = parseInt(orderDetails.quantity) || 1;
          updated[index].consumption = ((length * width) / (rollWidth * 39.39) * orderQuantity).toFixed(2);
        }
      }
      
      return updated;
    });
  };

  const addCustomComponent = () => {
    setCustomComponents([
      ...customComponents, 
      { 
        id: uuidv4(),
        type: "custom",
        customName: "" 
      }
    ]);
  };

  const removeCustomComponent = (index: number) => {
    setCustomComponents(prev => prev.filter((_, i) => i !== index));
  };

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
        consumption = (component.consumption * orderQuantity).toFixed(2);
      }
      
      if (component.component_type === 'custom' || !standardTypes.includes(component.component_type)) {
        newCustomComponents.push({
          id: uuidv4(),
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
          id: uuidv4(),
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

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    // Validate company information
    if (!orderDetails.company_name && !orderDetails.company_id) {
      errors.company = "Company name is required";
      isValid = false;
    }

    // Validate quantity
    if (!orderDetails.quantity || parseFloat(orderDetails.quantity) <= 0) {
      errors.quantity = "Valid quantity is required";
      isValid = false;
    }

    // Validate bag length
    if (!orderDetails.bag_length || parseFloat(orderDetails.bag_length) <= 0) {
      errors.bag_length = "Valid bag length is required";
      isValid = false;
    }

    // Validate bag width
    if (!orderDetails.bag_width || parseFloat(orderDetails.bag_width) <= 0) {
      errors.bag_width = "Valid bag width is required";
      isValid = false;
    }

    // Validate order date
    if (!orderDetails.order_date) {
      errors.order_date = "Order date is required";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const updateInventoryStock = async () => {
    // Skip if no inventory items are loaded
    if (!inventoryItems) return;
    
    // Collect all materials and their consumption
    const materialUsage: Record<string, number> = {};
    
    // Process standard components
    Object.values(components).forEach(comp => {
      if (comp.material_id && comp.consumption) {
        const materialId = comp.material_id;
        const consumption = parseFloat(comp.consumption);
        
        if (!isNaN(consumption)) {
          if (!materialUsage[materialId]) {
            materialUsage[materialId] = consumption;
          } else {
            materialUsage[materialId] += consumption;
          }
        }
      }
    });
    
    // Process custom components
    customComponents.forEach(comp => {
      if (comp.material_id && comp.consumption) {
        const materialId = comp.material_id;
        const consumption = parseFloat(comp.consumption);
        
        if (!isNaN(consumption)) {
          if (!materialUsage[materialId]) {
            materialUsage[materialId] = consumption;
          } else {
            materialUsage[materialId] += consumption;
          }
        }
      }
    });
    
    // Update inventory for each used material
    for (const [materialId, usage] of Object.entries(materialUsage)) {
      try {
        // Get current inventory level
        const { data: material, error: fetchError } = await supabase
          .from('inventory')
          .select('quantity')
          .eq('id', materialId)
          .single();
        
        if (fetchError) {
          console.error(`Error fetching inventory for material ${materialId}:`, fetchError);
          continue;
        }
        
        // Calculate new quantity
        const currentQuantity = material.quantity || 0;
        const newQuantity = currentQuantity - usage;
        
        // Update inventory
        const { error: updateError } = await supabase
          .from('inventory')
          .update({ quantity: newQuantity >= 0 ? newQuantity : 0 })
          .eq('id', materialId);
        
        if (updateError) {
          console.error(`Error updating inventory for material ${materialId}:`, updateError);
        } else {
          console.log(`Updated inventory for material ${materialId}: ${currentQuantity} - ${usage} = ${newQuantity}`);
        }
      } catch (error) {
        console.error(`Error processing material ${materialId}:`, error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<string | undefined> => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      toast({
        title: "Form validation failed",
        description: "Please correct the highlighted fields",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Prepare data for database insert
      const orderData = {
        company_name: orderDetails.company_id ? null : orderDetails.company_name,
        company_id: orderDetails.company_id,
        quantity: parseInt(orderDetails.quantity),
        bag_length: parseFloat(orderDetails.bag_length),
        bag_width: parseFloat(orderDetails.bag_width),
        rate: orderDetails.rate ? parseFloat(orderDetails.rate) : null,
        order_date: orderDetails.order_date,
        sales_account_id: orderDetails.sales_account_id || null,
        special_instructions: orderDetails.special_instructions || null
      };

      console.log("Submitting order data:", orderData);
      
      // Insert the order - using type assertion to bypass the order_number requirement
      // since this is auto-generated by the database trigger
      const { data: orderResult, error: orderError } = await supabase
        .from("orders")
        .insert(orderData as any)
        .select('id, order_number')
        .single();
      
      if (orderError) {
        console.error("Order insertion error:", orderError);
        throw orderError;
      }
      
      console.log("Order created successfully:", orderResult);
      
      // Process components if any exist
      const allComponents = [
        ...Object.values(components).filter(Boolean),
        ...customComponents
      ].filter(Boolean);
      
      console.log("Components to be saved:", allComponents);
      
      if (allComponents.length > 0) {
        const componentsToInsert = allComponents.map(comp => ({
          order_id: orderResult.id,
          component_type: comp.type === 'custom' ? 'custom' : comp.type,
          size: comp.length && comp.width ? `${comp.length}x${comp.width}` : null,
          color: comp.color || null,
          gsm: comp.gsm || null,
          custom_name: comp.type === 'custom' ? comp.customName : null,
          material_id: comp.material_id || null,
          roll_width: comp.roll_width ? parseFloat(comp.roll_width) : null,
          consumption: comp.consumption ? parseFloat(comp.consumption) : null
        }));

        console.log("Inserting components:", componentsToInsert);

        const { error: componentsError } = await supabase
          .from("order_components")
          .insert(componentsToInsert);
        
        if (componentsError) {
          console.error("Error saving components:", componentsError);
          toast({
            title: "Error saving components",
            description: componentsError.message,
            variant: "destructive"
          });
        } else {
          console.log("Components saved successfully");
          
          // Update inventory stock levels
          await updateInventoryStock();
        }
      }
      
      toast({
        title: "Order created successfully",
        description: `Order number: ${orderResult.order_number}`
      });

      return orderResult.id;
      
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast({
        title: "Error creating order",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    orderDetails,
    components,
    customComponents,
    submitting,
    formErrors,
    totalMaterialCost,
    handleOrderChange,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent,
    handleProductSelect,
    handleSubmit,
    validateForm
  };
}
