
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { PartnerPerformanceData, PartnerJobData } from "@/types/production";

export const usePartnerPerformance = (dateRange?: { from: Date; to: Date }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [partnerPerformance, setPartnerPerformance] = useState<PartnerPerformanceData[]>([]);
  const [partnerJobs, setPartnerJobs] = useState<PartnerJobData[]>([]);

  // Convert JavaScript Date to ISO string format suitable for database queries
  const formatDateForQuery = (date: Date) => {
    return date.toISOString();
  };

  useEffect(() => {
    const fetchPartnerPerformanceData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Prepare date filters if provided
        let dateFilter = {};
        if (dateRange?.from && dateRange?.to) {
          dateFilter = {
            created_at: {
              gte: formatDateForQuery(dateRange.from),
              lte: formatDateForQuery(dateRange.to)
            }
          };
        }

        // Fetch cutting job data with workers
        const { data: cuttingJobs, error: cuttingError } = await supabase
          .from('cutting_jobs')
          .select(`
            id,
            job_card_id,
            worker_name,
            is_internal,
            status,
            roll_width,
            consumption_meters,
            received_quantity,
            created_at,
            updated_at,
            rate,
            job_cards(
              job_name,
              orders(order_number, company_name)
            )
          `)
          .eq('is_internal', false)
          .order('created_at', { ascending: false });
          
        if (cuttingError) throw cuttingError;

        // Fetch printing job data with workers
        const { data: printingJobs, error: printingError } = await supabase
          .from('printing_jobs')
          .select(`
            id,
            job_card_id,
            worker_name,
            is_internal,
            status,
            pulling,
            gsm,
            received_quantity,
            created_at,
            updated_at,
            rate,
            job_cards(
              job_name,
              orders(order_number, company_name)
            )
          `)
          .eq('is_internal', false)
          .order('created_at', { ascending: false });
          
        if (printingError) throw printingError;

        // Fetch stitching job data with workers
        const { data: stitchingJobs, error: stitchingError } = await supabase
          .from('stitching_jobs')
          .select(`
            id,
            job_card_id,
            worker_name,
            is_internal,
            status,
            provided_quantity,
            received_quantity,
            created_at,
            updated_at,
            rate,
            job_cards(
              job_name,
              orders(order_number, company_name)
            )
          `)
          .eq('is_internal', false)
          .order('created_at', { ascending: false });
          
        if (stitchingError) throw stitchingError;

        // Process and transform the data
        const allPartnerJobs: PartnerJobData[] = [];
        const partnerMap: Record<string, PartnerPerformanceData> = {};

        // Process cutting jobs
        cuttingJobs?.forEach(job => {
          if (!job.worker_name) return;
          
          const partnerName = job.worker_name;
          const providedQuantity = job.consumption_meters || 0;
          const receivedQuantity = job.received_quantity || 0;
          const rate = typeof job.rate === 'string' ? parseFloat(job.rate) : (job.rate || 0);
          const jobName = job.job_cards?.job_name || '';
          const orderName = job.job_cards?.orders?.order_number || '';
          
          // Add to individual job list
          allPartnerJobs.push({
            id: job.id,
            job_type: 'cutting',
            partner_name: partnerName,
            provided_quantity: providedQuantity,
            received_quantity: receivedQuantity,
            waste_percentage: providedQuantity > 0 ? 
              ((providedQuantity - receivedQuantity) / providedQuantity) * 100 : 0,
            rate,
            created_at: job.created_at,
            completed_at: job.status === 'completed' ? job.updated_at : undefined,
            status: job.status,
            job_card_id: job.job_card_id,
            job_name: jobName,
            order_name: orderName
          });
          
          // Update aggregated partner performance
          if (!partnerMap[partnerName]) {
            partnerMap[partnerName] = {
              partner_name: partnerName,
              job_type: 'cutting',
              total_jobs: 0,
              completed_jobs: 0,
              total_provided_quantity: 0,
              total_received_quantity: 0,
              efficiency_ratio: 0,
              average_rate: 0,
              total_cost: 0
            };
          }
          
          partnerMap[partnerName].total_jobs += 1;
          if (job.status === 'completed') {
            partnerMap[partnerName].completed_jobs += 1;
          }
          partnerMap[partnerName].total_provided_quantity += providedQuantity;
          partnerMap[partnerName].total_received_quantity += receivedQuantity;
          partnerMap[partnerName].total_cost += receivedQuantity * rate;
        });

        // Process printing jobs
        printingJobs?.forEach(job => {
          if (!job.worker_name) return;
          
          const partnerName = job.worker_name;
          const providedQuantity = job.pulling ? parseFloat(job.pulling) : 0;
          const receivedQuantity = job.received_quantity ? 
            (typeof job.received_quantity === 'string' ? 
              parseFloat(job.received_quantity) : job.received_quantity) : 0;
          const rate = typeof job.rate === 'string' ? parseFloat(job.rate) : (job.rate || 0);
          const jobName = job.job_cards?.job_name || '';
          const orderName = job.job_cards?.orders?.order_number || '';
          
          // Add to individual job list
          allPartnerJobs.push({
            id: job.id,
            job_type: 'printing',
            partner_name: partnerName,
            provided_quantity: providedQuantity,
            received_quantity: receivedQuantity,
            waste_percentage: providedQuantity > 0 ? 
              ((providedQuantity - receivedQuantity) / providedQuantity) * 100 : 0,
            rate,
            created_at: job.created_at,
            completed_at: job.status === 'completed' ? job.updated_at : undefined,
            status: job.status,
            job_card_id: job.job_card_id,
            job_name: jobName,
            order_name: orderName
          });
          
          // Update aggregated partner performance
          if (!partnerMap[partnerName]) {
            partnerMap[partnerName] = {
              partner_name: partnerName,
              job_type: 'printing',
              total_jobs: 0,
              completed_jobs: 0,
              total_provided_quantity: 0,
              total_received_quantity: 0,
              efficiency_ratio: 0,
              average_rate: 0,
              total_cost: 0
            };
          }
          
          partnerMap[partnerName].total_jobs += 1;
          if (job.status === 'completed') {
            partnerMap[partnerName].completed_jobs += 1;
          }
          partnerMap[partnerName].total_provided_quantity += providedQuantity;
          partnerMap[partnerName].total_received_quantity += receivedQuantity;
          partnerMap[partnerName].total_cost += receivedQuantity * rate;
        });

        // Process stitching jobs
        stitchingJobs?.forEach(job => {
          if (!job.worker_name) return;
          
          const partnerName = job.worker_name;
          const providedQuantity = job.provided_quantity || 0;
          const receivedQuantity = job.received_quantity || 0;
          const rate = typeof job.rate === 'string' ? parseFloat(job.rate as string) : (job.rate || 0);
          const jobName = job.job_cards?.job_name || '';
          const orderName = job.job_cards?.orders?.order_number || '';
          
          // Add to individual job list
          allPartnerJobs.push({
            id: job.id,
            job_type: 'stitching',
            partner_name: partnerName,
            provided_quantity: providedQuantity,
            received_quantity: receivedQuantity,
            waste_percentage: providedQuantity > 0 ? 
              ((providedQuantity - receivedQuantity) / providedQuantity) * 100 : 0,
            rate,
            created_at: job.created_at,
            completed_at: job.status === 'completed' ? job.updated_at : undefined,
            status: job.status,
            job_card_id: job.job_card_id,
            job_name: jobName,
            order_name: orderName
          });
          
          // Update aggregated partner performance
          if (!partnerMap[partnerName]) {
            partnerMap[partnerName] = {
              partner_name: partnerName,
              job_type: 'stitching',
              total_jobs: 0,
              completed_jobs: 0,
              total_provided_quantity: 0,
              total_received_quantity: 0,
              efficiency_ratio: 0,
              average_rate: 0,
              total_cost: 0
            };
          }
          
          partnerMap[partnerName].total_jobs += 1;
          if (job.status === 'completed') {
            partnerMap[partnerName].completed_jobs += 1;
          }
          partnerMap[partnerName].total_provided_quantity += providedQuantity;
          partnerMap[partnerName].total_received_quantity += receivedQuantity;
          partnerMap[partnerName].total_cost += receivedQuantity * rate;
        });

        // Calculate final metrics for each partner
        const processedPartnerData = Object.values(partnerMap).map(partner => {
          const efficiency = partner.total_provided_quantity > 0 ? 
            (partner.total_received_quantity / partner.total_provided_quantity) * 100 : 0;
            
          const avgRate = partner.total_received_quantity > 0 ? 
            partner.total_cost / partner.total_received_quantity : 0;
            
          return {
            ...partner,
            efficiency_ratio: parseFloat(efficiency.toFixed(2)),
            average_rate: parseFloat(avgRate.toFixed(2))
          };
        });

        setPartnerJobs(allPartnerJobs);
        setPartnerPerformance(processedPartnerData);
      } catch (err: any) {
        console.error('Error fetching partner performance data:', err);
        setError(err);
        toast({
          title: "Error fetching partner data",
          description: err.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPartnerPerformanceData();
  }, [dateRange]);

  return {
    loading,
    error,
    partnerPerformance,
    partnerJobs
  };
};
