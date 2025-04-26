
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type JobStatus = Database["public"]["Enums"]["job_status"];

interface JobCard {
  id: string;
  job_name: string;
  order: {
    id: string;
    company_name: string;
    order_number: string;
    quantity: number;
    bag_length: number;
    bag_width: number;
  };
}

interface Component {
  id: string;
  type: string;
  size: string | null;
  color: string | null;
  gsm: string | null;
}

interface CuttingComponent {
  component_id: string;
  type: string;
  width: string;
  height: string;
  counter: string;
  rewinding: string;
  rate: string;
  status: JobStatus;
}

interface CuttingJob {
  id: string;
  job_card_id: string;
  roll_width: string;
  consumption_meters: string;
  worker_name: string;
  is_internal: boolean;
  status: JobStatus;
  received_quantity: string;
}

export const useCuttingJob = (jobCardId: string | undefined) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [existingJobs, setExistingJobs] = useState<CuttingJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [cuttingData, setCuttingData] = useState<{
    roll_width: string;
    consumption_meters: string;
    worker_name: string;
    is_internal: boolean;
    status: JobStatus;
    received_quantity: string;
  }>({
    roll_width: "",
    consumption_meters: "",
    worker_name: "",
    is_internal: true,
    status: "pending",
    received_quantity: ""
  });
  const [componentData, setComponentData] = useState<CuttingComponent[]>([]);

  useEffect(() => {
    if (!jobCardId) return;
    fetchJobData(jobCardId);
  }, [jobCardId]);

  const fetchJobData = async (id: string) => {
    setLoading(true);
    try {
      const { data: jobCardData, error: jobCardError } = await supabase
        .from("job_cards")
        .select(`
          id, 
          job_name,
          orders (
            id,
            company_name,
            order_number,
            quantity,
            bag_length,
            bag_width
          )
        `)
        .eq("id", id)
        .single();
        
      if (jobCardError) throw jobCardError;
      
      const formattedJobCard: JobCard = {
        id: jobCardData.id,
        job_name: jobCardData.job_name,
        order: jobCardData.orders
      };
      
      setJobCard(formattedJobCard);
      
      const { data: componentsData, error: componentsError } = await supabase
        .from("components")
        .select("id, type, size, color, gsm")
        .eq("order_id", jobCardData.orders.id);
        
      if (componentsError) throw componentsError;
      setComponents(componentsData || []);
      
      const initialComponentData: CuttingComponent[] = componentsData.map(comp => ({
        component_id: comp.id,
        type: comp.type,
        width: "",
        height: "",
        counter: "",
        rewinding: "",
        rate: "",
        status: "pending"
      }));
      
      setComponentData(initialComponentData);
      
      const { data: existingJobsData, error: existingJobsError } = await supabase
        .from("cutting_jobs")
        .select("*")
        .eq("job_card_id", id)
        .order('created_at', { ascending: false });
        
      if (existingJobsError) throw existingJobsError;
      
      if (existingJobsData) {
        const formattedJobs = existingJobsData.map(job => ({
          id: job.id,
          job_card_id: job.job_card_id,
          roll_width: job.roll_width?.toString() || "",
          consumption_meters: job.consumption_meters?.toString() || "",
          worker_name: job.worker_name || "",
          is_internal: job.is_internal ?? true,
          status: job.status || "pending",
          received_quantity: job.received_quantity?.toString() || ""
        }));
        
        setExistingJobs(formattedJobs);
      }
      
      // Calculate initial consumption if new job
      if (jobCardData.orders.bag_length && jobCardData.orders.bag_width && jobCardData.orders.quantity) {
        const bagArea = (jobCardData.orders.bag_length * jobCardData.orders.bag_width);
        const consumption = ((bagArea / 6339.39) * jobCardData.orders.quantity).toFixed(2);
        
        setCuttingData(prev => ({
          ...prev,
          consumption_meters: consumption
        }));
      }
      
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive"
      });
      window.location.href = `/production/job-cards/${id}`;
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCuttingData(prev => ({ ...prev, [name]: value }));
    if (name === 'roll_width' && validationError) {
      setValidationError(null);
    }
  };

  const handleSelectChange = (name: string, value: JobStatus) => {
    setCuttingData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setCuttingData(prev => ({ ...prev, is_internal: checked }));
  };

  const handleComponentChange = (index: number, field: string, value: string | JobStatus) => {
    setComponentData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSelectJob = async (jobId: string) => {
    const selectedJob = existingJobs.find(job => job.id === jobId);
    if (selectedJob) {
      setSelectedJobId(jobId);
      
      setCuttingData({
        roll_width: selectedJob.roll_width,
        consumption_meters: selectedJob.consumption_meters,
        worker_name: selectedJob.worker_name,
        is_internal: selectedJob.is_internal,
        status: selectedJob.status,
        received_quantity: selectedJob.received_quantity
      });
      
      try {
        const { data, error } = await supabase
          .from("cutting_components")
          .select("*")
          .eq("cutting_job_id", jobId);
          
        if (error) {
          toast({
            title: "Error fetching components",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
        
        if (data && data.length > 0) {
          const formattedComponents = data.map(comp => ({
            component_id: comp.component_id || "",
            type: components.find(c => c.id === comp.component_id)?.type || "",
            width: comp.width?.toString() || "",
            height: comp.height?.toString() || "",
            counter: comp.counter?.toString() || "",
            rewinding: comp.rewinding?.toString() || "",
            rate: comp.rate?.toString() || "",
            status: comp.status || "pending"
          }));
          
          setComponentData(formattedComponents);
        }
      } catch (error) {
        console.error("Error fetching cutting components:", error);
      }
    }
  };

  const handleNewJob = () => {
    setSelectedJobId(null);
    setCuttingData({
      roll_width: "",
      consumption_meters: "",
      worker_name: "",
      is_internal: true,
      status: "pending",
      received_quantity: ""
    });
    
    const initialComponentData = components.map(comp => ({
      component_id: comp.id,
      type: comp.type,
      width: "",
      height: "",
      counter: "",
      rewinding: "",
      rate: "",
      status: "pending"
    }));
    setComponentData(initialComponentData);

    if (jobCard?.order) {
      const { bag_length, bag_width, quantity } = jobCard.order;
      if (bag_length && bag_width && quantity) {
        const bagArea = (bag_length * bag_width);
        const consumption = ((bagArea / 6339.39) * quantity).toFixed(2);
        setCuttingData(prev => ({
          ...prev,
          consumption_meters: consumption
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobCard || !jobCardId) return;
    
    const rollWidthValue = String(cuttingData.roll_width || "").trim();
    
    if (!rollWidthValue) {
      setValidationError("Roll width is required");
      toast({
        title: "Validation Error",
        description: "Roll width is required",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      let cuttingJobId = selectedJobId;
      
      if (!selectedJobId) {
        const { data, error } = await supabase
          .from("cutting_jobs")
          .insert({
            job_card_id: jobCardId,
            roll_width: parseFloat(rollWidthValue),
            consumption_meters: cuttingData.consumption_meters ? parseFloat(cuttingData.consumption_meters) : null,
            worker_name: cuttingData.worker_name || null,
            is_internal: cuttingData.is_internal,
            status: cuttingData.status,
            received_quantity: cuttingData.received_quantity ? parseInt(cuttingData.received_quantity) : null
          })
          .select()
          .single();
          
        if (error) throw error;
        cuttingJobId = data.id;
        
        if (cuttingData.status !== "pending") {
          await supabase
            .from("job_cards")
            .update({ status: "in_progress" })
            .eq("id", jobCardId);
        }
      } else {
        const { error } = await supabase
          .from("cutting_jobs")
          .update({
            roll_width: parseFloat(rollWidthValue),
            consumption_meters: cuttingData.consumption_meters ? parseFloat(cuttingData.consumption_meters) : null,
            worker_name: cuttingData.worker_name || null,
            is_internal: cuttingData.is_internal,
            status: cuttingData.status,
            received_quantity: cuttingData.received_quantity ? parseInt(cuttingData.received_quantity) : null
          })
          .eq("id", selectedJobId);
          
        if (error) throw error;
        
        if (cuttingData.status === "completed") {
          await supabase
            .from("job_cards")
            .update({ status: "in_progress" })
            .eq("id", jobCardId);
            
          await supabase
            .from("orders")
            .update({ status: "cutting" as any })
            .eq("id", jobCard.order.id);
        }
      }
      
      if (cuttingJobId) {
        if (selectedJobId) {
          await supabase
            .from("cutting_components")
            .delete()
            .eq("cutting_job_id", selectedJobId);
        }
        
        const componentsToInsert = componentData
          .filter(comp => comp.width || comp.height || comp.counter || comp.rewinding)
          .map(comp => ({
            cutting_job_id: cuttingJobId,
            component_id: comp.component_id,
            width: comp.width ? parseFloat(comp.width) : null,
            height: comp.height ? parseFloat(comp.height) : null,
            counter: comp.counter ? parseFloat(comp.counter) : null,
            rewinding: comp.rewinding ? parseFloat(comp.rewinding) : null,
            rate: comp.rate ? parseFloat(comp.rate) : null,
            status: comp.status
          }));
        
        if (componentsToInsert.length > 0) {
          const { error } = await supabase
            .from("cutting_components")
            .insert(componentsToInsert);
            
          if (error) throw error;
        }
      }
      
      toast({
        title: selectedJobId ? "Cutting Job Updated" : "Cutting Job Created",
        description: `The cutting job for ${jobCard.job_name} has been ${selectedJobId ? "updated" : "created"} successfully`
      });
      
      window.location.href = `/production/job-cards/${jobCardId}`;
      
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast({
        title: "Error saving cutting job",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    loading,
    submitting,
    jobCard,
    components,
    existingJobs,
    selectedJobId,
    cuttingData,
    componentData,
    validationError,
    handleInputChange,
    handleSelectChange,
    handleCheckboxChange,
    handleComponentChange,
    handleSelectJob,
    handleNewJob,
    handleSubmit
  };
};

export type {
  JobCard,
  Component,
  CuttingComponent,
  CuttingJob,
  JobStatus
};
