import { useOrderComponents } from "./order-form/useOrderComponents";
import { useOrderDetails } from "./order-form/useOrderDetails";
import { useOrderFormValidation } from "./order-form/useOrderFormValidation";
import { useProductSelection } from "./order-form/useProductSelection";
import { useOrderSubmission } from "./order-form/useOrderSubmission";
import { useCostCalculation } from "./order-form/useCostCalculation"; 
import { UseOrderFormReturn, Component } from "@/types/order-form";

// Extended interface for components with manual consumption tracking
interface ExtendedComponent extends Component {
  is_manual_consumption?: boolean;
  fetchedConsumption?: string;
}

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
    costCalculation,
    setCostCalculation,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent,
    updateConsumptionBasedOnQuantity,
    setDatabaseLoadingState
  } = useOrderComponents();
  
  const { calculateTotalCost, calculateSellingPrice } = useCostCalculation();
  
  const {
    handleProductSelect: processProductComponents
  } = useProductSelection({
    orderDetails,
    setOrderDetails,
    setComponents,
    setCustomComponents,
    updateConsumptionBasedOnQuantity,
    setCostCalculation
  });
  
  // Validate form by using the base validation and passing orderDetails
  const validateForm = () => validateFormBase(orderDetails);
  
  // Call product selection handler with components
  const handleProductSelect = (components: Component[]) => {
    processProductComponents(components);
  };
  
  // Function to update margin and recalculate selling price
  const updateMargin = (newMargin: number) => {
    // Update the margin in order details
    setOrderDetails(prev => ({
      ...prev,
      margin: newMargin.toString()
    }));
    
    // Update cost calculation with new margin and selling price
    if (costCalculation) {
      const newSellingPrice = calculateSellingPrice(costCalculation.totalCost, newMargin);
      setCostCalculation(prev => ({
        ...prev,
        margin: newMargin,
        sellingPrice: newSellingPrice
      }));
      
      // Also update rate in order details
      setOrderDetails(prev => ({
        ...prev,
        rate: newSellingPrice.toFixed(2)
      }));
    }
  };
  
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
    handleSubmit: (e: React.FormEvent, orderId?: string) => handleSubmit(e, orderId),
    validateForm,
    updateConsumptionBasedOnQuantity,
    costCalculation, // Add cost calculation to return
    updateMargin, // Add update margin function
    setDatabaseLoadingState // Add database loading state function
  };
}
