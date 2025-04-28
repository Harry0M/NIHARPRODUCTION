
import { JobCardData } from "@/types/production";

export const useJobCardStatus = () => {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusDisplay = (status: string): string => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getJobCardStatus = (jobCard: JobCardData): string => {
    // Check if there are any stitching jobs
    const hasStitchingJobs = jobCard.stitching_jobs && jobCard.stitching_jobs.length > 0;
    const hasPrintingJobs = jobCard.printing_jobs && jobCard.printing_jobs.length > 0;
    
    // Check if all stitching jobs are completed
    const isStitchingCompleted = hasStitchingJobs && 
      jobCard.stitching_jobs.every(job => job.status === 'completed');
    
    // Check if all printing jobs are completed
    const isPrintingCompleted = hasPrintingJobs && 
      jobCard.printing_jobs.every(job => job.status === 'completed');

    if (isStitchingCompleted) {
      return 'completed';
    } else if (isPrintingCompleted) {
      return 'in_progress';
    } else {
      return 'pending';
    }
  };

  return {
    getStatusColor,
    getStatusDisplay,
    getJobCardStatus
  };
};
