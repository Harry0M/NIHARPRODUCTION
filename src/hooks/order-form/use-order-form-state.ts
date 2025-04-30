
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { OrderFormData, Component, FormErrors } from "@/types/order";

export function useOrderFormState() {
  // Form submission state
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  // Order form data
  const [orderDetails, setOrderDetails] = useState<OrderFormData>({
    company_name: "",
    company_id: null,
    quantity: "",
    bag_length: "",
    bag_width: "",
    rate: "",
    order_date: new Date().toISOString().split('T')[0],
    sales_account_id: null,
  });
  
  // Form validation errors
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  // Standard components data
  const [components, setComponents] = useState<Record<string, any>>({});
  
  // Custom components data
  const [customComponents, setCustomComponents] = useState<Component[]>([]);
  
  // Selected product from catalog
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  // Material cost calculation
  const [totalMaterialCost, setTotalMaterialCost] = useState<number>(0);

  // Add a new custom component
  const addCustomComponent = () => {
    const newComponent: Component = {
      id: uuidv4(),
      type: 'custom',
      customName: '',
      color: '',
      gsm: '',
      length: '',
      width: '',
      material_id: '',
      roll_width: '',
      consumption: ''
    };
    
    setCustomComponents(prev => [...prev, newComponent]);
  };
  
  // Remove a custom component by index
  const removeCustomComponent = (index: number) => {
    setCustomComponents(prev => prev.filter((_, i) => i !== index));
  };
  
  return {
    submitting,
    setSubmitting,
    orderDetails,
    setOrderDetails,
    formErrors,
    setFormErrors,
    components,
    setComponents,
    customComponents,
    setCustomComponents,
    selectedProductId,
    setSelectedProductId,
    totalMaterialCost,
    setTotalMaterialCost,
    addCustomComponent,
    removeCustomComponent
  };
}
