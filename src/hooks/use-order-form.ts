
import { useOrderComponents } from "./order-form/useOrderComponents";
import { useOrderDetails } from "./order-form/useOrderDetails";
import { useOrderFormValidation } from "./order-form/useOrderFormValidation";
import { useProductSelection } from "./order-form/useProductSelection";
import { useOrderSubmission } from "./order-form/useOrderSubmission";
import { UseOrderFormReturn } from "@/types/order-form";
import { FormEvent } from "react";

export function useOrderForm(): UseOrderFormReturn {
  // Use individual hooks
  const { 
    orderDetails, 
    setOrderDetails, 
    handleOrderChange 
  } = useOrderDetails();
  
  const { 
    formErrors, 
    validateForm: validateFormBase, 
    setFormErrors 
  } = useOrderFormValidation();
  
  const {
    components,
    setComponents,
    customComponents,
    setCustomComponents,
    baseConsumptions,
    setBaseConsumptions,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent,
    updateConsumptionBasedOnQuantity
  } = useOrderComponents();
  
  const {
    handleProductSelect: processProductComponents
  } = useProductSelection({
    orderDetails,
    setOrderDetails,
    setComponents,
    setCustomComponents,
    setBaseConsumptions,
    updateConsumptionBasedOnQuantity
  });
  
  // Validate form by using the base validation and passing orderDetails
  const validateForm = () => validateFormBase(orderDetails);
  
  // Call product selection handler with components
  const handleProductSelect = (components: any[]) => {
    processProductComponents(components);
  };
  
  const {
    submitting,
    handleSubmit
  } = useOrderSubmission();
  
  const submitForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return undefined;
    }
    
    // Create the order values object from orderDetails and components
    const orderValues = {
      ...orderDetails,
      order_number: `ORD-${new Date().getTime().toString().substring(5)}`,
      orderComponents: [
        ...Object.values(components).filter(c => c && c.type),
        ...customComponents.filter(c => c.type === 'custom' && c.customName)
      ]
    };
    
    // Pass this to handleSubmit
    try {
      return await handleSubmit(e);
    } catch (error) {
      console.error("Error submitting form:", error);
      return undefined;
    }
  };
  
  // Return a unified API that matches the original hook
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
    handleSubmit: submitForm,
    validateForm,
    updateConsumptionBasedOnQuantity
  };
}
