
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
  job_number?: string | null;
  roll_width?: number | null;
  consumption_meters?: number | null;
}

export interface CuttingComponent {
  component_id: string;
  type: string;
  width: number | string;
  height: number | string;
  counter: number | string;
  rewinding: number | string;
  rate: number | string;
  status: "pending" | "in_progress" | "completed";
}

export interface Order {
  order_number: string;
  company_name: string;
  quantity: number;
  bag_length: number;
  bag_width: number;
}

export const useCuttingJob = () => {
  const [job, setJob] = useState<CuttingJob>({
    job_card_id: "",
    worker_name: "",
    status: "pending",
    is_internal: false,
  });
  const [components, setComponents] = useState<CuttingComponent[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCuttingJobDetails = useCallback(async (jobId: string) => {
    setLoading(true);
    try {
      const { data: cuttingJob, error } = await supabase
        .from('cutting_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        throw error;
      }

      if (cuttingJob) {
        // Make sure the interface and actual object properties match
        setJob({
          id: cuttingJob.id,
          job_card_id: cuttingJob.job_card_id,
          worker_name: cuttingJob.worker_name || "",
          status: cuttingJob.status || "pending",
          is_internal: cuttingJob.is_internal !== undefined ? cuttingJob.is_internal : false,
          job_number: cuttingJob.job_number || null,
          roll_width: cuttingJob.roll_width || null,
          consumption_meters: cuttingJob.consumption_meters || null,
        });

        // Fetch job card and order details
        const { data: jobCard, error: jobCardError } = await supabase
          .from('job_cards')
          .select(`
            id,
            order:order_id (
              id,
              company_name,
              order_number,
              quantity,
              bag_length,
              bag_width
            )
          `)
          .eq('id', cuttingJob.job_card_id)
          .single();
          
        if (jobCardError) {
          console.error("Error fetching job card:", jobCardError);
        } else if (jobCard?.order) {
          setOrder({
            order_number: jobCard.order.order_number,
            company_name: jobCard.order.company_name,
            quantity: jobCard.order.quantity,
            bag_length: jobCard.order.bag_length,
            bag_width: jobCard.order.bag_width,
          });
        }

        // Fetch components associated with this cutting job
        const { data: componentsData, error: componentsError } = await supabase
          .from('cutting_components')
          .select('*')
          .eq('cutting_job_id', jobId);

        if (componentsError) {
          console.error("Error fetching components:", componentsError);
        } else if (componentsData) {
          // Map the fetched components to the CuttingComponent interface
          const componentsList: CuttingComponent[] = componentsData.map((comp: any) => ({
            component_id: comp.component_id || "",
            type: comp.component_type || "",
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
  }, []);
  
  const fetchInitialComponents = async (jobCardId: string) => {
    setLoading(true);
    try {
      const { data: jobCard, error } = await supabase
        .from('job_cards')
        .select(`
          id, 
          order:order_id (
            id,
            company_name,
            order_number,
            quantity,
            bag_length,
            bag_width,
            components:order_components (
              id,
              component_type,
              size,
              color,
              gsm
            )
          )
        `)
        .eq('id', jobCardId)
        .single();

      if (error) throw error;

      if (jobCard?.order) {
        setOrder({
          order_number: jobCard.order.order_number,
          company_name: jobCard.order.company_name,
          quantity: jobCard.order.quantity,
          bag_length: jobCard.order.bag_length,
          bag_width: jobCard.order.bag_width,
        });

        // Fix for the type error - proper check before treating as array
        if (jobCard.order.components && Array.isArray(jobCard.order.components)) {
          const initialComponentsList = setInitialComponents(jobCard.order.components);
          return initialComponentsList;
        } else {
          console.error("Components is not available or not an array:", jobCard.order.components);
          return [];
        }
      }
      return [];
    } catch (error: any) {
      toast({
        title: "Error fetching initial components",
        description: error.message,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const setInitialComponents = (components: any[]) => {
    try {
      if (!Array.isArray(components)) {
        console.error("Components is not an array:", components);
        return [];
      }
      
      const componentsList: CuttingComponent[] = components.map((comp: any) => ({
        component_id: comp.id || uuidv4(),
        type: comp.component_type || "",
        width: "",
        height: "",
        counter: "",
        rewinding: "",
        rate: "",
        status: "pending" as const
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
        roll_width: job.roll_width,
        consumption_meters: job.consumption_meters
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
        width: typeof component.width === 'string' ? parseFloat(component.width) || null : component.width,
        height: typeof component.height === 'string' ? parseFloat(component.height) || null : component.height,
        counter: typeof component.counter === 'string' ? parseFloat(component.counter) || null : component.counter,
        rewinding: typeof component.rewinding === 'string' ? parseFloat(component.rewinding) || null : component.rewinding,
        rate: typeof component.rate === 'string' ? parseFloat(component.rate) || null : component.rate,
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
      if (componentsToSave.length > 0) {
        const { error: insertComponentsError } = await supabase
          .from('cutting_components')
          .insert(componentsToSave);

        if (insertComponentsError) {
          throw insertComponentsError;
        }
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
    setJob,
    order,
    components,
    loading,
    updateJobField,
    addComponent,
    updateComponentField,
    removeComponent,
    saveCuttingJob,
    fetchCuttingJobDetails,
    fetchInitialComponents
  };
};
