
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useCuttingJobData } from "./cutting/use-cutting-job-data";
import { useCuttingJobForm } from "./cutting/use-cutting-job-form";
import { useCuttingJobSubmit } from "./cutting/use-cutting-job-submit";

export const useCuttingJob = (id: string) => {
  const navigate = useNavigate();
  const { jobCard, loading, components, existingJobs } = useCuttingJobData(id);  const {
    selectedJobId,
    cuttingData,
    componentData,
    setCuttingData,
    setComponentData,
    handleNewJob,
    handleSelectJob,
    handleVendorIdChange
  } = useCuttingJobForm(components);
  const {
    submitting,
    validationError,
    setValidationError,
    createCuttingJob,
    updateCuttingJob
  } = useCuttingJobSubmit();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobCard || !id) return;

    setValidationError(null);
    
    try {
      // Validate componentData to ensure all component_id fields are set
      const validComponents = componentData.every(comp => !!comp.component_id);
      if (!validComponents) {
        throw new Error("Some components are missing their IDs. Please try again.");
      }

      if (selectedJobId) {
        console.log("Updating existing job:", selectedJobId);
        console.log("Component data:", componentData);
        
        await updateCuttingJob(selectedJobId, cuttingData, componentData);
        toast({
          title: "Cutting Job Updated",
          description: "The cutting job has been updated successfully"
        });
      } else {
        console.log("Creating new job for card:", id);
        console.log("Component data:", componentData);
        
        await createCuttingJob(id, cuttingData, componentData);
        toast({
          title: "Cutting Job Created",
          description: "The cutting job has been created successfully"
        });
      }

      navigate(`/production/job-cards/${id}`);
    } catch (error: any) {
      console.error("Error in handleSubmit:", error);
      toast({
        title: "Error saving cutting job",
        description: error.message,
        variant: "destructive"
      });
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
    validationError,
    submitting,
    setCuttingData,
    setComponentData,
    handleSelectJob: (jobId: string) => handleSelectJob(jobId, existingJobs),
    handleNewJob,
    handleSubmit,
    handleVendorIdChange
  };
};
