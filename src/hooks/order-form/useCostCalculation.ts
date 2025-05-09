
import { useState } from "react";
import { calculateProductionCosts, calculateProfitUsingMargin } from "@/utils/costCalculationUtils";
import { Component } from "@/types/order-form";
import { OrderFormData } from "@/types/order";

interface CostData {
  materialCost: number;
  productionCost: number;
  totalCost: number;
  sellingPrice: number;
  margin: number | null;
}

interface UseCostCalculationProps {
  orderDetails: OrderFormData;
  components: Record<string, any>;
  customComponents: Component[];
}

export function useCostCalculation({
  orderDetails,
  components,
  customComponents
}: UseCostCalculationProps) {
  const [costData, setCostData] = useState<CostData>({
    materialCost: 0,
    productionCost: 0,
    totalCost: 0,
    sellingPrice: 0,
    margin: null
  });
  
  // Calculate material costs based on components
  const calculateMaterialCost = (): number => {
    let totalMaterialCost = 0;
    
    // Sum costs from standard components
    Object.values(components).forEach(comp => {
      if (comp && comp.materialRate && comp.consumption) {
        const rate = parseFloat(comp.materialRate);
        const consumption = parseFloat(comp.consumption);
        if (!isNaN(rate) && !isNaN(consumption)) {
          totalMaterialCost += rate * consumption;
        }
      }
    });
    
    // Sum costs from custom components
    customComponents.forEach(comp => {
      if (comp.materialRate && comp.consumption) {
        const rate = parseFloat(comp.materialRate.toString());
        const consumption = parseFloat(comp.consumption.toString());
        if (!isNaN(rate) && !isNaN(consumption)) {
          totalMaterialCost += rate * consumption;
        }
      }
    });
    
    return totalMaterialCost;
  };
  
  // Calculate production costs from rates
  const calculateProductionCost = (): number => {
    const catalogData = {
      cutting_charge: orderDetails.cutting_charge ? parseFloat(orderDetails.cutting_charge) : 0,
      printing_charge: orderDetails.printing_charge ? parseFloat(orderDetails.printing_charge) : 0,
      stitching_charge: orderDetails.stitching_charge ? parseFloat(orderDetails.stitching_charge) : 0,
      transport_charge: orderDetails.transport_charge ? parseFloat(orderDetails.transport_charge) : 0
    };
    
    const orderQuantity = parseFloat(orderDetails.quantity || "0");
    if (isNaN(orderQuantity)) return 0;
    
    const { totalProductionCost } = calculateProductionCosts(catalogData, orderQuantity);
    return totalProductionCost;
  };
  
  // Update cost calculations
  const updateCostCalculations = () => {
    // Calculate material cost
    const materialCost = calculateMaterialCost();
    
    // Calculate production cost
    const productionCost = calculateProductionCost();
    
    // Calculate total cost
    const totalCost = materialCost + productionCost;
    
    // Get margin value 
    const margin = orderDetails.margin ? parseFloat(orderDetails.margin) : 
                  orderDetails.template_margin ? parseFloat(orderDetails.template_margin) : 15;
    
    // Calculate selling price based on margin
    const { revenue: sellingPrice } = calculateProfitUsingMargin(totalCost, margin);
    
    // Update cost data
    setCostData({
      materialCost,
      productionCost,
      totalCost,
      sellingPrice,
      margin
    });
  };
  
  return {
    costData,
    updateCostCalculations
  };
}
