
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type JobCard = Database['public']['Tables']['job_cards']['Row'] & {
  cutting_jobs: Database['public']['Tables']['cutting_jobs']['Row'][];
  printing_jobs: Database['public']['Tables']['printing_jobs']['Row'][];
  stitching_jobs: Database['public']['Tables']['stitching_jobs']['Row'][];
};

export type Order = Database['public']['Tables']['orders']['Row'] & {
  job_cards: JobCard[];
  companies?: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  sales_account?: {
    id: string;
    companies?: {
      id: string;
      name: string;
      address?: string;
      phone?: string;
      email?: string;
    };
  };
};

export const useDispatchData = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data: ordersData, error } = await supabase
          .from('orders')
          .select(`
            *,
            job_cards (
              *,
              cutting_jobs (*),
              printing_jobs (*),
              stitching_jobs (*)
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform the data to ensure proper typing
        const typedOrders = (ordersData as any[] || []).map(order => ({
          ...order,
          job_cards: (order.job_cards || []).map((card: any) => ({
            ...card,
            cutting_jobs: card.cutting_jobs || [],
            printing_jobs: card.printing_jobs || [],
            stitching_jobs: card.stitching_jobs || []
          }))
        })) as Order[];

        setOrders(typedOrders);
      } catch (error: any) {
        console.error('Error fetching orders:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return {
    orders,
    loading,
    error,
  };
};

// For the DispatchDetail page we need a custom hook that fetches data for a specific order
export const useOrderDispatchData = (orderId: string) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [dispatchData, setDispatchData] = useState<any | null>(null);
  const [dispatchBatches, setDispatchBatches] = useState<any[]>([]);
  const [productionStages, setProductionStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderData = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch order with job cards and production jobs
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            job_cards (
              *,
              cutting_jobs (*),
              printing_jobs (*),
              stitching_jobs (*)
            )
          `)
          .eq('id', orderId)
          .single();
          
        // Separately fetch company information to avoid relationship errors
        let companyData = null;
        let salesAccountData = null;

        if (!orderError && orderData?.company_id) {
          const { data: company } = await supabase
            .from('companies')
            .select('*')
            .eq('id', orderData.company_id)
            .single();
          companyData = company;
        }

        // Since 'sales_accounts' table doesn't exist in the schema, let's check if sales_account_id
        // references a company directly or skip this part if it doesn't exist
        if (!orderError && orderData?.sales_account_id) {
          // Try to get the company directly since it might be a reference to company
          const { data: salesAccountCompany } = await supabase
            .from('companies')
            .select('*')
            .eq('id', orderData.sales_account_id)
            .single();
            
          // Create a sales account structure with the company data
          if (salesAccountCompany) {
            salesAccountData = {
              id: orderData.sales_account_id,
              companies: salesAccountCompany
            };
          }
        }

        if (orderError) throw orderError;

        // Fetch dispatch data if it exists
        const { data: dispatchData, error: dispatchError } = await supabase
          .from('order_dispatches')
          .select('*')
          .eq('order_id', orderId)
          .single();

        // We don't throw here because dispatch data might not exist yet
        
        // Fetch dispatch batches if dispatch data exists
        let batches: any[] = [];
        if (dispatchData && !dispatchError) {
          const { data: batchesData, error: batchesError } = await supabase
            .from('dispatch_batches')
            .select('*')
            .eq('order_dispatch_id', dispatchData.id)
            .order('batch_number', { ascending: true });
          
          if (!batchesError) {
            batches = batchesData || [];
          }
        }

        // Prepare production stages data
        const stages = [];
        const jobCard = orderData?.job_cards?.[0];
        
        if (jobCard) {
          // Check cutting status
          const cuttingStatus = jobCard.cutting_jobs?.length > 0
            ? jobCard.cutting_jobs.every((job: any) => job.status === 'completed')
              ? 'completed'
              : 'in_progress'
            : 'pending';
          
          stages.push({
            name: 'Cutting',
            status: cuttingStatus,
            completedDate: cuttingStatus === 'completed'
              ? jobCard.cutting_jobs.sort((a: any, b: any) => 
                  new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
                )[0]?.updated_at
              : undefined
          });

          // Check printing status
          const printingStatus = jobCard.printing_jobs?.length > 0
            ? jobCard.printing_jobs.every((job: any) => job.status === 'completed')
              ? 'completed'
              : 'in_progress'
            : 'pending';
          
          stages.push({
            name: 'Printing',
            status: printingStatus,
            completedDate: printingStatus === 'completed'
              ? jobCard.printing_jobs.sort((a: any, b: any) => 
                  new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
                )[0]?.updated_at
              : undefined
          });

          // Check stitching status
          const stitchingStatus = jobCard.stitching_jobs?.length > 0
            ? jobCard.stitching_jobs.every((job: any) => job.status === 'completed')
              ? 'completed'
              : 'in_progress'
            : 'pending';
          
          stages.push({
            name: 'Stitching',
            status: stitchingStatus,
            completedDate: stitchingStatus === 'completed'
              ? jobCard.stitching_jobs.sort((a: any, b: any) => 
                  new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
                )[0]?.updated_at
              : undefined
          });
        }

        // Create our extended order object with company information
        const orderWithCompanyData: Order = {
          ...orderData,
          job_cards: (orderData.job_cards || []).map((card: any) => ({
            ...card,
            cutting_jobs: card.cutting_jobs || [],
            printing_jobs: card.printing_jobs || [],
            stitching_jobs: card.stitching_jobs || []
          })),
          // Explicitly add company data with correct typing
          companies: companyData as Order['companies'],
          sales_account: salesAccountData as Order['sales_account']
        };
        
        setOrder(orderWithCompanyData);
        setDispatchData(dispatchData || null);
        setDispatchBatches(batches);
        setProductionStages(stages);
      } catch (error: any) {
        console.error('Error fetching order data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId]);

  return {
    order,
    dispatchData,
    dispatchBatches,
    productionStages,
    loading,
    error,
  };
};
