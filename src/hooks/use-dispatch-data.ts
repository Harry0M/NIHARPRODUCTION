
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { DispatchData, DispatchBatch } from "@/types/dispatch";

export const useDispatchData = (orderId: string) => {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [dispatchData, setDispatchData] = useState<DispatchData | null>(null);
  const [dispatchBatches, setDispatchBatches] = useState<DispatchBatch[]>([]);
  const [productionStages, setProductionStages] = useState<any[]>([]);

  useEffect(() => {
    if (orderId) {
      fetchOrderData(orderId);
    }
  }, [orderId]);

  const fetchOrderData = async (orderId: string) => {
    setLoading(true);
    try {
      const { data: orderData, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          company_name,
          quantity,
          rate,
          bag_length,
          bag_width,
          status,
          created_at,
          job_cards (
            id,
            job_name,
            status,
            cutting_jobs (id, status, updated_at),
            printing_jobs (id, status, updated_at),
            stitching_jobs (id, status, updated_at)
          )
        `)
        .eq("id", orderId)
        .maybeSingle();

      if (error) throw error;
      if (!orderData) {
        toast({
          title: "Order not found",
          description: "This order does not exist.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      setOrder(orderData);

      // Derive production stages status
      const card = orderData.job_cards?.[0];
      const stages = [
        {
          name: "Cutting",
          status: card?.cutting_jobs?.[0]?.status || "pending",
          completedDate: card?.cutting_jobs?.[0]?.status === "completed" ? card?.cutting_jobs?.[0]?.updated_at : undefined,
        },
        {
          name: "Printing",
          status: card?.printing_jobs?.[0]?.status || "pending",
          completedDate: card?.printing_jobs?.[0]?.status === "completed" ? card?.printing_jobs?.[0]?.updated_at : undefined,
        },
        {
          name: "Stitching",
          status: card?.stitching_jobs?.[0]?.status || "pending",
          completedDate: card?.stitching_jobs?.[0]?.status === "completed" ? card?.stitching_jobs?.[0]?.updated_at : undefined,
        },
      ];
      setProductionStages(stages);

      // Fetch dispatch data
      const { data: dispatch, error: dispatchError } = await supabase
        .from("order_dispatches")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();

      if (dispatchError) throw dispatchError;
      
      if (dispatch) {
        setDispatchData(dispatch);
        
        const { data: batches, error: batchesError } = await supabase
          .from("dispatch_batches")
          .select("*")
          .eq("order_dispatch_id", dispatch.id)
          .order("batch_number", { ascending: true });
          
        if (batchesError) throw batchesError;
        if (batches) {
          setDispatchBatches(batches);
        }
      }
    } catch (err: any) {
      toast({
        title: "Error loading dispatch details",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    order,
    dispatchData,
    dispatchBatches,
    productionStages,
  };
};
