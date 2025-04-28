
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

export const useCuttingJob = (jobCardId: string) => {
  const navigate = useNavigate();
  // State for data loading and job card
  const [loading, setLoading] = useState(true);
  const [jobCard, setJobCard] = useState<any>(null);
  const [components, setComponents] = useState<any[]>([]);
  const [existingJobs, setExistingJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  
  // Form state
  const [cuttingData, setCuttingData] = useState<CuttingData>({
    roll_width: "",
    consumption_meters: "",
    worker_name: "",
    is_internal: true,
    status: "pending",
    received_quantity: ""
  });
  
  const [componentData, setComponentData] = useState<CuttingComponent[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch job card and order components data
  useEffect(() => {
    if (!jobCardId) return;
    fetchData();
  }, [jobCardId]);

  // Initialize componentData when components change or when creating a new job
  useEffect(() => {
    if (components.length > 0 && !selectedJobId) {
      initializeComponentData();
    }
  }, [components, selectedJobId]);

  // Set new job mode from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('new') === 'true') {
      setSelectedJobId(null);
      handleNewJob();
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch job card with related order data
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
        .eq("id", jobCardId)
        .single();

      if (jobCardError) throw jobCardError;
      setJobCard(jobCardData);

      // Fetch order components
      const { data: componentsData, error: componentsError } = await supabase
        .from("order_components")
        .select("*")
        .eq("order_id", jobCardData.orders.id);

      if (componentsError) throw componentsError;
      setComponents(componentsData || []);

      // Fetch existing cutting jobs
      const { data: existingJobsData, error: existingJobsError } = await supabase
        .from("cutting_jobs")
        .select("*")
        .eq("job_card_id", jobCardId)
        .order('created_at', { ascending: false });

      if (existingJobsError) throw existingJobsError;
      setExistingJobs(existingJobsData || []);

      // Check URL params for editing an existing job
      const urlParams = new URLSearchParams(window.location.search);
      const editJobId = urlParams.get('edit');
      
      if (editJobId && existingJobsData?.some(job => job.id === editJobId)) {
        handleSelectJob(editJobId);
      }
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

  const initializeComponentData = () => {
    if (components.length === 0) return;
    
    const initialComponentData = components.map(comp => ({
      component_id: comp.id,
      component_type: comp.component_type,
      width: "",
      height: "",
      counter: "",
      rewinding: "",
      rate: "",
      status: "pending" as JobStatus,
      notes: ""
    }));
    
    setComponentData(initialComponentData);
  };

  const handleNewJob = () => {
    // Reset form state for a new job
    setSelectedJobId(null);
    setCuttingData({
      roll_width: "",
      consumption_meters: "",
      worker_name: "",
      is_internal: true,
      status: "pending",
      received_quantity: ""
    });
    
    // Initialize components with empty data
    initializeComponentData();
  };

  const handleSelectJob = async (jobId: string) => {
    try {
      setSelectedJobId(jobId);
      
      // Find selected job from existing jobs
      const selectedJob = existingJobs.find(job => job.id === jobId);
      
      if (selectedJob) {
        // Set cutting job form data
        setCuttingData({
          roll_width: selectedJob.roll_width?.toString() || "",
          consumption_meters: selectedJob.consumption_meters?.toString() || "",
          worker_name: selectedJob.worker_name || "",
          is_internal: selectedJob.is_internal !== false, // Default to true if undefined
          status: selectedJob.status || "pending",
          received_quantity: selectedJob.received_quantity?.toString() || ""
        });

        // Fetch cutting components for this job
        const { data, error } = await supabase
          .from("cutting_components")
          .select("*")
          .eq("cutting_job_id", jobId);

        if (error) throw error;

        // Format component data for the form
        if (data && data.length > 0) {
          const formattedComponents = data.map(comp => {
            const originalComponent = components.find(c => c.id === comp.component_id);
            const componentType = originalComponent ? originalComponent.component_type : "";
            
            return {
              component_id: comp.component_id || "",
              component_type: componentType,
              width: comp.width?.toString() || "",
              height: comp.height?.toString() || "",
              counter: comp.counter?.toString() || "",
              rewinding: comp.rewinding?.toString() || "",
              rate: comp.rate?.toString() || "",
              status: comp.status || "pending",
              notes: comp.notes || ""
            };
          });
          setComponentData(formattedComponents);
        } else {
          // If no components found, initialize with empty data
          initializeComponentData();
        }
        
        // Update URL to reflect we're editing this job
        window.history.replaceState(
          null, 
          '', 
          `/production/cutting/${jobCardId}?edit=${jobId}`
        );
      }
    } catch (error: any) {
      console.error("Error fetching cutting components:", error);
      toast({
        title: "Error",
        description: "Failed to load cutting job details",
        variant: "destructive"
      });
      // Initialize with empty data on error
      initializeComponentData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobCard || !jobCardId) return;

    setValidationError(null);
    setSubmitting(true);
    
    try {
      // Validate required fields
      if (!cuttingData.roll_width) {
        setValidationError("Roll width is required");
        setSubmitting(false);
        return;
      }

      // Prepare data for database insertion
      const formattedCuttingData = {
        job_card_id: jobCardId,
        roll_width: parseFloat(cuttingData.roll_width) || 0,
        consumption_meters: cuttingData.consumption_meters ? parseFloat(cuttingData.consumption_meters) : null,
        worker_name: cuttingData.worker_name,
        is_internal: cuttingData.is_internal,
        status: cuttingData.status,
        received_quantity: cuttingData.received_quantity ? parseInt(cuttingData.received_quantity) : null
      };

      let cuttingJobId: string;

      if (selectedJobId) {
        // Update existing cutting job
        const { error: updateError } = await supabase
          .from("cutting_jobs")
          .update(formattedCuttingData)
          .eq("id", selectedJobId);

        if (updateError) throw updateError;
        cuttingJobId = selectedJobId;

        // Delete existing components to replace with new ones
        const { error: deleteError } = await supabase
          .from("cutting_components")
          .delete()
          .eq("cutting_job_id", selectedJobId);

        if (deleteError) throw deleteError;
      } else {
        // Create new cutting job
        const { data: cuttingJob, error: insertError } = await supabase
          .from("cutting_jobs")
          .insert(formattedCuttingData)
          .select()
          .single();

        if (insertError) throw insertError;
        if (!cuttingJob) throw new Error("Failed to create cutting job");
        
        cuttingJobId = cuttingJob.id;
      }

      // Insert/update components
      if (componentData.length > 0) {
        const formattedComponents = componentData.map(comp => ({
          component_id: comp.component_id,
          cutting_job_id: cuttingJobId,
          width: comp.width ? parseFloat(comp.width) : null,
          height: comp.height ? parseFloat(comp.height) : null,
          counter: comp.counter ? parseFloat(comp.counter) : null,
          rewinding: comp.rewinding ? parseFloat(comp.rewinding) : null,
          rate: comp.rate ? parseFloat(comp.rate) : null,
          status: comp.status,
          notes: comp.notes || null
        }));

        const { error: componentsError } = await supabase
          .from("cutting_components")
          .insert(formattedComponents);

        if (componentsError) throw componentsError;
      }

      toast({
        title: selectedJobId ? "Cutting Job Updated" : "Cutting Job Created",
        description: selectedJobId 
          ? "The cutting job has been updated successfully" 
          : "The cutting job has been created successfully"
      });

      // Navigate back to job card details
      navigate(`/production/job-cards/${jobCardId}`);
    } catch (error: any) {
      console.error("Error saving cutting job:", error);
      toast({
        title: "Error saving cutting job",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoBack = () => {
    navigate(`/production/job-cards/${jobCardId}`);
  };

  return {
    jobCard,
    loading,
    components,
    existingJobs,
    selectedJobId,
    cuttingData,
    componentData,
    submitting,
    validationError,
    setCuttingData,
    setComponentData,
    handleNewJob,
    handleSelectJob,
    handleSubmit,
    handleGoBack
  };
};
