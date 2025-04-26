
import { useState } from "react";
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

  const handleSelectJob = async (jobId: string, existingJobs: any[]) => {
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
        }
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
