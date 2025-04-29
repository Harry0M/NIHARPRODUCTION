
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OrderFormData } from "@/types/order";

export interface ComponentData {
  id?: string;
  type: string;
  length?: string;
  width?: string;
  color?: string;
  customName?: string;
  material_id?: string;
  roll_width?: string;
  consumption?: number;
}

export const useOrderForm = (initialOrder?: OrderFormData) => {
  // Order details state
  const [orderDetails, setOrderDetails] = useState<OrderFormData>(initialOrder || {
    company_name: "",
    company_id: null,
    sales_account_id: null,
    quantity: "",
    bag_length: "",
    bag_width: "",
    rate: "",
    order_date: new Date().toISOString().split('T')[0],
    special_instructions: "",
    status: "pending",
  });
  
  // Form validation errors
  const [formErrors, setFormErrors] = useState<{
    company?: string;
    quantity?: string;
    bag_length?: string;
    bag_width?: string;
    order_date?: string;
  }>({});
  
  // Components state
  const [components, setComponents] = useState<Record<string, ComponentData>>({});
  
  // Custom components state
  const [customComponents, setCustomComponents] = useState<ComponentData[]>([]);
  
  // Loading/submitting state
  const [submitting, setSubmitting] = useState(false);
  
  // Handle changes to order details
  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string | null } }) => {
    const { name, value } = e.target;
    
    setOrderDetails(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when field is updated
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  // Handle changes to standard components
  const handleComponentChange = (type: string, field: string, value: string) => {
    setComponents(prev => {
      const component = prev[type] || { 
        id: uuidv4(),
        type 
      };
      
      let updatedComponent = {
        ...component,
        [field]: value
      };
      
      // If quantity changes, recalculate consumption
      if (field === 'length' || field === 'width' || field === 'roll_width') {
        const length = parseFloat(field === 'length' ? value : component.length || '0');
        const width = parseFloat(field === 'width' ? value : component.width || '0');
        const roll_width = parseFloat(field === 'roll_width' ? value : component.roll_width || '0');
        
        if (length && width && roll_width && type !== 'chain' && type !== 'runner') {
          const orderQuantity = parseInt(orderDetails.quantity) || 1;
          updatedComponent.consumption = ((length * width) / (roll_width * 39.39)) * orderQuantity;
        }
      }
      
      return {
        ...prev,
        [type]: updatedComponent
      };
    });
  };
  
  // Handle changes to custom components
  const handleCustomComponentChange = (index: number, field: string, value: string) => {
    setCustomComponents(prev => {
      const updated = [...prev];
      
      let updatedComponent = {
        ...updated[index],
        [field]: value
      };
      
      // If dimensions or roll width changes, recalculate consumption
      if (field === 'length' || field === 'width' || field === 'roll_width') {
        const length = parseFloat(field === 'length' ? value : updated[index].length || '0');
        const width = parseFloat(field === 'width' ? value : updated[index].width || '0');
        const roll_width = parseFloat(field === 'roll_width' ? value : updated[index].roll_width || '0');
        
        if (length && width && roll_width) {
          const orderQuantity = parseInt(orderDetails.quantity) || 1;
          updatedComponent.consumption = ((length * width) / (roll_width * 39.39)) * orderQuantity;
        }
      }
      
      updated[index] = updatedComponent;
      return updated;
    });
  };
  
  // Add a new custom component
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
  
  // Remove a custom component
  const removeCustomComponent = (index: number) => {
    setCustomComponents(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle product selection from catalog
  const handleProductSelect = (catalogComponents: any[]) => {
    // Parse catalog components to update both standard and custom components
    const stdComponents: Record<string, ComponentData> = {};
    const customItems: ComponentData[] = [];
    
    catalogComponents.forEach(comp => {
      // Determine if this is a standard or custom component
      const standardTypes = ["part", "border", "handle", "chain", "runner"];
      const isStandard = standardTypes.includes(comp.component_type);
      
      // Calculate consumption based on order quantity
      const orderQuantity = parseInt(orderDetails.quantity) || 1;
      let consumption = comp.consumption;
      if (consumption && orderQuantity > 1) {
        consumption = consumption * orderQuantity;
      }
      
      const componentData: ComponentData = {
        id: uuidv4(),
        type: comp.component_type,
        length: comp.length?.toString() || '',
        width: comp.width?.toString() || '',
        color: comp.color || '',
        customName: comp.custom_name || '',
        material_id: comp.material_id || null,
        roll_width: comp.roll_width?.toString() || '',
        consumption: consumption
      };
      
      if (isStandard) {
        stdComponents[comp.component_type] = componentData;
      } else {
        customItems.push(componentData);
      }
    });
    
    // Update component states
    setComponents(stdComponents);
    setCustomComponents(customItems);
  };
  
  // Validate form before submission
  const validateForm = () => {
    const errors: {
      company?: string;
      quantity?: string;
      bag_length?: string;
      bag_width?: string;
      order_date?: string;
    } = {};
    
    // Validate required fields
    if (!orderDetails.company_name?.trim()) {
      errors.company = "Company name is required";
    }
    
    if (!orderDetails.quantity) {
      errors.quantity = "Quantity is required";
    } else if (parseInt(orderDetails.quantity) <= 0) {
      errors.quantity = "Quantity must be greater than 0";
    }
    
    if (!orderDetails.bag_length) {
      errors.bag_length = "Bag length is required";
    } else if (parseFloat(orderDetails.bag_length) <= 0) {
      errors.bag_length = "Length must be greater than 0";
    }
    
    if (!orderDetails.bag_width) {
      errors.bag_width = "Bag width is required";
    } else if (parseFloat(orderDetails.bag_width) <= 0) {
      errors.bag_width = "Width must be greater than 0";
    }
    
    if (!orderDetails.order_date) {
      errors.order_date = "Order date is required";
    }
    
    // Update error state and return validation result
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      toast.error("Please correct the errors in the form");
      return null;
    }
    
    setSubmitting(true);
    
    try {
      // Insert order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            company_name: orderDetails.company_name.trim(),
            company_id: orderDetails.company_id,
            sales_account_id: orderDetails.sales_account_id === 'none' ? null : orderDetails.sales_account_id,
            quantity: parseInt(orderDetails.quantity),
            bag_length: parseFloat(orderDetails.bag_length),
            bag_width: parseFloat(orderDetails.bag_width),
            rate: orderDetails.rate ? parseFloat(orderDetails.rate) : null,
            order_date: orderDetails.order_date,
            special_instructions: orderDetails.special_instructions || null,
            status: orderDetails.status || 'pending'
          }
        ])
        .select('id')
        .single();
      
      if (orderError) throw orderError;
      
      // Prepare components for insertion
      const allComponents = [
        ...Object.values(components),
        ...customComponents
      ].filter(Boolean);
      
      // Insert components if any
      if (allComponents.length > 0) {
        const orderQuantity = parseInt(orderDetails.quantity) || 1;
        
        const componentsToInsert = allComponents.map(comp => {
          // Adjust consumption based on order quantity
          let consumption = comp.consumption;
          
          return {
            order_id: orderData.id,
            component_type: comp.type,
            color: comp.color || null,
            size: comp.length && comp.width ? `${comp.length}x${comp.width}` : null,
            details: comp.customName || null,
            material_id: comp.material_id && comp.material_id !== 'not_applicable' ? comp.material_id : null,
            roll_width: comp.roll_width ? parseFloat(comp.roll_width) : null,
            consumption: consumption
          };
        });
        
        const { error: componentsError } = await supabase
          .from('order_components')
          .insert(componentsToInsert);
        
        if (componentsError) {
          console.error("Error saving components:", componentsError);
          toast.error("Error saving components");
        }
        
        // Update inventory quantities based on material usage
        await updateInventoryQuantities(componentsToInsert);
      }
      
      toast.success("Order created successfully");
      return orderData.id;
      
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast.error(`Failed to create order: ${error.message}`);
      return null;
    } finally {
      setSubmitting(false);
    }
  };
  
  // Update inventory quantities based on material usage
  const updateInventoryQuantities = async (orderComponents: any[]) => {
    try {
      // Filter components with material_id and consumption
      const componentsWithMaterial = orderComponents.filter(
        comp => comp.material_id && comp.consumption
      );
      
      // Update inventory quantities for each material used
      for (const comp of componentsWithMaterial) {
        // Get current inventory quantity
        const { data: material } = await supabase
          .from('inventory')
          .select('quantity')
          .eq('id', comp.material_id)
          .single();
          
        if (material) {
          // Calculate new quantity
          const newQuantity = Math.max(0, material.quantity - comp.consumption);
          
          // Update inventory
          await supabase
            .from('inventory')
            .update({ quantity: newQuantity })
            .eq('id', comp.material_id);
        }
      }
    } catch (error) {
      console.error("Error updating inventory quantities:", error);
      toast.error("Failed to update inventory quantities");
    }
  };
  
  return {
    orderDetails,
    components,
    customComponents,
    submitting,
    formErrors,
    handleOrderChange,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent,
    handleProductSelect,
    handleSubmit,
    validateForm
  };
};
