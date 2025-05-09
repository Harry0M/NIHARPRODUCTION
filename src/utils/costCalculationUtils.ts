
/**
 * Calculate all production costs based on the catalog data and order quantity
 */
export const calculateProductionCosts = (
  catalogData: {
    cutting_charge?: number;
    printing_charge?: number;
    stitching_charge?: number;
    transport_charge?: number;
  },
  orderQuantity: number
) => {
  // Get individual costs from catalog data or default to 0
  const cuttingCharge = (catalogData.cutting_charge || 0) * orderQuantity;
  const printingCharge = (catalogData.printing_charge || 0) * orderQuantity;
  const stitchingCharge = (catalogData.stitching_charge || 0) * orderQuantity;
  const transportCharge = (catalogData.transport_charge || 0);
  
  // Sum all production costs
  const totalProductionCost = 
    cuttingCharge + 
    printingCharge + 
    stitchingCharge + 
    transportCharge;
  
  return {
    cuttingCharge,
    printingCharge,
    stitchingCharge, 
    transportCharge,
    totalProductionCost
  };
};

/**
 * Calculate profit and revenue based on cost and margin
 */
export const calculateProfitUsingMargin = (cost: number, marginPercent: number) => {
  if (isNaN(cost) || isNaN(marginPercent)) return { profit: 0, revenue: 0 };
  
  const margin = marginPercent / 100;
  const revenue = cost / (1 - margin);
  const profit = revenue - cost;
  
  return { profit, revenue };
};

/**
 * Format a currency value
 */
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(value);
};
