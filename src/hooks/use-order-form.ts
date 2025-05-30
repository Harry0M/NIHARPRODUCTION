
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
  
  const { calculateTotalCost, calculateSellingPrice } = useCostCalculation();
  
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
  
  // Update cost calculation when relevant data changes
  useEffect(() => {
    // Get the order quantity and total quantity separately
    const orderQuantity = parseInt(orderDetails.quantity || '0');
    const totalQuantity = parseInt(orderDetails.total_quantity || '0');
    
    // Use order quantity for production costs and total quantity for material costs
    // This ensures production costs are per order, not per total quantity
    if ((isNaN(orderQuantity) || orderQuantity <= 0) && (isNaN(totalQuantity) || totalQuantity <= 0)) return;

    // Get production charges
    const cuttingCharge = parseFloat(orderDetails.cutting_charge || '0');
    const printingCharge = parseFloat(orderDetails.printing_charge || '0');
    const stitchingCharge = parseFloat(orderDetails.stitching_charge || '0');
    const transportCharge = parseFloat(orderDetails.transport_charge || '0');
    
    // Get margin
    const margin = parseFloat(orderDetails.margin || '15');

    // Debug log components for troubleshooting
    console.log('Recalculating costs with components:', components);
    
    // Sum up all material costs from components with improved precision
    const materialCost = [...Object.values(components), ...customComponents].reduce(
      (total, comp) => {
        // Ensure we use the correct material cost
        const cost = comp?.materialCost ? parseFloat(comp.materialCost) : 0;
        
        if (comp && comp.type) {
          console.log(`Material cost for ${comp.type}: ${cost}`);
        }
        
        return total + (isNaN(cost) ? 0 : cost);
      }, 0
    );
    
    console.log(`%c TOTAL MATERIAL COST: ${materialCost.toFixed(2)}`, 
      'background:#8e44ad;color:white;font-weight:bold;padding:3px;');
    
    // Calculate production cost
    const productionCost = cuttingCharge + printingCharge + stitchingCharge + transportCharge;
    
    // Calculate total cost
    const totalCost = materialCost + productionCost;
    
    // Calculate selling price based on margin
    const sellingPrice = totalCost * (1 + margin / 100);
    
    // For orders with quantity, calculate per-unit costs
    let perUnitData = {};
    
    if (!isNaN(orderQuantity) && orderQuantity > 0) {
      perUnitData = {
        perUnitCost: totalCost / orderQuantity,
        perUnitMaterialCost: materialCost / orderQuantity,
        perUnitProductionCost: productionCost / orderQuantity
      };
    }
    
    // Update cost calculation state
    setCostCalculation({
      materialCost,
      cuttingCharge,
      printingCharge,
      stitchingCharge,
      transportCharge,
      productionCost,
      totalCost,
      margin,
      sellingPrice,
      ...perUnitData
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
    updateConsumptionBasedOnQuantity,
    costCalculation, // Add cost calculation to return
    updateMargin // Add update margin function
  };
}
