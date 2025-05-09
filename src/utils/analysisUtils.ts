
import { format } from 'date-fns';

/**
 * Format a currency value with Indian Rupee formatting
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Format a quantity with the appropriate unit
 */
export const formatQuantity = (value: number, unit: string): string => {
  return `${value.toFixed(2)} ${unit}`;
};

/**
 * Format a date for analysis displays
 */
export const formatAnalysisDate = (date: Date): string => {
  return format(date, 'dd MMM yyyy');
};

/**
 * Calculate the urgency level of inventory refill needs
 */
export const calculateRefillUrgency = (
  currentQuantity: number | null | undefined, 
  reorderLevel: number | null | undefined, 
  minStockLevel: number | null | undefined
): 'critical' | 'warning' | 'normal' => {
  // Default values if parameters are null/undefined
  const current = currentQuantity ?? 0;
  const reorder = reorderLevel ?? 0;
  const minStock = minStockLevel ?? 0;
  
  // Critical level: Below minimum stock level
  if (minStock > 0 && current <= minStock) {
    return 'critical';
  }
  
  // Warning level: Below reorder level but above minimum
  if (reorder > 0 && current <= reorder) {
    return 'warning';
  }
  
  // Normal level
  return 'normal';
};

/**
 * Calculate percentage change between two values
 */
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) {
    return current > 0 ? 100 : 0; // Avoid division by zero
  }
  
  return ((current - previous) / previous) * 100;
};
