
import { format, subDays } from 'date-fns';
import { StockTransaction } from '@/types/inventory';

export type ConsumptionData = {
  materialId: string;
  materialName: string;
  totalConsumption: number;
  unit: string;
  value: number;
  percentage?: number;
};

export type OrderConsumptionData = {
  orderId: string;
  orderNumber: string;
  companyName: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  value: number;
  date: string;
};

// Calculate the total consumption of a material
export const calculateTotalConsumption = (transactions: StockTransaction[], materialId: string): number => {
  return transactions
    .filter(t => t.material_id === materialId && t.transaction_type === 'order')
    .reduce((total, t) => total + Math.abs(t.quantity), 0);
};

// Calculate the total value of consumed material
export const calculateConsumptionValue = (
  transactions: StockTransaction[], 
  materialId: string,
  unitPrice: number
): number => {
  const totalConsumption = calculateTotalConsumption(transactions, materialId);
  return totalConsumption * unitPrice;
};

// Format a number as currency (INR)
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

// Format a date for display
export const formatAnalysisDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'dd MMM yyyy');
  } catch (error) {
    return 'Invalid date';
  }
};

// Get default date range for filters (last 30 days)
export const getDefaultDateRange = () => {
  const endDate = new Date();
  const startDate = subDays(endDate, 30);
  return { startDate, endDate };
};

// Group transactions by material for visualization
export const groupTransactionsByMaterial = (transactions: StockTransaction[]) => {
  const groupedData: Record<string, { consumption: number; materialId: string }> = {};
  
  transactions.forEach(transaction => {
    if (transaction.transaction_type === 'order' && transaction.quantity < 0) {
      if (!groupedData[transaction.material_id]) {
        groupedData[transaction.material_id] = {
          consumption: 0,
          materialId: transaction.material_id
        };
      }
      groupedData[transaction.material_id].consumption += Math.abs(transaction.quantity);
    }
  });
  
  return Object.values(groupedData);
};

// Calculate refill urgency level based on current quantity and reorder level
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

// Format a quantity with its unit
export const formatQuantity = (quantity: number, unit: string): string => {
  return `${quantity.toFixed(2)} ${unit}`;
};

// Calculate the percentage of a value relative to a total
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return (value / total) * 100;
};
