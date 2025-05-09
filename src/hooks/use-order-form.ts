
import { useOrderComponents } from "./order-form/useOrderComponents";
import { useOrderDetails } from "./order-form/useOrderDetails";
import { useOrderFormValidation } from "./order-form/useOrderFormValidation";
import { useProductSelection } from "./order-form/useProductSelection";
import { useOrderSubmission } from "./order-form/useOrderSubmission";
import { useCostCalculation } from "./order-form/useCostCalculation";
import { UseOrderFormReturn } from "@/types/order-form";
import { useEffect } from "react";

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
  
  // Use the cost calculation hook
  const {
    costData,
    updateCostCalculations
  } = useCostCalculation({
    orderDetails,
    components,
    customComponents
  });
  
  // Update cost calculations whenever relevant data changes
  useEffect(() => {
    // Get cost field values from calculations
    const costFields = updateCostCalculations();
    
    // Update orderDetails with calculated costs for sync and reference
    if (costFields) {
      setOrderDetails(prev => ({
        ...prev,
        ...costFields
      }));
    }
  }, [components, customComponents, orderDetails.quantity, 
      orderDetails.cutting_charge, orderDetails.printing_charge, 
      orderDetails.stitching_charge, orderDetails.transport_charge,
      orderDetails.margin]);

  // Validate form by using the base validation and passing orderDetails
  const validateForm = () => validateFormBase(orderDetails);
  
  // Call product selection handler with components
  const handleProductSelect = (components: any[]) => {
    processProductComponents(components);
    // Trigger cost calculations after product selection
    setTimeout(updateCostCalculations, 200);
  };
  
  const {
    submitting,
    handleSubmit
  } = useOrderSubmission({
    orderDetails,
    components,
    customComponents,
    validateForm,
    costData
  });
  
  // Return a unified API that matches the original hook
  return {
    orderDetails,
    components,
    customComponents,
    submitting,
    formErrors,
    costData,
    handleOrderChange,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent,
    handleProductSelect,
    handleSubmit,
    validateForm,
    updateConsumptionBasedOnQuantity,
    updateCostCalculations
  };
}
