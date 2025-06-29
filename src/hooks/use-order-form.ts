import { useOrderComponents } from "./order-form/useOrderComponents";
import { useOrderDetails } from "./order-form/useOrderDetails";
import { useOrderFormValidation } from "./order-form/useOrderFormValidation";
import { useProductSelection } from "./order-form/useProductSelection";
import { useOrderSubmission } from "./order-form/useOrderSubmission";
import { useCostCalculation } from "./order-form/useCostCalculation"; 
import { UseOrderFormReturn, Component } from "@/types/order-form";
import { useEffect } from "react";

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
  
  // Cost calculation logic removed - will be handled elsewhere
  
  // SIMPLE COST CALCULATION: Fetch costs from product template and multiply by order quantity only
  useEffect(() => {
    const orderQuantity = parseInt(orderDetails.quantity || '1');
    
    if (isNaN(orderQuantity) || orderQuantity <= 0) return;

    console.log('=== SIMPLE COST CALCULATION ===');
    console.log('Order Quantity:', orderQuantity);
    
    // SIMPLIFIED MATERIAL COST: Calculate based on current consumption display values
    const materialCost = [...Object.values(components), ...customComponents]
      .filter(Boolean)
      .reduce((total, comp) => {
        if (!comp) return total;
        
        // Get current consumption value from the form field
        const currentConsumption = parseFloat(String(comp.consumption || '0'));
        
        // Get material rate (per unit consumption cost)
        const materialRate = parseFloat(String(comp.materialRate || '0'));
        
        // Check if this is a manual component
        const extendedComp = comp as ExtendedComponent;
        const isManual = comp.formula === 'manual' || extendedComp.is_manual_consumption === true;
        
        let totalComponentCost;
        
        if (isManual) {
          // For manual components: consumption field shows total consumption for the order
          // materialCost = total consumption × material rate (no additional multiplication)
          totalComponentCost = currentConsumption * materialRate;
          console.log(`${comp.type} (MANUAL): TotalConsumption=${currentConsumption} × Rate=₹${materialRate} = ₹${totalComponentCost.toFixed(2)}`);
        } else {
          // For calculated components: consumption field shows total consumption for the order
          // materialCost = total consumption × material rate (no additional multiplication)
          totalComponentCost = currentConsumption * materialRate;
          console.log(`${comp.type} (CALC): TotalConsumption=${currentConsumption} × Rate=₹${materialRate} = ₹${totalComponentCost.toFixed(2)}`);
        }
        
        return total + (isNaN(totalComponentCost) ? 0 : totalComponentCost);
      }, 0);

    // SIMPLE PRODUCTION COSTS: Base charges × order quantity
    const baseCuttingCharge = parseFloat(orderDetails.cutting_charge || '0');
    const basePrintingCharge = parseFloat(orderDetails.printing_charge || '0');
    const baseStitchingCharge = parseFloat(orderDetails.stitching_charge || '0');
    const baseTransportCharge = parseFloat(orderDetails.transport_charge || '0');
    
    const totalCuttingCharge = baseCuttingCharge * orderQuantity;
    const totalPrintingCharge = basePrintingCharge * orderQuantity;
    const totalStitchingCharge = baseStitchingCharge * orderQuantity;
    const totalTransportCharge = baseTransportCharge * orderQuantity;
    
    const productionCost = totalCuttingCharge + totalPrintingCharge + totalStitchingCharge + totalTransportCharge;
    
    // Calculate totals
    const totalCost = materialCost + productionCost;
    const margin = parseFloat(orderDetails.margin || '15');
    const sellingPrice = totalCost * (1 + margin / 100);
    
    console.log(`Total Material Cost: ₹${materialCost.toFixed(2)}`);
    console.log(`Total Production Cost: ₹${productionCost.toFixed(2)}`);
    console.log(`Total Cost: ₹${totalCost.toFixed(2)}`);
    console.log(`Selling Price: ₹${sellingPrice.toFixed(2)}`);
    console.log('===============================');
    
    // Update cost calculation state
    setCostCalculation({
      materialCost,
      cuttingCharge: totalCuttingCharge,
      printingCharge: totalPrintingCharge,
      stitchingCharge: totalStitchingCharge,
      transportCharge: totalTransportCharge,
      baseCost: materialCost + totalCuttingCharge + totalPrintingCharge + totalStitchingCharge,
      gstAmount: 0,
      totalCost,
      margin,
      sellingPrice,
      perUnitBaseCost: orderQuantity > 0 ? (materialCost + totalCuttingCharge + totalPrintingCharge + totalStitchingCharge) / orderQuantity : 0,
      perUnitTransportCost: orderQuantity > 0 ? totalTransportCharge / orderQuantity : 0,
      perUnitGstCost: 0,
      perUnitCost: orderQuantity > 0 ? totalCost / orderQuantity : 0
    });

    // Update rate in order details
    setOrderDetails(prev => ({
      ...prev,
      rate: sellingPrice.toFixed(2)
    }));

  }, [
    components, 
    customComponents, 
    orderDetails.quantity,
    orderDetails.cutting_charge,
    orderDetails.printing_charge,
    orderDetails.stitching_charge,
    orderDetails.transport_charge,
    orderDetails.margin,
    setCostCalculation,
    setOrderDetails
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
    handleSubmit: (e: React.FormEvent, orderId?: string) => handleSubmit(e, orderId),
    validateForm,
    updateConsumptionBasedOnQuantity,
    costCalculation, // Add cost calculation to return
    updateMargin, // Add update margin function
    setDatabaseLoadingState // Add database loading state function
  };
}
