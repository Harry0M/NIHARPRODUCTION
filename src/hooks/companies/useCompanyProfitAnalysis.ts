import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showToast } from '@/components/ui/enhanced-toast';

interface CompanyProfitData {
  id: string;
  name: string;
  totalOrders: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  averageOrderValue: number;
  averageProfit: number;
  profitMargin: number;
  mostProfitableOrder: {
    id: string;
    orderNumber: string;
    profit: number;
    profitMargin: number;
    date: string;
  } | null;
  leastProfitableOrder: {
    id: string;
    orderNumber: string;
    profit: number;
    profitMargin: number;
    date: string;
  } | null;
  ordersByMonth: Array<{
    month: string;
    count: number;
    revenue: number;
    profit: number;
  }>;
}

/**
 * Hook to fetch comprehensive profit analysis for companies
 * Includes total profits, most profitable orders, trends, and more
 */
export function useCompanyProfitAnalysis(companyId?: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [profitData, setProfitData] = useState<CompanyProfitData[]>([]);

  useEffect(() => {
    const fetchProfitAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get companies to analyze
        let companiesToAnalyze;
        if (companyId) {
          const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('id, name')
            .eq('id', companyId)
            .single();

          if (companyError) {
            throw new Error(companyError.message);
          }
          companiesToAnalyze = [company];
        } else {
          const { data: companies, error: companiesError } = await supabase
            .from('companies')
            .select('id, name');

          if (companiesError) {
            throw new Error(companiesError.message);
          }
          companiesToAnalyze = companies;
        }

        // Fetch profit data for each company
        const profitPromises = companiesToAnalyze.map(async (company) => {
          // Get all orders for this company (both as primary company and sales account)
          const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select(`
              id,
              order_number,
              order_date,
              total_cost,
              calculated_selling_price,
              material_cost,
              cutting_charge,
              printing_charge,
              stitching_charge,
              transport_charge,
              margin
            `)
            .or(`company_id.eq.${company.id},sales_account_id.eq.${company.id}`)
            .order('order_date', { ascending: false });

          if (ordersError) {
            console.error('Error fetching orders for company:', company.name, ordersError);
            return {
              id: company.id,
              name: company.name,
              totalOrders: 0,
              totalRevenue: 0,
              totalCost: 0,
              totalProfit: 0,
              averageOrderValue: 0,
              averageProfit: 0,
              profitMargin: 0,
              mostProfitableOrder: null,
              leastProfitableOrder: null,
              ordersByMonth: []
            };
          }

          const validOrders = orders || [];
          const totalOrders = validOrders.length;

          if (totalOrders === 0) {
            return {
              id: company.id,
              name: company.name,
              totalOrders: 0,
              totalRevenue: 0,
              totalCost: 0,
              totalProfit: 0,
              averageOrderValue: 0,
              averageProfit: 0,
              profitMargin: 0,
              mostProfitableOrder: null,
              leastProfitableOrder: null,
              ordersByMonth: []
            };
          }

          // Calculate totals
          const totalRevenue = validOrders.reduce((sum, order) => sum + (Number(order.calculated_selling_price) || 0), 0);
          const totalCost = validOrders.reduce((sum, order) => sum + (Number(order.total_cost) || 0), 0);
          const totalProfit = totalRevenue - totalCost;
          const averageOrderValue = totalRevenue / totalOrders;
          const averageProfit = totalProfit / totalOrders;
          const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

          // Find most and least profitable orders
          const ordersWithProfit = validOrders.map(order => {
            const revenue = Number(order.calculated_selling_price) || 0;
            const cost = Number(order.total_cost) || 0;
            const profit = revenue - cost;
            const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
            
            return {
              id: order.id,
              orderNumber: order.order_number,
              profit,
              profitMargin: margin,
              date: order.order_date || new Date().toISOString()
            };
          });

          const mostProfitableOrder = ordersWithProfit.length > 0 
            ? ordersWithProfit.reduce((max, order) => order.profit > max.profit ? order : max)
            : null;

          const leastProfitableOrder = ordersWithProfit.length > 0 
            ? ordersWithProfit.reduce((min, order) => order.profit < min.profit ? order : min)
            : null;

          // Group orders by month
          const ordersByMonth = validOrders.reduce((monthlyData: Record<string, { month: string; count: number; revenue: number; profit: number }>, order) => {
            const orderDate = new Date(order.order_date || new Date());
            const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = {
                month: monthKey,
                count: 0,
                revenue: 0,
                profit: 0
              };
            }
            
            const revenue = Number(order.calculated_selling_price) || 0;
            const cost = Number(order.total_cost) || 0;
            
            monthlyData[monthKey].count += 1;
            monthlyData[monthKey].revenue += revenue;
            monthlyData[monthKey].profit += (revenue - cost);
            
            return monthlyData;
          }, {});

          // Convert to array and sort by month
          const monthlyArray = Object.values(ordersByMonth).sort((a: { month: string }, b: { month: string }) => {
            return a.month.localeCompare(b.month);
          });

          return {
            id: company.id,
            name: company.name,
            totalOrders,
            totalRevenue,
            totalCost,
            totalProfit,
            averageOrderValue,
            averageProfit,
            profitMargin,
            mostProfitableOrder,
            leastProfitableOrder,
            ordersByMonth: monthlyArray
          };
        });

        const results = await Promise.all(profitPromises);
        setProfitData(results);
      } catch (error) {
        console.error('Error fetching profit analysis:', error);
        setError(error instanceof Error ? error : new Error('Unknown error fetching profit analysis'));
        showToast({
          title: 'Error Fetching Profit Analysis',
          description: error instanceof Error ? error.message : 'Unknown error occurred',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfitAnalysis();
  }, [companyId]);

  return { profitData, loading, error };
}
