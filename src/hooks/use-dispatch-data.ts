
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

        // Transform the data to ensure proper typing
        const typedOrder = {
          ...orderData,
          job_cards: (orderData?.job_cards || []).map((card: any) => ({
            ...card,
            cutting_jobs: card.cutting_jobs || [],
            printing_jobs: card.printing_jobs || [],
            stitching_jobs: card.stitching_jobs || []
          }))
        } as Order;

        setOrder(typedOrder);
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
