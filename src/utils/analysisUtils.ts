
import { format } from 'date-fns';

/**
 * Format a currency value for display
 */
export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '₹0.00';
  return `₹${value.toFixed(2)}`;
};

/**
 * Format a quantity with its unit for display
 */
export const formatQuantity = (value: number | null | undefined, unit: string): string => {
  if (value === null || value === undefined) return '0';
  return `${value.toFixed(2)} ${unit}`;
};

/**
 * Format a date for analysis display
 */
export const formatAnalysisDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'dd MMM yyyy');
  } catch (e) {
    return dateString;
  }
};

/**
 * Calculate percentage change between two values
 */
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Format percentage for display
 */
export const formatPercentage = (value: number): string => {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};

/**
 * Group data by date for time-series analysis
 */
export const groupByDate = (data: any[], dateField: string) => {
  const grouped: Record<string, any[]> = {};
  
  data.forEach(item => {
    if (!item[dateField]) return;
    
    const date = format(new Date(item[dateField]), 'yyyy-MM-dd');
    
    if (!grouped[date]) {
      grouped[date] = [];
    }
    
    grouped[date].push(item);
  });
  
  return Object.entries(grouped).map(([date, items]) => ({
    date,
    count: items.length,
    items
  }));
};

/**
 * Calculate total consumption by material
 */
export const calculateTotalConsumptionByMaterial = (data: any[]) => {
  const materialMap: Record<string, any> = {};
  
  data.forEach(item => {
    const materialId = item.material_id;
    if (!materialId) return;
    
    if (!materialMap[materialId]) {
      materialMap[materialId] = {
        material_id: materialId,
        material_name: item.material_name || 'Unknown Material',
        total_usage: 0,
        unit: item.unit || 'units',
        transactions_count: 0
      };
    }
    
    materialMap[materialId].total_usage += Math.abs(item.quantity || 0);
    materialMap[materialId].transactions_count += 1;
  });
  
  return Object.values(materialMap);
};

/**
 * Calculate refill urgency level
 */
export const calculateRefillUrgency = (
  currentQuantity: number, 
  reorderLevel: number | null,
  minStockLevel: number | null
): 'critical' | 'warning' | 'normal' => {
  if (reorderLevel === null) return 'normal';
  
  // If below minimum stock level, it's critical
  if (minStockLevel !== null && currentQuantity < minStockLevel) {
    return 'critical';
  }
  
  // If below reorder level, it's a warning
  if (currentQuantity < reorderLevel) {
    return 'warning';
  }
  
  return 'normal';
};
