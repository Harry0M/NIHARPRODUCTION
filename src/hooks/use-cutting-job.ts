
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { JobStatus } from "@/types/production";

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

interface UseCuttingJobReturn {
  jobCard: JobCard | null;
  loading: boolean;
  components: any[];
  existingJobs: CuttingJob[];
  selectedJobId: string | null;
  cuttingData: {
    roll_width: string;
    consumption_meters: string;
    worker_name: string;
    is_internal: boolean;
    status: JobStatus;
    received_quantity: string;
  };
  componentData: CuttingComponent[];
  setCuttingData: (data: any) => void;
  setComponentData: (data: any) => void;
  setSelectedJobId: (id: string | null) => void;
  handleSelectJob: (jobId: string) => Promise<void>;
  handleNewJob: () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export const useCuttingJob = (id: string): UseCuttingJobReturn => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [components, setComponents] = useState<any[]>([]);
  const [existingJobs, setExistingJobs] = useState<CuttingJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [cuttingData, setCuttingData] = useState({
    roll_width: "",
    consumption_meters: "",
    worker_name: "",
    is_internal: true,
    status: "pending" as JobStatus,
    received_quantity: ""
  });

  const [componentData, setComponentData] = useState<CuttingComponent[]>([]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
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

      setJobCard(jobCardData);

      // Fetch components
      const { data: componentsData, error: componentsError } = await supabase
        .from("order_components")
        .select("*")
        .eq("order_id", jobCardData.orders.id);

      if (componentsError) throw componentsError;
      setComponents(componentsData || []);

      // Initialize component data
      const initialComponentData = componentsData?.map(comp => ({
        component_id: comp.id,
        type: comp.component_type,
        width: "",
        height: "",
        counter: "",
        rewinding: "",
        rate: "",
        status: "pending" as JobStatus
      })) || [];

      setComponentData(initialComponentData);

      // Fetch existing jobs
      const { data: existingJobsData, error: existingJobsError } = await supabase
        .from("cutting_jobs")
        .select("*")
        .eq("job_card_id", id)
        .order('created_at', { ascending: false });

      if (existingJobsError) throw existingJobsError;
      setExistingJobs(existingJobsData || []);

    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectJob = async (jobId: string) => {
    const selectedJob = existingJobs.find(job => job.id === jobId);
    if (selectedJob) {
      setSelectedJobId(jobId);
      setCuttingData({
        roll_width: selectedJob.roll_width,
        consumption_meters: selectedJob.consumption_meters,
        worker_name: selectedJob.worker_name || "",
        is_internal: selectedJob.is_internal,
        status: selectedJob.status,
        received_quantity: selectedJob.received_quantity?.toString() || ""
      });

      try {
        const { data, error } = await supabase
          .from("cutting_components")
          .select("*")
          .eq("cutting_job_id", jobId);

        if (error) throw error;

        if (data && data.length > 0) {
          const formattedComponents = data.map(comp => ({
            component_id: comp.component_id || "",
            type: components.find(c => c.id === comp.component_id)?.component_type || "",
            width: comp.width?.toString() || "",
            height: comp.height?.toString() || "",
            counter: comp.counter?.toString() || "",
            rewinding: comp.rewinding?.toString() || "",
            rate: comp.rate?.toString() || "",
            status: comp.status || "pending"
          }));
          setComponentData(formattedComponents);
        }
      } catch (error: any) {
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
      type: comp.component_type,
      width: "",
      height: "",
      counter: "",
      rewinding: "",
      rate: "",
      status: "pending" as JobStatus
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
    if (!jobCard || !id) return;

    if (!cuttingData.roll_width.trim()) {
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
            job_card_id: id,
            roll_width: parseFloat(cuttingData.roll_width),
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

      } else {
        const { error } = await supabase
          .from("cutting_jobs")
          .update({
            roll_width: parseFloat(cuttingData.roll_width),
            consumption_meters: cuttingData.consumption_meters ? parseFloat(cuttingData.consumption_meters) : null,
            worker_name: cuttingData.worker_name || null,
            is_internal: cuttingData.is_internal,
            status: cuttingData.status,
            received_quantity: cuttingData.received_quantity ? parseInt(cuttingData.received_quantity) : null
          })
          .eq("id", selectedJobId);

        if (error) throw error;
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
          .filter(comp => comp.component_id)
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
          console.log("Inserting components:", componentsToInsert);
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

      window.location.href = `/production/job-cards/${id}`;

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
    jobCard,
    loading,
    components,
    existingJobs,
    selectedJobId,
    cuttingData,
    componentData,
    setCuttingData,
    setComponentData,
    setSelectedJobId,
    handleSelectJob,
    handleNewJob,
    handleSubmit
  };
};
