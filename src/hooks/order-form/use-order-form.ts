import { useState } from "react";
import { OrderFormData, OrderStatus } from "@/types/order";
import { validateOrderForm } from "./validation";
import { submitOrder } from "./submit";
import {
  handleComponentChange as handleComponentChangeUtil,
  handleCustomComponentChange as handleCustomComponentChangeUtil,
  addCustomComponent as addCustomComponentUtil,
  removeCustomComponent as removeCustomComponentUtil,
  handleProductSelect as handleProductSelectUtil
} from "./component-handlers";
import { useOrderFormState } from "./use-order-form-state";
import { useOrderFormActions } from "./use-order-form-actions";
import { UseOrderFormHook } from "./types";

export const useOrderForm = (initialOrder?: OrderFormData): UseOrderFormHook => {
  // Get order form state from a separate hook
  const {
    orderDetails,
    components,
    customComponents,
    formErrors,
    submitting,
    setOrderDetails,
    setComponents,
    setCustomComponents,
    setFormErrors,
    setSubmitting
  } = useOrderFormState(initialOrder);
  
  // Use a separate hook for actions to keep this hook clean
  const {
    handleOrderChange,
    validateForm,
    handleSubmit
  } = useOrderFormActions({
    orderDetails,
    formErrors,
    setOrderDetails,
    setFormErrors,
    setSubmitting,
    components,
    customComponents
  });
  
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
