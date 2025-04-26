
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PrintingJobData, JobStatus } from "@/types/production";

export const usePrintingJob = () => {
  const [submitting, setSubmitting] = useState(false);

  const createPrintingJob = async (jobCardId: string, printingData: PrintingJobData) => {
    setSubmitting(true);
    try {
      const formattedData = {
        job_card_id: jobCardId,
        pulling: printingData.pulling,
        gsm: printingData.gsm,
        sheet_length: parseFloat(printingData.sheet_length) || null,
        sheet_width: parseFloat(printingData.sheet_width) || null,
        worker_name: printingData.worker_name,
        is_internal: printingData.is_internal,
        rate: parseFloat(printingData.rate) || null,
        status: printingData.status,
        expected_completion_date: printingData.expected_completion_date || null,
        print_image: printingData.print_image
      };

      const { error } = await supabase
        .from("printing_jobs")
        .insert(formattedData);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error creating printing job:", error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const updatePrintingJob = async (jobId: string, printingData: PrintingJobData) => {
    setSubmitting(true);
    try {
      const formattedData = {
        pulling: printingData.pulling,
        gsm: printingData.gsm,
        sheet_length: parseFloat(printingData.sheet_length) || null,
        sheet_width: parseFloat(printingData.sheet_width) || null,
        worker_name: printingData.worker_name,
        is_internal: printingData.is_internal,
        rate: parseFloat(printingData.rate) || null,
        status: printingData.status,
        expected_completion_date: printingData.expected_completion_date || null,
        print_image: printingData.print_image
      };

      const { error } = await supabase
        .from("printing_jobs")
        .update(formattedData)
        .eq("id", jobId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating printing job:", error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitting,
    createPrintingJob,
    updatePrintingJob
  };
};
