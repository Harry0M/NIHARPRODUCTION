import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useCuttingJobSubmit = () => {
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const createCuttingJob = async (jobCardId: string, cuttingData: any, componentData: any[]) => {
    setSubmitting(true);
    setValidationError(null);

    try {
      // Format job name as "job number-worker_name"
      const jobName = `${cuttingData.worker_name ? cuttingData.worker_name : 'worker'}-${new Date().getTime().toString().slice(-4)}`;

      const { data: cuttingJob, error: cuttingError } = await supabase
        .from('cutting_jobs')
        .insert({
          ...cuttingData,
          job_card_id: jobCardId,
          worker_name: jobName
        })
        .select()
        .single();

      if (cuttingError) throw cuttingError;

      // Insert components
      for (const component of componentData) {
        const { error: componentError } = await supabase
          .from('cutting_components')
          .insert({
            ...component,
            cutting_job_id: cuttingJob.id
          });

        if (componentError) {
          console.error("Error inserting component:", componentError);
          throw componentError; // Re-throw to prevent partial inserts
        }
      }

      return cuttingJob;
    } catch (error: any) {
      console.error('Error in createCuttingJob:', error);
      toast({
        title: "Error creating cutting job",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const updateCuttingJob = async (jobId: string, cuttingData: any, componentData: any[]) => {
    setSubmitting(true);
    setValidationError(null);

    try {
      const { error: updateError } = await supabase
        .from('cutting_jobs')
        .update(cuttingData)
        .eq('id', jobId);

      if (updateError) throw updateError;

      // Update or insert components
      for (const component of componentData) {
        // Check if the component already exists
        const { data: existingComponent, error: selectError } = await supabase
          .from('cutting_components')
          .select('id')
          .eq('cutting_job_id', jobId)
          .eq('component_id', component.component_id)
          .single();

        if (selectError) throw selectError;

        if (existingComponent) {
          // Update existing component
          const { error: updateComponentError } = await supabase
            .from('cutting_components')
            .update(component)
            .eq('cutting_job_id', jobId)
            .eq('component_id', component.component_id);

          if (updateComponentError) {
            console.error("Error updating component:", updateComponentError);
            throw updateComponentError;
          }
        } else {
          // Insert new component
          const { error: insertComponentError } = await supabase
            .from('cutting_components')
            .insert({
              ...component,
              cutting_job_id: jobId
            });

          if (insertComponentError) {
            console.error("Error inserting component:", insertComponentError);
            throw insertComponentError;
          }
        }
      }
    } catch (error: any) {
      console.error('Error in updateCuttingJob:', error);
      toast({
        title: "Error updating cutting job",
        description: error.message,
        variant: "destructive"
      });
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
