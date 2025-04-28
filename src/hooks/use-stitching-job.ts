import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useStitchingJob = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createStitchingJob = async (jobCardId: string, jobData: any) => {
    try {
      // Format job name as "job number-worker_name"
      const jobName = `${jobData.worker_name ? jobData.worker_name : 'worker'}-${new Date().getTime().toString().slice(-4)}`;

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

  return {
    loading,
    error,
    createStitchingJob,
    updateStitchingJob,
    deleteStitchingJob
  };
};
