
import { useCallback } from "react";
import { Component } from "@/types/order-form";
import * as CostUtils from "@/utils/costCalculationUtils";

export function useCostCalculation() {
  /**
   * Calculate all costs from components and production charges
   */
  const calculateTotalCost = useCallback((
    components: Record<string, any>,
    customComponents: Component[],
    cuttingCharge = 0,
    printingCharge = 0,
    stitchingCharge = 0,
    transportCharge = 0,
    quantity = 0
  ) => {
    // Calculate material costs from all components
    const materialCosts = [...Object.values(components), ...customComponents]
      .reduce((total, comp) => {
        if (!comp) return total;
        
        // Calculate cost based on material rate and consumption if available
        if (comp.materialRate && comp.consumption) {
          const cost = parseFloat(comp.materialRate) * parseFloat(comp.consumption);
          if (!isNaN(cost)) {
            // Set the calculated cost on the component
            comp.materialCost = cost;
            return total + cost;
          }
        } else if (comp.materialCost) {
          // If materialCost is already calculated, use it
          const cost = parseFloat(comp.materialCost);
          if (!isNaN(cost)) {
            return total + cost;
          }
        }
        return total;
      }, 0);

    // Calculate production costs
    const totalCuttingCharge = quantity * cuttingCharge;
    const totalPrintingCharge = quantity * printingCharge;
    const totalStitchingCharge = quantity * stitchingCharge;
    const totalTransportCharge = quantity * transportCharge;

    // Sum up all costs
    const productionCost = totalCuttingCharge + totalPrintingCharge + 
                          totalStitchingCharge + totalTransportCharge;
    const totalCost = materialCosts + productionCost;

    return {
      materialCost: materialCosts,
      cuttingCharge: totalCuttingCharge,
      printingCharge: totalPrintingCharge, 
      stitchingCharge: totalStitchingCharge,
      transportCharge: totalTransportCharge,
      productionCost,
      totalCost,
    };
  }, []);

  /**
   * Calculate selling price based on cost and margin
   */
  const calculatePrice = useCallback((totalCost: number, margin?: number) => {
    if (isNaN(totalCost) || totalCost <= 0) return 0;
    
    // Use 15% as default margin if not specified
    const effectiveMargin = margin !== undefined ? margin : 15;
    
    // Calculate selling price using utility function
    return CostUtils.calculateSellingPrice(totalCost, effectiveMargin);
  }, []);

  return {
    calculateTotalCost,
    calculateSellingPrice: calculatePrice
  };
}
