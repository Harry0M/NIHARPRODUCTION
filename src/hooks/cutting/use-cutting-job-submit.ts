
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CuttingComponent, JobStatus } from "@/types/production";

interface CuttingData {
  roll_width: string;
  consumption_meters: string;
  worker_name: string;
  is_internal: boolean;
  status: JobStatus;
  received_quantity: string;
}

export const useCuttingJobSubmit = () => {
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateCuttingData = (data: CuttingData) => {
    if (!data.roll_width.trim()) {
      setValidationError("Roll width is required");
      return false;
    }
    return true;
  };

  const createCuttingJob = async (
    jobCardId: string,
    cuttingData: CuttingData,
    componentData: CuttingComponent[]
  ) => {
    if (!validateCuttingData(cuttingData)) {
      throw new Error("Validation failed");
    }

    // Ensure status is one of the allowed JobStatus values
    const status: JobStatus = cuttingData.status;

    const { data: jobData, error: jobError } = await supabase
      .from("cutting_jobs")
      .insert({
        job_card_id: jobCardId,
        roll_width: parseFloat(cuttingData.roll_width),
        consumption_meters: cuttingData.consumption_meters ? parseFloat(cuttingData.consumption_meters) : null,
        worker_name: cuttingData.worker_name || null,
        is_internal: cuttingData.is_internal,
        status: status,
        received_quantity: cuttingData.received_quantity ? parseInt(cuttingData.received_quantity) : null
      })
      .select()
      .single();

    if (jobError) throw jobError;

    const componentsToInsert = componentData
      .filter(comp => comp.width || comp.height || comp.counter || comp.rewinding)
      .map(comp => ({
        cutting_job_id: jobData.id,
        component_id: comp.component_id,
        component_type: comp.component_type,
        width: comp.width ? parseFloat(comp.width) : null,
        height: comp.height ? parseFloat(comp.height) : null,
        counter: comp.counter ? parseFloat(comp.counter) : null,
        rewinding: comp.rewinding ? parseFloat(comp.rewinding) : null,
        rate: comp.rate ? parseFloat(comp.rate) : null,
        status: comp.status,
        notes: comp.notes || null
      }));

    if (componentsToInsert.length > 0) {
      const { error } = await supabase
        .from("cutting_components")
        .insert(componentsToInsert);

      if (error) throw error;
    }

    return jobData;
  };

  const updateCuttingJob = async (
    jobId: string,
    cuttingData: CuttingData,
    componentData: CuttingComponent[]
  ) => {
    if (!validateCuttingData(cuttingData)) {
      throw new Error("Validation failed");
    }

    // Ensure status is one of the allowed JobStatus values
    const status: JobStatus = cuttingData.status;

    const { error: jobError } = await supabase
      .from("cutting_jobs")
      .update({
        roll_width: parseFloat(cuttingData.roll_width),
        consumption_meters: cuttingData.consumption_meters ? parseFloat(cuttingData.consumption_meters) : null,
        worker_name: cuttingData.worker_name || null,
        is_internal: cuttingData.is_internal,
        status: status,
        received_quantity: cuttingData.received_quantity ? parseInt(cuttingData.received_quantity) : null
      })
      .eq("id", jobId);

    if (jobError) throw jobError;

    // Delete existing components
    await supabase
      .from("cutting_components")
      .delete()
      .eq("cutting_job_id", jobId);

    const componentsToInsert = componentData
      .filter(comp => comp.width || comp.height || comp.counter || comp.rewinding)
      .map(comp => ({
        cutting_job_id: jobId,
        component_id: comp.component_id,
        component_type: comp.component_type,
        width: comp.width ? parseFloat(comp.width) : null,
        height: comp.height ? parseFloat(comp.height) : null,
        counter: comp.counter ? parseFloat(comp.counter) : null,
        rewinding: comp.rewinding ? parseFloat(comp.rewinding) : null,
        rate: comp.rate ? parseFloat(comp.rate) : null,
        status: comp.status,
        notes: comp.notes || null
      }));

    if (componentsToInsert.length > 0) {
      const { error } = await supabase
        .from("cutting_components")
        .insert(componentsToInsert);

      if (error) throw error;
    }
  };

  return {
    submitting,
    validationError,
    setValidationError,
    createCuttingJob,
    updateCuttingJob
  };
};
