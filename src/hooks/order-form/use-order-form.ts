
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { OrderFormData, OrderStatus, ComponentData } from "@/types/order";
import { UseOrderFormHook } from "./types";
import { validateOrderForm } from "./validation";
import { submitOrder } from "./submit";
import {
  handleComponentChange as handleComponentChangeUtil,
  handleCustomComponentChange as handleCustomComponentChangeUtil,
  addCustomComponent as addCustomComponentUtil,
  removeCustomComponent as removeCustomComponentUtil,
  handleProductSelect as handleProductSelectUtil
} from "./component-handlers";

export const useOrderForm = (initialOrder?: OrderFormData): UseOrderFormHook => {
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
    status: "pending" as OrderStatus,
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
  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { 
    target: { name: string; value: string | null } 
  }) => {
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
    setComponents(prev => 
      handleComponentChangeUtil(
        prev, 
        type, 
        field, 
        value, 
        parseInt(orderDetails.quantity) || 1
      )
    );
  };
  
  // Handle changes to custom components
  const handleCustomComponentChange = (index: number, field: string, value: string) => {
    setCustomComponents(prev => 
      handleCustomComponentChangeUtil(
        prev, 
        index, 
        field, 
        value, 
        parseInt(orderDetails.quantity) || 1
      )
    );
  };
  
  // Add a new custom component
  const addCustomComponent = () => {
    setCustomComponents(prev => addCustomComponentUtil(prev));
  };
  
  // Remove a custom component
  const removeCustomComponent = (index: number) => {
    setCustomComponents(prev => removeCustomComponentUtil(prev, index));
  };
  
  // Handle product selection from catalog
  const handleProductSelect = (catalogComponents: any[]) => {
    const { standardComponents, customItems } = handleProductSelectUtil(
      catalogComponents, 
      parseInt(orderDetails.quantity) || 1
    );
    
    // Update component states
    setComponents(standardComponents);
    setCustomComponents(customItems);
  };
  
  // Validate form before submission
  const validateForm = () => {
    const errors = validateOrderForm(orderDetails);
    
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
      const orderId = await submitOrder(orderDetails, components, customComponents);
      return orderId;
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
