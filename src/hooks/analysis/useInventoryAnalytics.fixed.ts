
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface InventoryItem {
  id: string;
  material_name: string;
  quantity: number;
  unit: string;
  purchase_rate: number | null;
  min_stock_level: number | null;
  color?: string;
  gsm?: string;
}

interface MaterialConsumption {
  material_id: string;
  material_name: string;
  total_consumption: number;
  orders_count: number;
  unit: string;
  color?: string;
  gsm?: string;
}

interface WastageData {
  id: string;
  order_number: string;
  company_name: string;
  job_number: string;
  job_type: string;
  worker_name: string;
  provided_quantity: number;
  received_quantity: number;
  wastage_quantity: number;
  wastage_percentage: number;
}

export const useInventoryAnalytics = () => {
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [consumptionData, setConsumptionData] = useState<MaterialConsumption[]>([]);
  const [wastageData, setWastageData] = useState<WastageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventoryData = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('material_name');

      if (error) throw error;
      setInventoryData(data || []);
    } catch (err: any) {
      console.error('Error fetching inventory data:', err);
      setError(err.message);
    }
  };

  const fetchConsumptionData = async () => {
    try {
      const { data, error } = await supabase
        .from('material_consumption_analysis')
        .select('*')
        .order('total_consumption', { ascending: false });

      if (error) throw error;
      setConsumptionData(data || []);
    } catch (err: any) {
      console.error('Error fetching consumption data:', err);
      setError(err.message);
    }
  };

  const fetchWastageData = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_production_wastage');

      if (error) throw error;
      setWastageData(data || []);
    } catch (err: any) {
      console.error('Error fetching wastage data:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchInventoryData(),
        fetchConsumptionData(),
        fetchWastageData()
      ]);
      setIsLoading(false);
    };

    fetchAllData();
  }, []);

  const getInventoryValue = () => {
    return inventoryData.reduce((total, item) => {
      if (item && item.quantity && item.purchase_rate) {
        return total + (item.quantity * item.purchase_rate);
      }
      return total;
    }, 0);
  };

  const getLowStockItems = () => {
    return inventoryData.filter(item => {
      if (!item || !item.min_stock_level) return false;
      return item.quantity <= item.min_stock_level;
    });
  };

  const getTopConsumedMaterials = (limit = 10) => {
    return consumptionData.slice(0, limit);
  };

  const getTotalWastage = () => {
    return wastageData.reduce((total, item) => {
      if (item && item.wastage_quantity) {
        return total + item.wastage_quantity;
      }
      return total;
    }, 0);
  };

  const getWastageByWorker = () => {
    const workerWastage: Record<string, { total: number; count: number }> = {};
    
    wastageData.forEach(item => {
      if (item && item.worker_name && item.wastage_quantity) {
        if (!workerWastage[item.worker_name]) {
          workerWastage[item.worker_name] = { total: 0, count: 0 };
        }
        workerWastage[item.worker_name].total += item.wastage_quantity;
        workerWastage[item.worker_name].count += 1;
      }
    });

    return Object.entries(workerWastage).map(([worker, data]) => ({
      worker,
      totalWastage: data.total,
      averageWastage: data.total / data.count,
      jobCount: data.count
    }));
  };

  const getInventoryTurnover = () => {
    // Calculate inventory turnover based on consumption and average inventory
    const totalConsumption = consumptionData.reduce((total, item) => {
      if (item && item.total_consumption) {
        return total + item.total_consumption;
      }
      return total;
    }, 0);

    const totalInventoryValue = getInventoryValue();
    return totalInventoryValue > 0 ? totalConsumption / totalInventoryValue : 0;
  };

  return {
    inventoryData,
    consumptionData,
    wastageData,
    isLoading,
    error,
    getInventoryValue,
    getLowStockItems,
    getTopConsumedMaterials,
    getTotalWastage,
    getWastageByWorker,
    getInventoryTurnover,
    refetch: () => {
      fetchInventoryData();
      fetchConsumptionData();
      fetchWastageData();
    }
  };
};
