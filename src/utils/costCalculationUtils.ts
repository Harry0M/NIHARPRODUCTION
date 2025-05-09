
/**
 * Utility functions for detailed cost and profit calculations
 */

// Calculate detailed production costs from catalog data and order quantity
export const calculateProductionCosts = (
  catalogData: any,
  orderQuantity: number
): {
  cuttingCost: number;
  printingCost: number;
  stitchingCost: number;
  transportCost: number;
  totalProductionCost: number;
} => {
  // Extract rates from catalog data with fallbacks to zero
  const cuttingRate = Number(catalogData?.cutting_charge) || 0;
  const printingRate = Number(catalogData?.printing_charge) || 0;
  const stitchingRate = Number(catalogData?.stitching_charge) || 0;
  const transportRate = Number(catalogData?.transport_charge) || 0;
  
  // Calculate individual costs based on order quantity
  const cuttingCost = cuttingRate * orderQuantity;
  const printingCost = printingRate * orderQuantity;
  const stitchingCost = stitchingRate * orderQuantity;
  const transportCost = transportRate * orderQuantity;
  
  // Sum all production costs
  const totalProductionCost = cuttingCost + printingCost + stitchingCost + transportCost;
  
  return {
    cuttingCost,
    printingCost,
    stitchingCost,
    transportCost,
    totalProductionCost
  };
};

// Calculate profit using margin percentage from catalog
export const calculateProfitUsingMargin = (
  totalCost: number,
  margin: number | null | undefined
): {
  revenue: number;
  profit: number;
  profitMargin: number;
} => {
  // Use the margin or default to 15%
  const effectiveMargin = margin !== null && margin !== undefined ? Number(margin) : 15;
  
  // Calculate revenue using the formula: 
  // Revenue = Cost / (1 - margin/100)
  // This ensures that (Revenue - Cost) / Revenue = margin/100
  const revenue = effectiveMargin < 100 
    ? totalCost / (1 - effectiveMargin / 100) 
    : totalCost * 2; // Default multiplier if margin is 100% or higher
    
  const profit = revenue - totalCost;
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
  
  return {
    revenue,
    profit,
    profitMargin
  };
};

// Calculate selling price based on total cost and margin
export const calculateSellingPrice = (
  totalCost: number,
  margin: number | null | undefined
): number => {
  const { revenue } = calculateProfitUsingMargin(totalCost, margin);
  return revenue;
};
