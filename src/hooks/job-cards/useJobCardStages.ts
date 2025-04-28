
import { JobCardData } from "@/types/production";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export const useJobCardStages = () => {
  const navigate = useNavigate();

  const canStartStage = (jobCard: JobCardData, stage: string): boolean => {
    const hasCuttingJobs = jobCard.cutting_jobs && jobCard.cutting_jobs.length > 0;
    const hasPrintingJobs = jobCard.printing_jobs && jobCard.printing_jobs.length > 0;
    const hasStitchingJobs = jobCard.stitching_jobs && jobCard.stitching_jobs.length > 0;

    // Check if at least one cutting job is completed instead of requiring all to be completed
    const isCuttingStarted = hasCuttingJobs;
    const isPrintingStarted = hasPrintingJobs;
    const isStitchingStarted = hasStitchingJobs;
    
    // Check if at least one job is completed for each stage
    const isCuttingCompleted = hasCuttingJobs && 
      jobCard.cutting_jobs.some(job => job.status === 'completed');
    const isPrintingCompleted = hasPrintingJobs && 
      jobCard.printing_jobs.some(job => job.status === 'completed');
    const isStitchingCompleted = hasStitchingJobs && 
      jobCard.stitching_jobs.every(job => job.status === 'completed');

    switch (stage) {
      case 'cutting':
        return true; // Cutting can always be started
      case 'printing':
        return isCuttingStarted || isPrintingStarted; // Either cutting is started or printing already exists
      case 'stitching':
        return isPrintingStarted || isStitchingStarted; // Either printing is started or stitching already exists
      case 'dispatch':
        return isStitchingCompleted; // All stitching jobs must be complete
      default:
        return false;
    }
  };

  const handleStageClick = (stage: string, jobId: string, jobCards: JobCardData[]) => {
    const jobCard = jobCards.find(card => card.id === jobId);
    if (!jobCard) return;

    if (!canStartStage(jobCard, stage)) {
      const requiredStage = stage === 'printing' ? 'cutting' : 
                          stage === 'stitching' ? 'printing' : 
                          'stitching';
      
      toast({
        title: "Cannot start " + stage,
        description: `Please complete the ${requiredStage} stage first.`,
        variant: "destructive"
      });
      return;
    }

    switch (stage) {
      case 'cutting':
        navigate(`/production/cutting/${jobId}`);
        break;
      case 'printing':
        navigate(`/production/printing/${jobId}`);
        break;
      case 'stitching':
        navigate(`/production/stitching/${jobId}`);
        break;
      default:
        break;
    }
  };

  const handleViewDetails = (jobId: string) => {
    navigate(`/production/job-cards/${jobId}`);
  };

  return {
    canStartStage,
    handleStageClick,
    handleViewDetails
  };
};
