
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useCuttingJobData } from "./cutting/use-cutting-job-data";
import { useCuttingJobForm } from "./cutting/use-cutting-job-form";
import { useCuttingJobSubmit } from "./cutting/use-cutting-job-submit";

export const useCuttingJob = (id: string) => {
  const navigate = useNavigate();
  const { jobCard, loading, components, existingJobs } = useCuttingJobData(id);
  const {
    selectedJobId,
    cuttingData,
    componentData,
    setCuttingData,
    setComponentData,
    handleNewJob,
    handleSelectJob
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
      if (selectedJobId) {
        await updateCuttingJob(selectedJobId, cuttingData, componentData);
        toast({
          title: "Cutting Job Updated",
          description: "The cutting job has been updated successfully"
        });
      } else {
        // When creating a new job, ensure component data has correct component_id values
        const validatedComponentData = componentData.map((comp, index) => {
          // Make sure each item has a valid component_id
          return {
            ...comp,
            component_id: components[index]?.id || comp.component_id
          };
        });
        
        await createCuttingJob(id, cuttingData, validatedComponentData);
        toast({
          title: "Cutting Job Created",
          description: "The cutting job has been created successfully"
        });
      }

      navigate(`/production/job-cards/${id}`);
    } catch (error: any) {
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
    handleSubmit
  };
};
