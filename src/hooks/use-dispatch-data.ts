
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useOrderDispatchData = (orderId: string) => {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [dispatchData, setDispatchData] = useState<any>(null);
  const [dispatchBatches, setDispatchBatches] = useState<any[]>([]);
  const [productionStages, setProductionStages] = useState<any[]>([]);
  const [companyAddress, setCompanyAddress] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');

  useEffect(() => {
    if (!orderId) return;
    
    const fetchOrderAndDispatch = async () => {
      setLoading(true);
      try {
        // Fetch the order data with company information
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            job_cards (*),
            companies:company_id (*),
            sales_account:sales_account_id (*)
          `)
          .eq('id', orderId)
          .single();
        
        if (orderError) throw orderError;
        
        if (orderData) {
          setOrder(orderData);
          
          // Set company address from company or sales_account data
          if (orderData.companies && orderData.companies.address) {
            setCompanyAddress(orderData.companies.address);
            setCompanyName(orderData.companies.name);
          } else if (orderData.sales_account && orderData.sales_account.address) {
            setCompanyAddress(orderData.sales_account.address);
            setCompanyName(orderData.sales_account.name);
          }
        }
        
        // Check if there's a dispatch record for this order
        const { data: dispatchData, error: dispatchError } = await supabase
          .from('order_dispatches')
          .select('*')
          .eq('order_id', orderId)
          .single();
        
        if (dispatchError && !dispatchError.message.includes('No rows found')) {
          throw dispatchError;
        }
        
        if (dispatchData) {
          setDispatchData(dispatchData);
          
          // Fetch dispatch batches if dispatch exists
          const { data: batchesData, error: batchesError } = await supabase
            .from('dispatch_batches')
            .select('*')
            .eq('order_dispatch_id', dispatchData.id)
            .order('batch_number', { ascending: true });
          
          if (batchesError) throw batchesError;
          setDispatchBatches(batchesData || []);
        }
        
        // Fetch production stages data for the latest job card
        if (orderData?.job_cards?.[0]?.id) {
          const jobCardId = orderData.job_cards[0].id;
          const fetchStagesData = async () => {
            const stagePromises = [
              fetchStageData('cutting_jobs', jobCardId),
              fetchStageData('printing_jobs', jobCardId),
              fetchStageData('stitching_jobs', jobCardId)
            ];
            
            const stagesData = await Promise.all(stagePromises);
            setProductionStages(stagesData.flat());
          };
          
          await fetchStagesData();
        }
        
      } catch (error: any) {
        console.error('Error fetching order and dispatch data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to fetch data: ${error.message}`,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderAndDispatch();
  }, [orderId]);
  
  const fetchStageData = async (table: string, jobCardId: string) => {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('status, created_at')
        .eq('job_card_id', jobCardId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map((item: any) => ({
        name: table.replace('_jobs', ''),
        status: item.status,
        completedDate: item.status === 'completed' ? item.created_at : null
      }));
      
    } catch (error) {
      console.error(`Error fetching ${table} data:`, error);
      return [];
    }
  };
  
  return { 
    order, 
    dispatchData, 
    dispatchBatches, 
    productionStages, 
    loading,
    companyAddress,
    companyName
  };
};
