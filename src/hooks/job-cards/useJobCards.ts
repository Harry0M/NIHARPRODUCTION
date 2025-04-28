
import { useState, useEffect } from "react";
import { JobCardData } from "@/types/production";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useJobCardStatus } from "./useJobCardStatus";

export const useJobCards = () => {
  const [jobCards, setJobCards] = useState<JobCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const { getJobCardStatus } = useJobCardStatus();

  const fetchJobCards = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_cards')
        .select(`
          id, 
          job_name, 
          status, 
          created_at,
          order_id,
          orders (
            id,
            order_number,
            company_name
          ),
          cutting_jobs (
            id,
            status
          ),
          printing_jobs (
            id,
            status
          ),
          stitching_jobs (
            id,
            status
          )
        `)
        .order('created_at', { ascending: false });
    
      if (error) throw error;
    
      // Transform the data to ensure proper typing
      const formattedData: JobCardData[] = (data || []).map(item => ({
        id: item.id,
        job_name: item.job_name,
        created_at: item.created_at,
        order: {
          id: item.orders?.id || '',
          order_number: item.orders?.order_number || '',
          company_name: item.orders?.company_name || ''
        },
        cutting_jobs: item.cutting_jobs || [],
        printing_jobs: item.printing_jobs || [],
        stitching_jobs: item.stitching_jobs || [],
        status: getJobCardStatus({
          id: item.id,
          job_name: item.job_name,
          created_at: item.created_at,
          order: {
            id: item.orders?.id || '',
            order_number: item.orders?.order_number || '',
            company_name: item.orders?.company_name || ''
          },
          cutting_jobs: item.cutting_jobs || [],
          printing_jobs: item.printing_jobs || [],
          stitching_jobs: item.stitching_jobs || [],
          status: '' // This will be overwritten by getJobCardStatus
        })
      }));
    
      setJobCards(formattedData);
    } catch (error: any) {
      toast({
        title: "Error fetching job cards",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobCards();
  }, []);

  return {
    jobCards,
    setJobCards,
    loading,
    fetchJobCards
  };
};
