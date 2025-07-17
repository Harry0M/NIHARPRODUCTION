import { useState, useEffect } from "react";
import { JobCardData, JobStatus } from "@/types/production";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useJobCardStatus } from "./useJobCardStatus";

interface JobCardsOptions {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  statusFilter?: string;
}

export const useJobCards = (options: JobCardsOptions = {}) => {
  const {
    page = 1,
    pageSize = 10,
    searchTerm = "",
    statusFilter = "all"
  } = options;

  const [jobCards, setJobCards] = useState<JobCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const { getJobCardStatus } = useJobCardStatus();

  const fetchJobCards = async () => {
    setLoading(true);
    try {
      let orderIds: string[] = [];
      if (searchTerm) {
        // Step 1: Search orders table for matching order_number or company_name
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id')
          .or(`order_number.ilike.*${searchTerm}*,company_name.ilike.*${searchTerm}*`);
        if (ordersError) throw ordersError;
        orderIds = (orders || []).map(order => order.id);
      }

      // First get total count for pagination
      let countQuery = supabase
        .from('job_cards')
        .select('id', { count: 'exact', head: true });
      
      // Apply filters to count query if provided
      if (searchTerm) {
        if (orderIds.length > 0) {
          countQuery = countQuery.or(`job_name.ilike.*${searchTerm}*,order_id.in.(${orderIds.join(',')})`);
        } else {
          countQuery = countQuery.or(`job_name.ilike.*${searchTerm}*`);
        }
      }
      
      // Get the count
      const { count, error: countError } = await countQuery;
      
      if (countError) throw countError;
      
      setTotalCount(count || 0);
      
      // Build main query with pagination
      let query = supabase
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
        `);
      
      // Apply search filter if provided
      if (searchTerm) {
        if (orderIds.length > 0) {
          query = query.or(`job_name.ilike.*${searchTerm}*,order_id.in.(${orderIds.join(',')})`);
        } else {
          query = query.or(`job_name.ilike.*${searchTerm}*`);
        }
      }
      
      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      // Execute query with ordering and pagination
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
    
      if (error) throw error;
    
      // Transform the data to ensure proper typing
      const formattedData: JobCardData[] = (data || []).map(item => {
        const jobCardData: JobCardData = {
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
          status: 'pending' as JobStatus // Default value for proper typing
        };
        
        // Now determine the actual status
        jobCardData.status = getJobCardStatus(jobCardData);
        return jobCardData;
      });
      
      // Filter by status if needed - this is done client-side since it's a computed value
      const filteredData = statusFilter === "all" 
        ? formattedData 
        : formattedData.filter(job => job.status === statusFilter);
    
      setJobCards(filteredData);
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
  }, [page, pageSize, searchTerm, statusFilter]);

  return {
    jobCards,
    setJobCards,
    loading,
    totalCount,
    fetchJobCards
  };
};
