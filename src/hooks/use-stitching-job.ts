
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface JobCard {
  id: string;
  job_name: string;
  order: {
    order_number: string;
    company_name: string;
    quantity: number;
  };
}

export interface StitchingJobData {
  id: string;
  job_card_id: string;
  total_quantity: number | null;
  part_quantity: number | null;
  border_quantity: number | null;
  handle_quantity: number | null;
  chain_quantity: number | null;
  runner_quantity: number | null;
  piping_quantity: number | null;
  start_date: string | null;
  expected_completion_date: string | null;
  notes: string | null;
  worker_name: string | null;
  is_internal: boolean;
  status: "pending" | "in_progress" | "completed";
  rate: number | null;
  created_at?: string;
}

export const useStitchingJob = (jobCardId: string | undefined) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [existingJobs, setExistingJobs] = useState<StitchingJobData[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!jobCardId) return;
    fetchJobCard(jobCardId);
  }, [jobCardId]);

  const fetchJobCard = async (id: string) => {
    setFetching(true);
    try {
      const { data: jobCardData, error: jobCardError } = await supabase
        .from('job_cards')
        .select(`
          id, 
          job_name,
          order:orders (
            order_number,
            company_name,
            quantity
          )
        `)
        .eq('id', id)
        .single();
      
      if (jobCardError) throw jobCardError;
      if (!jobCardData) throw new Error("Job card not found");
      
      setJobCard(jobCardData as JobCard);
      
      const { data: stitchingJobs, error: stitchingJobsError } = await supabase
        .from('stitching_jobs')
        .select('*')
        .eq('job_card_id', id)
        .order('created_at', { ascending: false });
      
      if (stitchingJobsError) throw stitchingJobsError;
      
      if (stitchingJobs) {
        setExistingJobs(stitchingJobs);
      }
      
    } catch (error: any) {
      toast({
        title: "Error fetching job details",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!jobCardId || !jobCard) {
      toast({
        title: "Error",
        description: "Job card information is missing",
        variant: "destructive",
      });
      return false;
    }
    
    setLoading(true);
    
    try {
      // Convert date objects to strings and ensure numeric fields are properly formatted
      const stitchingJobData = {
        job_card_id: jobCardId,
        total_quantity: values.total_quantity ? Number(values.total_quantity) : null,
        part_quantity: values.part_quantity ? Number(values.part_quantity) : null,
        border_quantity: values.border_quantity ? Number(values.border_quantity) : null,
        handle_quantity: values.handle_quantity ? Number(values.handle_quantity) : null,
        chain_quantity: values.chain_quantity ? Number(values.chain_quantity) : null,
        runner_quantity: values.runner_quantity ? Number(values.runner_quantity) : null,
        piping_quantity: values.piping_quantity ? Number(values.piping_quantity) : null,
        start_date: values.start_date ? format(values.start_date, 'yyyy-MM-dd') : null,
        expected_completion_date: values.expected_completion_date ? format(values.expected_completion_date, 'yyyy-MM-dd') : null,
        notes: values.notes || null,
        worker_name: values.worker_name || null,
        is_internal: values.is_internal,
        status: values.status,
        rate: values.rate ? Number(values.rate) : null
      };

      console.log('Submitting stitching job data:', stitchingJobData);

      let result;
      if (selectedJobId) {
        const { data, error } = await supabase
          .from('stitching_jobs')
          .update(stitchingJobData)
          .eq('id', selectedJobId);
          
        if (error) throw error;
        result = data;
        
        toast({
          title: "Job Updated",
          description: "The stitching job has been updated successfully",
        });
      } else {
        const { data, error } = await supabase
          .from('stitching_jobs')
          .insert(stitchingJobData)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
        
        toast({
          title: "Job Created",
          description: "The stitching job has been created successfully",
        });
      }
      
      if (values.status === "completed") {
        await supabase
          .from('job_cards')
          .update({ status: "in_progress" })
          .eq('id', jobCardId);
          
        await supabase
          .from('orders')
          .update({ status: "stitching" as any })
          .eq('id', jobCard.order.order_number);
      }
        
      // Refresh job data
      await fetchJobCard(jobCardId);
      return true;
      
    } catch (error: any) {
      console.error('Error saving stitching job:', error);
      toast({
        title: "Error saving job",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetching,
    jobCard,
    existingJobs,
    selectedJobId,
    setSelectedJobId,
    handleSubmit
  };
};
