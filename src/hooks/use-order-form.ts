
import { useOrderFormState } from "./order-form/use-order-form-state";
import { useOrderValidation } from "./order-form/use-order-validation";
import { useComponentHandlers } from "./order-form/use-component-handlers";
import { useProductSelection } from "./order-form/use-product-selection";
import { useMaterialCost } from "./order-form/use-material-cost";
import { useOrderSubmission } from "./order-form/use-order-submission";
import { useOrderChanges } from "./order-form/use-order-changes";

export function useOrderForm() {
  // State management
  const {
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
  } = useOrderFormState();

  // Form validation
  const { validateForm } = useOrderValidation(orderDetails, setFormErrors);

  // Component handlers
  const { handleComponentChange, handleCustomComponentChange } = useComponentHandlers(
    components,
    setComponents,
    customComponents,
    setCustomComponents,
    orderDetails
  );

  // Product selection and catalog integration
  const { 
    selectedProduct, 
    handleProductSelect, 
    updateComponentConsumptions 
  } = useProductSelection(
    selectedProductId,
    setSelectedProductId,
    orderDetails,
    setOrderDetails,
    setComponents,
    setCustomComponents
  );

  // Material cost calculation
  const { inventoryItems, calculateMaterialUsage } = useMaterialCost(
    components,
    customComponents,
    orderDetails.quantity,
    setTotalMaterialCost
  );

  // Order form changes
  const { handleOrderChange } = useOrderChanges({
    orderDetails,
    setOrderDetails,
    formErrors,
    setFormErrors,
    updateComponentConsumptions,
    selectedProductId
  });

  // Order submission
  const { handleSubmit } = useOrderSubmission(
    orderDetails,
    components,
    customComponents,
    setSubmitting,
    inventoryItems
  );

  // Perform material usage calculation
  const materialUsage = calculateMaterialUsage();

  return {
    // State
    orderDetails,
    components,
    customComponents,
    submitting,
    formErrors,
    totalMaterialCost,
    materialUsage,
    
    // Event handlers
    handleOrderChange,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent,
    handleProductSelect,
    
    // Form submission
    handleSubmit,
    validateForm
  };
}
