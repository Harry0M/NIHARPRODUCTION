
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

    // Calculate production costs - per unit costs
    const perUnitCuttingCharge = cuttingCharge;
    const perUnitPrintingCharge = printingCharge;
    const perUnitStitchingCharge = stitchingCharge;
    const perUnitTransportCharge = transportCharge;
    
    // Calculate total production costs (cost * quantity)
    const totalCuttingCharge = quantity * perUnitCuttingCharge;
    const totalPrintingCharge = quantity * perUnitPrintingCharge;
    const totalStitchingCharge = quantity * perUnitStitchingCharge;
    // Transport charge is not multiplied by quantity as it's per order
    const totalTransportCharge = perUnitTransportCharge;

    // Sum up all costs
    const productionCost = totalCuttingCharge + totalPrintingCharge + 
                          totalStitchingCharge + totalTransportCharge;
    const totalCost = materialCosts + productionCost;
    
    // Calculate per unit cost (excluding transport which is per order)
    const perUnitMaterialCost = quantity > 0 ? materialCosts / quantity : materialCosts;
    const perUnitProductionCost = 
      perUnitCuttingCharge + perUnitPrintingCharge + perUnitStitchingCharge;
    const perUnitCost = perUnitMaterialCost + perUnitProductionCost + (totalTransportCharge / (quantity || 1));

    return {
      // Total costs
      materialCost: materialCosts,
      cuttingCharge: totalCuttingCharge,
      printingCharge: totalPrintingCharge, 
      stitchingCharge: totalStitchingCharge,
      transportCharge: totalTransportCharge,
      productionCost,
      totalCost,
      
      // Per unit costs
      perUnitMaterialCost,
      perUnitCuttingCharge,
      perUnitPrintingCharge,
      perUnitStitchingCharge,
      perUnitTransportCharge,
      perUnitProductionCost,
      perUnitCost
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
