import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'] & {
  job_cards: (Database['public']['Tables']['job_cards']['Row'] & {
    cutting_jobs: Database['public']['Tables']['cutting_jobs']['Row'][];
    printing_jobs: Database['public']['Tables']['printing_jobs']['Row'][];
    stitching_jobs: Database['public']['Tables']['stitching_jobs']['Row'][];
  })[];
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
              id,
              job_name,
              status,
              cutting_jobs (
                id,
                status,
                updated_at
              ),
              printing_jobs (
                id,
                status,
                updated_at
              ),
              stitching_jobs (
                id,
                status,
                updated_at
              )
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform the data to ensure proper typing
        const transformedOrders = ordersData?.map(order => ({
          ...order,
          job_cards: order.job_cards?.map(card => ({
            ...card,
            cutting_jobs: card.cutting_jobs || [],
            printing_jobs: card.printing_jobs || [],
            stitching_jobs: card.stitching_jobs || []
          })) || []
        })) || [];

        setOrders(transformedOrders);
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
