
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
