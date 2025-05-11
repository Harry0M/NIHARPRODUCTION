
import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WastageData, WastageSummary, JobType, DateRange } from '@/types/wastage';
import { format } from 'date-fns';

export const useWastageAnalysis = () => {
  const [wastageData, setWastageData] = useState<WastageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    jobType: 'all' as JobType,
    dateRange: { from: undefined, to: undefined } as DateRange,
    worker: '',
    order: '',
  });

  useEffect(() => {
    fetchWastageData();
  }, [filters]);

  const fetchWastageData = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('wastage_analysis')
        .select('*');
      
      // Apply filters
      if (filters.jobType !== 'all') {
        query = query.eq('job_type', filters.jobType);
      }
      
      if (filters.worker) {
        query = query.ilike('worker_name', `%${filters.worker}%`);
      }
      
      if (filters.order) {
        query = query.or(`order_number.ilike.%${filters.order}%,company_name.ilike.%${filters.order}%`);
      }
      
      if (filters.dateRange.from) {
        query = query.gte('created_at', format(filters.dateRange.from, 'yyyy-MM-dd'));
      }
      
      if (filters.dateRange.to) {
        // Add one day to include the end date
        const endDate = new Date(filters.dateRange.to);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt('created_at', format(endDate, 'yyyy-MM-dd'));
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setWastageData(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching wastage data:', err);
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo<WastageSummary>(() => {
    if (!wastageData.length) {
      return {
        total_wastage_quantity: 0,
        total_wastage_percentage: 0,
        total_jobs: 0,
        by_type: {},
        worst_workers: [],
        worst_orders: []
      };
    }

    // Calculate total wastage
    let totalWastageQty = 0;
    let totalProvidedQty = 0;
    const byType: Record<string, {
      wastage_quantity: number;
      provided_quantity: number;
      jobs_count: number;
    }> = {};
    
    // For worker analysis
    const workerMap: Record<string, {
      wastage_quantity: number;
      provided_quantity: number;
      jobs_count: number;
    }> = {};
    
    // For order analysis
    const orderMap: Record<string, {
      order_number: string;
      company_name: string;
      wastage_quantity: number;
      provided_quantity: number;
      jobs_count: number;
    }> = {};

    // Process each record
    wastageData.forEach(item => {
      const wastageQty = Number(item.wastage_quantity) || 0;
      const providedQty = Number(item.provided_quantity) || 0;
      
      // Total calculations
      totalWastageQty += wastageQty;
      totalProvidedQty += providedQty;
      
      // By job type
      const jobType = item.job_type;
      if (!byType[jobType]) {
        byType[jobType] = { wastage_quantity: 0, provided_quantity: 0, jobs_count: 0 };
      }
      byType[jobType].wastage_quantity += wastageQty;
      byType[jobType].provided_quantity += providedQty;
      byType[jobType].jobs_count += 1;
      
      // By worker
      const workerKey = item.worker_name || 'Unknown Worker';
      if (!workerMap[workerKey]) {
        workerMap[workerKey] = { wastage_quantity: 0, provided_quantity: 0, jobs_count: 0 };
      }
      workerMap[workerKey].wastage_quantity += wastageQty;
      workerMap[workerKey].provided_quantity += providedQty;
      workerMap[workerKey].jobs_count += 1;
      
      // By order
      const orderKey = item.order_id;
      if (!orderMap[orderKey]) {
        orderMap[orderKey] = {
          order_number: item.order_number,
          company_name: item.company_name,
          wastage_quantity: 0,
          provided_quantity: 0,
          jobs_count: 0
        };
      }
      orderMap[orderKey].wastage_quantity += wastageQty;
      orderMap[orderKey].provided_quantity += providedQty;
      orderMap[orderKey].jobs_count += 1;
    });

    // Calculate overall wastage percentage
    const totalWastagePercentage = totalProvidedQty > 0 
      ? (totalWastageQty / totalProvidedQty * 100) 
      : 0;
    
    // Convert job type map to the required format
    const byTypeResult: WastageSummary['by_type'] = {};
    Object.entries(byType).forEach(([type, data]) => {
      byTypeResult[type] = {
        wastage_quantity: data.wastage_quantity,
        wastage_percentage: data.provided_quantity > 0 
          ? (data.wastage_quantity / data.provided_quantity * 100) 
          : 0,
        jobs_count: data.jobs_count
      };
    });
    
    // Get worst workers (sorted by percentage)
    const worstWorkers = Object.entries(workerMap)
      .map(([worker_name, data]) => ({
        worker_name: worker_name === 'Unknown Worker' ? null : worker_name,
        wastage_percentage: data.provided_quantity > 0 
          ? (data.wastage_quantity / data.provided_quantity * 100) 
          : 0,
        jobs_count: data.jobs_count
      }))
      .sort((a, b) => b.wastage_percentage - a.wastage_percentage)
      .slice(0, 5);
    
    // Get worst orders (sorted by percentage)
    const worstOrders = Object.values(orderMap)
      .map(data => ({
        order_number: data.order_number,
        company_name: data.company_name,
        wastage_percentage: data.provided_quantity > 0 
          ? (data.wastage_quantity / data.provided_quantity * 100) 
          : 0,
        wastage_quantity: data.wastage_quantity
      }))
      .sort((a, b) => b.wastage_percentage - a.wastage_percentage)
      .slice(0, 5);

    return {
      total_wastage_quantity: totalWastageQty,
      total_wastage_percentage: totalWastagePercentage,
      total_jobs: wastageData.length,
      by_type: byTypeResult,
      worst_workers: worstWorkers,
      worst_orders: worstOrders
    };
  }, [wastageData]);

  return {
    wastageData,
    summary,
    loading,
    error,
    filters,
    setFilters,
    refetch: fetchWastageData
  };
};
