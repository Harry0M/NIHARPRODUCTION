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
    quantity = 0,
    gstRate = 0,
    wastagePercentage = 5
  ) => {
    // Calculate material costs from all components
    const materialCosts = [...Object.values(components), ...customComponents]
      .reduce((total, comp) => {
        if (!comp) return total;
        
        // Calculate cost based on material rate and consumption if available
        if (comp.materialRate && comp.consumption) {
          // Calculate unit price using the formula: alt quantity * alt unit price / main quantity
          const altQuantity = parseFloat(comp.consumption) || 0;
          const altUnitPrice = parseFloat(comp.materialRate) || 0;
          const mainQuantity = quantity || 1;
          
          const unitPrice = (altQuantity * altUnitPrice) / mainQuantity;
          const cost = unitPrice * mainQuantity;
          
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
    const totalTransportCharge = quantity * perUnitTransportCharge;

    // Calculate base cost (material + production costs)
    const baseCost = materialCosts + totalCuttingCharge + totalPrintingCharge + totalStitchingCharge;
    
    // Calculate wastage cost from material cost
    const wastageCost = (materialCosts * wastagePercentage) / 100;
    
    // Calculate GST amount
    const gstAmount = (baseCost * gstRate) / 100;
    
    // Calculate total cost including GST and wastage
    const totalCost = baseCost + totalTransportCharge + gstAmount + wastageCost;
    
    // Calculate per unit costs
    const perUnitBaseCost = quantity > 0 ? baseCost / quantity : baseCost;
    const perUnitTransportCost = quantity > 0 ? totalTransportCharge / quantity : totalTransportCharge;
    const perUnitGstCost = quantity > 0 ? gstAmount / quantity : gstAmount;
    const perUnitCost = perUnitBaseCost + perUnitTransportCost + perUnitGstCost;

    return {
      // Total costs
      materialCost: materialCosts,
      cuttingCharge: totalCuttingCharge,
      printingCharge: totalPrintingCharge, 
      stitchingCharge: totalStitchingCharge,
      transportCharge: totalTransportCharge,
      wastagePercentage,
      wastageCost,
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
