
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useInventoryAnalytics = () => {
  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: transactionData, isLoading: transactionLoading } = useQuery({
    queryKey: ['transaction-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_transactions')
        .select('*');
      
      if (error) throw error;
      return data;
    }
  });

  // Calculate low stock items
  const lowStockItems = inventoryData?.filter(item => {
    if (!item) return false;
    const minLevel = item.min_stock_level || 0;
    return item.quantity <= minLevel;
  }) || [];

  // Calculate total inventory value
  const totalInventoryValue = inventoryData?.reduce((total, item) => {
    if (!item) return total;
    const value = (item.quantity || 0) * (item.purchase_rate || 0);
    return total + value;
  }, 0) || 0;

  // Calculate material consumption summary
  const materialConsumption = inventoryData?.map(item => {
    if (!item) return null;
    
    const consumptionTransactions = transactionData?.filter(transaction => 
      transaction?.material_id === item.id && 
      transaction?.transaction_type === 'consumption'
    ) || [];

    const totalConsumption = consumptionTransactions.reduce((sum, transaction) => {
      return sum + Math.abs(transaction?.quantity || 0);
    }, 0);

    return {
      id: item.id,
      material_name: item.material_name,
      color: item.color,
      gsm: item.gsm,
      unit: item.unit,
      current_stock: item.quantity,
      total_consumption: totalConsumption,
      value: (item.quantity || 0) * (item.purchase_rate || 0),
      last_purchase_rate: item.purchase_rate,
      min_stock_level: item.min_stock_level,
      reorder_level: item.reorder_level
    };
  }).filter(item => item !== null) || [];

  return {
    inventoryData: inventoryData || [],
    transactionData: transactionData || [],
    lowStockItems,
    totalInventoryValue,
    materialConsumption,
    isLoading: inventoryLoading || transactionLoading
  };
};
