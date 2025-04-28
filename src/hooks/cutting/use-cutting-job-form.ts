
import { useState, useEffect } from "react";
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

export const useCuttingJobForm = (components: any[]) => {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [cuttingData, setCuttingData] = useState<CuttingData>({
    roll_width: "",
    consumption_meters: "",
    worker_name: "",
    is_internal: true,
    status: "pending",
    received_quantity: ""
  });

  const [componentData, setComponentData] = useState<CuttingComponent[]>([]);

  // Initialize component data when components change or on reset
  useEffect(() => {
    if (components.length > 0 && !selectedJobId) {
      initializeComponentData();
    }
  }, [components, selectedJobId]);

  const initializeComponentData = () => {
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
    // Reset the form state completely
    setSelectedJobId(null);
    setCuttingData({
      roll_width: "",
      consumption_meters: "",
      worker_name: "",
      is_internal: true,
      status: "pending",
      received_quantity: ""
    });

    // Initialize component data with empty values for a new job
    initializeComponentData();
    
    console.log("Form reset for new cutting job");
  };

  const handleSelectJob = async (jobId: string, existingJobs: any[]) => {
    try {
      setSelectedJobId(jobId);
      
      const selectedJob = existingJobs.find(job => job.id === jobId);
      if (selectedJob) {
        setCuttingData({
          roll_width: selectedJob.roll_width?.toString() || "",
          consumption_meters: selectedJob.consumption_meters?.toString() || "",
          worker_name: selectedJob.worker_name || "",
          is_internal: selectedJob.is_internal !== false, // Default to true if undefined
          status: selectedJob.status || "pending",
          received_quantity: selectedJob.received_quantity?.toString() || ""
        });

        const { data, error } = await supabase
          .from("cutting_components")
          .select("*")
          .eq("cutting_job_id", jobId);

        if (error) throw error;

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
      }
    } catch (error: any) {
      console.error("Error fetching cutting components:", error);
      // Initialize with empty data on error
      initializeComponentData();
    }
  };

  return {
    selectedJobId,
    cuttingData,
    componentData,
    setCuttingData,
    setComponentData,
    handleNewJob,
    handleSelectJob,
    initializeComponentData
  };
};
