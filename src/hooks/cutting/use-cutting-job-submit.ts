
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useCuttingJobSubmit = () => {
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Helper function to sanitize numeric fields
  const sanitizeNumericFields = (data: any) => {
    const result = { ...data };
    
    // List of fields that should be numeric
    const numericFields = ['width', 'height', 'counter', 'rewinding', 'rate', 'waste_quantity'];
    
    // Convert empty strings to null for numeric fields
    numericFields.forEach(field => {
      if (field in result && (result[field] === '' || result[field] === undefined)) {
        result[field] = null;
      }
    });
    
    return result;
  };

  const createCuttingJob = async (jobCardId: string, cuttingData: any, componentData: any[]) => {
    setSubmitting(true);
    setValidationError(null);

    try {
      // Format job name as "job number-worker_name"
      const jobName = `${cuttingData.worker_name ? cuttingData.worker_name : 'worker'}-${new Date().getTime().toString().slice(-4)}`;

      // Sanitize the cutting data numeric fields
      const sanitizedCuttingData = {
        ...cuttingData,
        roll_width: cuttingData.roll_width === '' ? null : cuttingData.roll_width,
        consumption_meters: cuttingData.consumption_meters === '' ? null : cuttingData.consumption_meters,
        received_quantity: cuttingData.received_quantity === '' ? null : cuttingData.received_quantity
      };

      const { data: cuttingJob, error: cuttingError } = await supabase
        .from('cutting_jobs')
        .insert({
          ...sanitizedCuttingData,
          job_card_id: jobCardId,
          worker_name: jobName
        })
        .select()
        .single();

      if (cuttingError) throw cuttingError;

      // Insert components - remove component_type from the data being inserted
      for (const component of componentData) {
        // Create a copy of the component data without the component_type field
        const { component_type, ...componentDataToInsert } = component;
        
        // Sanitize numeric fields before inserting
        const sanitizedComponentData = sanitizeNumericFields(componentDataToInsert);
        
        const { error: componentError } = await supabase
          .from('cutting_components')
          .insert({
            ...sanitizedComponentData,
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
      // Sanitize the cutting data numeric fields
      const sanitizedCuttingData = {
        ...cuttingData,
        roll_width: cuttingData.roll_width === '' ? null : cuttingData.roll_width,
        consumption_meters: cuttingData.consumption_meters === '' ? null : cuttingData.consumption_meters,
        received_quantity: cuttingData.received_quantity === '' ? null : cuttingData.received_quantity
      };

      const { error: updateError } = await supabase
        .from('cutting_jobs')
        .update(sanitizedCuttingData)
        .eq('id', jobId);

      if (updateError) throw updateError;

      // Update or insert components
      for (const component of componentData) {
        // Remove component_type from the data being inserted or updated
        const { component_type, ...componentDataToUse } = component;
        
        // Sanitize numeric fields
        const sanitizedComponentData = sanitizeNumericFields(componentDataToUse);
        
        // Check if the component already exists
        const { data: existingComponent, error: selectError } = await supabase
          .from('cutting_components')
          .select('id')
          .eq('cutting_job_id', jobId)
          .eq('component_id', component.component_id)
          .single();

        if (selectError && selectError.code !== 'PGRST116') throw selectError;

        if (existingComponent) {
          // Update existing component
          const { error: updateComponentError } = await supabase
            .from('cutting_components')
            .update(sanitizedComponentData)
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
              ...sanitizedComponentData,
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
