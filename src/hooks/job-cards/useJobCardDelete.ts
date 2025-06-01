
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const useJobCardDelete = (setJobCards: React.Dispatch<React.SetStateAction<any[]>>) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobCardToDelete, setJobCardToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();

  const confirmDeleteJobCard = (jobCardId: string) => {
    setJobCardToDelete(jobCardId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteJobCard = async () => {
    if (!jobCardToDelete) return;

    setDeleteLoading(true);
    try {
      console.log("Attempting to delete job card with ID:", jobCardToDelete);
      
      // Delete job wastage records first (this is what's causing the 409 error)
      try {
        console.log("Deleting job wastage records for job card ID:", jobCardToDelete);
        const { error: wastageDeleteError } = await supabase
          .from('job_wastage')
          .delete()
          .eq('job_card_id', jobCardToDelete);
        
        if (wastageDeleteError) {
          console.error("Error deleting job wastage:", wastageDeleteError);
          // Continue anyway, as some job cards might not have wastage
        }
      } catch (error) {
        console.error("Error processing job wastage deletion:", error);
        // Continue to try other deletions
      }

      // Delete all related cutting components
      try {
        const { data: cuttingJobs } = await supabase
          .from('cutting_jobs')
          .select('id')
          .eq('job_card_id', jobCardToDelete);
        
        if (cuttingJobs && cuttingJobs.length > 0) {
          console.log(`Found ${cuttingJobs.length} cutting jobs to delete components from`);
          for (const job of cuttingJobs) {
            const { error } = await supabase
              .from('cutting_components')
              .delete()
              .eq('cutting_job_id', job.id);
            
            if (error) {
              console.error(`Error deleting cutting components for job ${job.id}:`, error);
            }
          }
        }
      } catch (error) {
        console.error("Error processing cutting components:", error);
      }
      
      // Delete cutting jobs
      try {
        const { error } = await supabase
          .from('cutting_jobs')
          .delete()
          .eq('job_card_id', jobCardToDelete);
        
        if (error) {
          console.error("Error deleting cutting jobs:", error);
        }
      } catch (error) {
        console.error("Error in cutting jobs deletion:", error);
      }
      
      // Delete printing jobs
      try {
        const { error } = await supabase
          .from('printing_jobs')
          .delete()
          .eq('job_card_id', jobCardToDelete);
          
        if (error) {
          console.error("Error deleting printing jobs:", error);
        }
      } catch (error) {
        console.error("Error in printing jobs deletion:", error);
      }
        
      // Delete stitching jobs
      try {
        const { error } = await supabase
          .from('stitching_jobs')
          .delete()
          .eq('job_card_id', jobCardToDelete);
          
        if (error) {
          console.error("Error deleting stitching jobs:", error);
        }
      } catch (error) {
        console.error("Error in stitching jobs deletion:", error);
      }
      
      // Delete the job card itself
      try {
        const { error: jobCardDeleteError } = await supabase
          .from('job_cards')
          .delete()
          .eq('id', jobCardToDelete);
          
        if (jobCardDeleteError) {
          console.error("Error deleting job card:", jobCardDeleteError);
          throw jobCardDeleteError;
        }
      } catch (error) {
        console.error("Error in job card deletion:", error);
        throw error;
      }
      
      // Update the job cards list by removing the deleted job card
      setJobCards(prevJobCards => prevJobCards.filter(jobCard => jobCard.id !== jobCardToDelete));
      
      toast({
        title: "Job card deleted successfully",
        description: "The job card and all related jobs have been removed.",
      });

      // Navigate to the job cards page to refresh
      navigate('/production/job-cards');
    } catch (error: any) {
      console.error("Error deleting job card:", error);
      toast({
        title: "Error deleting job card",
        description: error.message || "An error occurred while deleting the job card",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setJobCardToDelete(null);
      setDeleteLoading(false);
    }
  };

  return {
    deleteDialogOpen,
    setDeleteDialogOpen,
    jobCardToDelete,
    deleteLoading,
    confirmDeleteJobCard,
    handleDeleteJobCard
  };
};
