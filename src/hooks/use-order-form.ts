
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
    costCalculation,
    setCostCalculation,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent,
    updateConsumptionBasedOnQuantity
  } = useOrderComponents();
  
  const { calculateTotalCost } = useCostCalculation();
  
  const {
    handleProductSelect: processProductComponents
  } = useProductSelection({
    orderDetails,
    setOrderDetails,
    setComponents,
    setCustomComponents,
    setBaseConsumptions,
    updateConsumptionBasedOnQuantity,
    setCostCalculation
  });
  
  // Validate form by using the base validation and passing orderDetails
  const validateForm = () => validateFormBase(orderDetails);
  
  // Call product selection handler with components
  const handleProductSelect = (components: any[]) => {
    processProductComponents(components);
  };
  
  // Update cost calculation when relevant data changes
  useEffect(() => {
    // Get quantity 
    const quantity = parseInt(orderDetails.total_quantity || orderDetails.quantity || '0');
    if (isNaN(quantity) || quantity <= 0) return;

    // Get production charges
    const cuttingCharge = parseFloat(orderDetails.cutting_charge || '0');
    const printingCharge = parseFloat(orderDetails.printing_charge || '0');
    const stitchingCharge = parseFloat(orderDetails.stitching_charge || '0');
    const transportCharge = parseFloat(orderDetails.transport_charge || '0');

    // Calculate costs
    const costs = calculateTotalCost(
      components,
      customComponents,
      cuttingCharge,
      printingCharge,
      stitchingCharge,
      transportCharge,
      quantity
    );

    // Get margin
    const margin = parseFloat(orderDetails.margin || '15');
    
    // Calculate selling price
    const sellingPrice = costs.totalCost * (1 + margin/100);

    // Update cost calculation state
    setCostCalculation({
      ...costs,
      margin,
      sellingPrice
    });

    // Also update the rate field in orderDetails
    setOrderDetails(prev => ({
      ...prev,
      rate: sellingPrice.toFixed(2)
    }));

  }, [
    components, 
    customComponents, 
    orderDetails.quantity,
    orderDetails.total_quantity,
    orderDetails.cutting_charge,
    orderDetails.printing_charge,
    orderDetails.stitching_charge,
    orderDetails.transport_charge,
    orderDetails.margin
  ]);
  
  const {
    submitting,
    handleSubmit
  } = useOrderSubmission({
    orderDetails,
    components,
    customComponents,
    validateForm,
    costCalculation
  });
  
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
    handleSubmit,
    validateForm,
    updateConsumptionBasedOnQuantity
  };
}
