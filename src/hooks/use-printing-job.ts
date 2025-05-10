
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { JobStatus } from "@/types/production";

interface PrintingData {
  pulling: string;
  gsm: string;
  sheet_length: string;
  sheet_width: string;
  worker_name: string;
  is_internal: boolean;
  rate: string;
  status: JobStatus;
  expected_completion_date: string;
  print_image: string;
  received_quantity?: string; // Added this field
}

export const usePrintingJob = () => {
  const [printingData, setPrintingData] = useState<PrintingData>({
    pulling: "",
    gsm: "",
    sheet_length: "",
    sheet_width: "",
    worker_name: "",
    is_internal: true,
    rate: "",
    status: "pending",
    expected_completion_date: "",
    print_image: "",
    received_quantity: "" // Added this field
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPrintingJob = async (jobCardId: string, jobData: any) => {
    try {
      // Format job name as "job number-worker_name"
      const jobName = `${jobData.worker_name ? jobData.worker_name : 'worker'}-${new Date().getTime().toString().slice(-4)}`;

      const { data, error } = await supabase
        .from('printing_jobs')
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
      console.error('Error in createPrintingJob:', error);
      throw error;
    }
  };

  const updatePrintingJob = async (jobId: string, jobData: any) => {
    setSubmitting(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('printing_jobs')
        .update(jobData)
        .eq('id', jobId)
        .select()
        .single();

      if (error) {
        setError(error.message);
        toast({
          title: "Error updating printing job",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Printing Job Updated",
        description: "The printing job has been updated successfully"
      });

      return data;
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Error updating printing job",
        description: error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    printingData,
    setPrintingData,
    createPrintingJob,
    updatePrintingJob,
    submitting,
    error,
  };
};
