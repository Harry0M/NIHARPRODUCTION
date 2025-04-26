import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type JobStatus = Database['public']['Enums']['job_status'];

export interface CuttingJob {
  id?: string;
  job_card_id: string;
  worker_name: string;
  status: JobStatus;
  is_internal: boolean;
  job_number: string | null;
}

export interface CuttingComponent {
  component_id: string;
  type: string;
  width: string;
  height: string;
  counter: string;
  rewinding: string;
  rate: string;
  status: "pending" | "in_progress" | "completed";
}

export const useCuttingJob = (jobCardId: string | undefined, existingJobId?: string) => {
  const [job, setJob] = useState<CuttingJob>({
    job_card_id: jobCardId || "",
    worker_name: "",
    status: "pending",
    is_internal: false,
    job_number: null,
  });
  const [components, setComponents] = useState<CuttingComponent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (jobCardId) {
      setJob(prev => ({ ...prev, job_card_id: jobCardId }));
    }
  }, [jobCardId]);

  useEffect(() => {
    if (existingJobId) {
      fetchCuttingJob(existingJobId);
    } else if (jobCardId) {
      fetchInitialComponents(jobCardId);
    }
  }, [existingJobId, jobCardId]);

  const fetchCuttingJob = async (cuttingJobId: string) => {
    setLoading(true);
    try {
      const { data: cuttingJob, error } = await supabase
        .from('cutting_jobs')
        .select('*')
        .eq('id', cuttingJobId)
        .single();

      if (error) {
        throw error;
      }

      if (cuttingJob) {
        setJob({
          id: cuttingJob.id,
          job_card_id: cuttingJob.job_card_id,
          worker_name: cuttingJob.worker_name,
          status: cuttingJob.status,
          is_internal: cuttingJob.is_internal,
          job_number: cuttingJob.job_number,
        });

        // Fetch components associated with this cutting job
        const { data: componentsData, error: componentsError } = await supabase
          .from('cutting_components')
          .select('*')
          .eq('cutting_job_id', cuttingJobId);

        if (componentsError) {
          console.error("Error fetching components:", componentsError);
        } else {
          // Map the fetched components to the CuttingComponent interface
          const componentsList: CuttingComponent[] = componentsData.map((comp: any) => ({
            component_id: comp.component_id,
            type: comp.component_type,
            width: comp.width || "",
            height: comp.height || "",
            counter: comp.counter || "",
            rewinding: comp.rewinding || "",
            rate: comp.rate || "",
            status: comp.status || "pending",
          }));
          setComponents(componentsList);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error fetching cutting job",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInitialComponents = async (jobCardId: string) => {
    setLoading(true);
    try {
      const { data: jobCard, error } = await supabase
        .from('job_cards')
        .select(`
          id, 
          order:order_id (
            id,
            components (
              id,
              type
            )
          )
        `)
        .eq('id', jobCardId)
        .single();

      if (error) throw error;

      if (jobCard?.order?.components) {
        setInitialComponents(jobCard.order.components, jobCardId);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching initial components",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setInitialComponents = (components: any[], currentJobId: string) => {
    try {
      const componentsList: CuttingComponent[] = components.map((comp: any) => ({
        component_id: comp.id,
        type: comp.type,
        width: "",
        height: "",
        counter: "",
        rewinding: "",
        rate: "",
        status: "pending" as const // Explicitly type this as a literal
      }));
      
      setComponents(componentsList);
      return componentsList;
    } catch (error) {
      console.error("Error setting initial components:", error);
      return [];
    }
  };

  const updateJobField = (field: string, value: any) => {
    setJob(prev => ({ ...prev, [field]: value }));
  };

  const addComponent = () => {
    const newComponent: CuttingComponent = {
      component_id: uuidv4(),
      type: "",
      width: "",
      height: "",
      counter: "",
      rewinding: "",
      rate: "",
      status: "pending",
    };
    setComponents(prev => [...prev, newComponent]);
  };

  const updateComponentField = (id: string, field: string, value: any) => {
    setComponents(prev =>
      prev.map(component =>
        component.component_id === id ? { ...component, [field]: value } : component
      )
    );
  };

  const removeComponent = (id: string) => {
    setComponents(prev => prev.filter(component => component.component_id !== id));
  };

  const saveCuttingJob = async (): Promise<string | null> => {
    setLoading(true);
    try {
      // Prepare the cutting job data
      const cuttingJobData = {
        job_card_id: job.job_card_id,
        worker_name: job.worker_name,
        status: job.status,
        is_internal: job.is_internal,
        job_number: job.job_number,
      };

      let cuttingJobId: string;

      if (job.id) {
        // Update existing cutting job
        const { error: updateError } = await supabase
          .from('cutting_jobs')
          .update(cuttingJobData)
          .eq('id', job.id);

        if (updateError) {
          throw updateError;
        }
        cuttingJobId = job.id;
      } else {
        // Create new cutting job
        const { data, error: insertError } = await supabase
          .from('cutting_jobs')
          .insert([cuttingJobData])
          .select('id')
          .single();

        if (insertError) {
          throw insertError;
        }

        cuttingJobId = data.id;
      }

      // Prepare components data for saving
      const componentsToSave = components.map(component => ({
        cutting_job_id: cuttingJobId,
        component_id: component.component_id,
        component_type: component.type,
        width: component.width,
        height: component.height,
        counter: component.counter,
        rewinding: component.rewinding,
        rate: component.rate,
        status: component.status,
      }));

      // Save components
      // First, delete existing components for this cutting job
      const { error: deleteComponentsError } = await supabase
        .from('cutting_components')
        .delete()
        .eq('cutting_job_id', cuttingJobId);

      if (deleteComponentsError) {
        throw deleteComponentsError;
      }

      // Then, insert the updated components
      const { error: insertComponentsError } = await supabase
        .from('cutting_components')
        .insert(componentsToSave);

      if (insertComponentsError) {
        throw insertComponentsError;
      }

      toast({
        title: "Cutting job saved successfully",
      });
      return cuttingJobId;
    } catch (error: any) {
      toast({
        title: "Error saving cutting job",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    job,
    components,
    loading,
    updateJobField,
    addComponent,
    updateComponentField,
    removeComponent,
    saveCuttingJob,
  };
};
