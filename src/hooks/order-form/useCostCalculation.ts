import { useCallback } from "react";
import { Component } from "@/types/order-form";
import * as CostUtils from "@/utils/costCalculationUtils";

export function useCostCalculation() {
  /**
   * Calculate all costs from components and production charges
   */
  const calculateTotalCost = useCallback((
    components: Record<string, unknown>,
    customComponents: Component[],
    cuttingCharge = 0,
    printingCharge = 0,
    stitchingCharge = 0,
    transportCharge = 0,
    quantity = 0,
    gstRate = 0
  ) => {
    // Calculate material costs from all components
    const materialCosts = [...Object.values(components), ...customComponents]
      .reduce((total: number, comp: unknown) => {
        const component = comp as { materialRate?: string | number; consumption?: string | number; materialCost?: string | number };
        if (!component) return total;
        
        // Calculate cost based on material rate and consumption if available
        if (component.materialRate && component.consumption) {
          // The consumption value is per unit, material rate is per unit
          // For the total cost calculation, we need to use the actual consumption 
          // that will be saved to database (consumption * quantity)
          const consumption = parseFloat(String(component.consumption)) || 0;
          const materialRate = parseFloat(String(component.materialRate)) || 0;
          
          // Calculate total material cost: consumption × quantity × materialRate
          const totalConsumption = consumption * quantity;
          const cost = totalConsumption * materialRate;
          
          if (!isNaN(cost)) {
            // Set the calculated cost on the component
            (component as Record<string, unknown>).materialCost = cost;
            return total + cost;
          }
        } else if (component.materialCost) {
          // If materialCost is already calculated, use it
          const cost = parseFloat(String(component.materialCost));
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
    const totalTransportCharge = quantity * perUnitTransportCharge;

    // Calculate base cost (material + production costs)
    const baseCost = (typeof materialCosts === 'number' ? materialCosts : 0) + totalCuttingCharge + totalPrintingCharge + totalStitchingCharge;
    
    // Calculate GST amount
    const gstAmount = (baseCost * gstRate) / 100;
    
    // Calculate total cost including GST
    const totalCost = baseCost + totalTransportCharge + gstAmount;
    
    // Calculate per unit costs
    const perUnitBaseCost = quantity > 0 ? baseCost / quantity : baseCost;
    const perUnitTransportCost = quantity > 0 ? totalTransportCharge / quantity : totalTransportCharge;
    const perUnitGstCost = quantity > 0 ? gstAmount / quantity : gstAmount;
    const perUnitCost = perUnitBaseCost + perUnitTransportCost + perUnitGstCost;

    return {
      // Total costs
      materialCost: typeof materialCosts === 'number' ? materialCosts : 0,
      cuttingCharge: totalCuttingCharge,
      printingCharge: totalPrintingCharge, 
      stitchingCharge: totalStitchingCharge,
      transportCharge: totalTransportCharge,
      baseCost,
      gstAmount,
      totalCost,
      
      // Per unit costs
      perUnitBaseCost,
      perUnitTransportCost,
      perUnitGstCost,
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
