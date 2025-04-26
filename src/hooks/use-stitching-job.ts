
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
      
      setJobCard(jobCardData as unknown as JobCard);
      
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
      return;
    }
    
    setLoading(true);
    
    try {
      const stitchingJobData = {
        job_card_id: jobCardId,
        ...values,
        start_date: values.start_date ? format(values.start_date, 'yyyy-MM-dd') : null,
        expected_completion_date: values.expected_completion_date ? format(values.expected_completion_date, 'yyyy-MM-dd') : null,
      };

      if (selectedJobId) {
        await supabase
          .from('stitching_jobs')
          .update(stitchingJobData)
          .eq('id', selectedJobId);
          
        toast({
          title: "Job Updated",
          description: "The stitching job has been updated successfully",
        });
      } else {
        await supabase
          .from('stitching_jobs')
          .insert(stitchingJobData);
          
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
        
      return true;
      
    } catch (error: any) {
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
