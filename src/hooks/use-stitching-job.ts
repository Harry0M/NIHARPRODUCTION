
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { JobCardData, JobStatus } from "@/types/production";

interface StitchingJobData {
  id: string;
  job_card_id: string;
  worker_name: string;
  is_internal: boolean;
  received_quantity: number | null;
  part_quantity: number | null;
  border_quantity: number | null;
  handle_quantity: number | null;
  chain_quantity: number | null;
  runner_quantity: number | null;
  piping_quantity: number | null;
  start_date: string | null;
  expected_completion_date: string | null;
  notes: string | null;
  status: JobStatus;
  rate: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export const useStitchingJob = (jobCardId?: string) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [jobCard, setJobCard] = useState<JobCardData | null>(null);
  const [existingJobs, setExistingJobs] = useState<StitchingJobData[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const fetchJobCard = async () => {
    if (!jobCardId) return;
    
    try {
      const { data, error } = await supabase
        .from('job_cards')
        .select(`
          id,
          job_name,
          status,
          created_at,
          order:orders (
            id,
            order_number,
            company_name,
            quantity
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
        .eq('id', jobCardId)
        .single();
      
      if (error) throw error;

      // Ensure the data has all the required properties for JobCardData
      const formattedJobCard: JobCardData = {
        id: data.id,
        job_name: data.job_name,
        status: data.status,
        created_at: data.created_at,
        order: data.order,
        cutting_jobs: data.cutting_jobs || [],
        printing_jobs: data.printing_jobs || [],
        stitching_jobs: data.stitching_jobs || []
      };
      
      setJobCard(formattedJobCard);
    } catch (err: any) {
      console.error('Error fetching job card:', err);
      setError(err);
    }
  };

  const fetchStitchingJobs = async () => {
    if (!jobCardId) return;
    
    try {
      const { data, error } = await supabase
        .from('stitching_jobs')
        .select('*')
        .eq('job_card_id', jobCardId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setExistingJobs(data);
    } catch (err: any) {
      console.error('Error fetching stitching jobs:', err);
      setError(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (jobCardId) {
      setFetching(true);
      fetchJobCard();
      fetchStitchingJobs();
    }
  }, [jobCardId]);

  const createStitchingJob = async (jobCardId: string, jobData: any) => {
    try {
      // Format job name as "worker_name-timestamp"
      const timestamp = new Date().getTime().toString().slice(-4);
      const jobName = `${jobData.worker_name ? jobData.worker_name : 'worker'}-${timestamp}`;

      const { data, error } = await supabase
        .from('stitching_jobs')
        .insert({
          ...jobData,
          job_card_id: jobCardId,
          worker_name: jobName
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error('Error in createStitchingJob:', error);
      throw error;
    }
  };

  const updateStitchingJob = async (jobId: string, jobData: any) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('stitching_jobs')
        .update(jobData)
        .eq('id', jobId)
        .select()
        .single();

      if (error) {
        setError(error);
        console.error("Error updating stitching job:", error);
        return null;
      }
      return data;
    } catch (err: any) {
      setError(err);
      console.error("Error updating stitching job:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteStitchingJob = async (jobId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('stitching_jobs')
        .delete()
        .eq('id', jobId);

      if (error) {
        setError(error);
        console.error("Error deleting stitching job:", error);
        return false;
      }
      return true;
    } catch (err: any) {
      setError(err);
      console.error("Error deleting stitching job:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (selectedJobId) {
        await updateStitchingJob(selectedJobId, values);
        toast({
          title: "Success",
          description: "Stitching job has been updated",
        });
      } else {
        await createStitchingJob(jobCardId!, values);
        toast({
          title: "Success",
          description: "New stitching job has been created",
        });
      }
      await fetchStitchingJobs(); // Refresh the job list
      return true;
    } catch (err: any) {
      console.error("Failed to save stitching job:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to save stitching job",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetching,
    jobCard,
    existingJobs,
    selectedJobId,
    setSelectedJobId,
    createStitchingJob,
    updateStitchingJob,
    deleteStitchingJob,
    handleSubmit
  };
};
