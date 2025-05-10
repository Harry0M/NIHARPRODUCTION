
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CuttingComponent, JobStatus } from "@/types/production";

interface CuttingData {
  worker_name: string;
  is_internal: boolean;
  status: JobStatus;
  received_quantity: string;
}

export const useCuttingJobForm = (components: any[]) => {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [cuttingData, setCuttingData] = useState<CuttingData>({
    worker_name: "",
    is_internal: true,
    status: "pending",
    received_quantity: ""
  });

  const [componentData, setComponentData] = useState<CuttingComponent[]>([]);

  const handleNewJob = () => {
    setSelectedJobId(null);
    setCuttingData({
      worker_name: "",
      is_internal: true,
      status: "pending",
      received_quantity: ""
    });

    // Initialize componentData with the provided components, auto-filling width and height
    const initialComponentData = components.map(comp => ({
      component_id: comp.id,
      component_type: comp.component_type,
      width: comp.width?.toString() || "",
      height: comp.length?.toString() || "",
      counter: "",
      rewinding: "",
      roll_width: comp.roll_width?.toString() || "",
      consumption: comp.consumption?.toString() || "",
      rate: "",
      status: "pending" as JobStatus,
      notes: ""
    }));
    setComponentData(initialComponentData);
  };

  const handleSelectJob = async (jobId: string, existingJobs: any[]) => {
    const selectedJob = existingJobs.find(job => job.id === jobId);
    if (selectedJob) {
      setSelectedJobId(jobId);
      setCuttingData({
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

        // Ensure we have a componentData entry for each component
        // This preserves width, height, roll_width and consumption values
        const formattedComponents = components.map(comp => {
          // Find if this component has existing data
          const existingComponent = data?.find(c => c.component_id === comp.id);
          
          return {
            component_id: comp.id,
            component_type: comp.component_type,
            width: existingComponent?.width?.toString() || comp.width?.toString() || "",
            height: existingComponent?.height?.toString() || comp.length?.toString() || "",
            counter: existingComponent?.counter || "",
            rewinding: existingComponent?.rewinding || "",
            roll_width: existingComponent?.roll_width?.toString() || comp.roll_width?.toString() || "",
            consumption: existingComponent?.consumption?.toString() || comp.consumption?.toString() || "",
            rate: existingComponent?.rate?.toString() || "",
            status: existingComponent?.status || "pending",
            notes: existingComponent?.notes || ""
          };
        });
        
        setComponentData(formattedComponents);
      } catch (error: any) {
        console.error("Error fetching cutting components:", error);
      }
    }
  };

  return {
    selectedJobId,
    cuttingData,
    componentData,
    setCuttingData,
    setComponentData,
    handleNewJob,
    handleSelectJob
  };
};
