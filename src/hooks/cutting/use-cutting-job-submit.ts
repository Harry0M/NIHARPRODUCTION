
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

  const createCuttingJob = async (jobCardId: string, cuttingData: CuttingData, componentData: CuttingComponent[]) => {
    setSubmitting(true);
    setValidationError(null);

    try {
      if (!cuttingData.roll_width) {
        setValidationError("Roll width is required");
        throw new Error("Roll width is required");
      }

      const formattedCuttingData = {
        job_card_id: jobCardId,
        roll_width: parseFloat(cuttingData.roll_width),
        consumption_meters: cuttingData.consumption_meters ? parseFloat(cuttingData.consumption_meters) : null,
        worker_name: cuttingData.worker_name,
        is_internal: cuttingData.is_internal,
        status: cuttingData.status,
        received_quantity: cuttingData.received_quantity ? parseInt(cuttingData.received_quantity) : null
      };

      const { data: cuttingJob, error: cuttingError } = await supabase
        .from("cutting_jobs")
        .insert(formattedCuttingData)
        .select()
        .single();

      if (cuttingError) throw cuttingError;

      if (componentData.length > 0 && cuttingJob) {
        const formattedComponents = componentData.map(comp => ({
          component_id: comp.component_id,
          cutting_job_id: cuttingJob.id,
          width: comp.width ? parseFloat(comp.width) : null,
          height: comp.height ? parseFloat(comp.height) : null,
          counter: comp.counter ? parseFloat(comp.counter) : null,
          rewinding: comp.rewinding ? parseFloat(comp.rewinding) : null,
          rate: comp.rate ? parseFloat(comp.rate) : null,
          status: comp.status,
          notes: comp.notes || null,
          waste_quantity: comp.waste_quantity ? parseFloat(comp.waste_quantity) : null
        }));

        const { error: componentsError } = await supabase
          .from("cutting_components")
          .insert(formattedComponents);

        if (componentsError) throw componentsError;
      }

      return cuttingJob;
    } catch (error: any) {
      console.error("Error creating cutting job:", error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const updateCuttingJob = async (jobId: string, cuttingData: CuttingData, componentData: CuttingComponent[]) => {
    setSubmitting(true);
    setValidationError(null);

    try {
      if (!cuttingData.roll_width) {
        setValidationError("Roll width is required");
        throw new Error("Roll width is required");
      }

      // Convert string values to numbers
      const formattedCuttingData = {
        roll_width: parseFloat(cuttingData.roll_width),
        consumption_meters: cuttingData.consumption_meters ? parseFloat(cuttingData.consumption_meters) : null,
        worker_name: cuttingData.worker_name,
        is_internal: cuttingData.is_internal,
        status: cuttingData.status,
        received_quantity: cuttingData.received_quantity ? parseInt(cuttingData.received_quantity) : null
      };

      // Update cutting job
      const { error: updateError } = await supabase
        .from("cutting_jobs")
        .update(formattedCuttingData)
        .eq("id", jobId);

      if (updateError) throw updateError;

      // First, delete existing components
      const { error: deleteError } = await supabase
        .from("cutting_components")
        .delete()
        .eq("cutting_job_id", jobId);

      if (deleteError) throw deleteError;

      // Insert updated components - make sure all components have valid component_id
      if (componentData.length > 0) {
        const formattedComponents = componentData.map(comp => {
          if (!comp.component_id) {
            console.error("Missing component_id in componentData", comp);
          }

          return {
            component_id: comp.component_id, // Ensure this is always set
            cutting_job_id: jobId,
            width: comp.width ? parseFloat(comp.width) : null,
            height: comp.height ? parseFloat(comp.height) : null,
            counter: comp.counter ? parseFloat(comp.counter) : null,
            rewinding: comp.rewinding ? parseFloat(comp.rewinding) : null,
            rate: comp.rate ? parseFloat(comp.rate) : null,
            status: comp.status,
            notes: comp.notes || null,
            waste_quantity: comp.waste_quantity ? parseFloat(comp.waste_quantity) : null
          };
        });

        console.log("Inserting updated components:", formattedComponents);

        const { error: componentsError } = await supabase
          .from("cutting_components")
          .insert(formattedComponents);

        if (componentsError) {
          console.error("Error inserting components:", componentsError);
          throw componentsError;
        }
      }

      return true;
    } catch (error: any) {
      console.error("Error updating cutting job:", error);
      throw error;
    } finally {
      setSubmitting(false);
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
