import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useBulkJobCardDelete = (setJobCards: React.Dispatch<React.SetStateAction<any[]>>) => {
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [jobCardsToDelete, setJobCardsToDelete] = useState<string[]>([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  const confirmBulkDeleteJobCards = (jobCardIds: string[]) => {
    if (jobCardIds.length === 0) return;
    setJobCardsToDelete(jobCardIds);
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteJobCards = async () => {
    if (jobCardsToDelete.length === 0) return;

    setBulkDeleteLoading(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      console.log(`Starting bulk deletion process for ${jobCardsToDelete.length} job cards`);
      
      // Process each job card one by one
      for (const jobCardId of jobCardsToDelete) {
        try {
          // Delete all related cutting components
          const { data: cuttingJobs } = await supabase
            .from('cutting_jobs')
            .select('id')
            .eq('job_card_id', jobCardId);
          
          if (cuttingJobs && cuttingJobs.length > 0) {
            for (const job of cuttingJobs) {
              await supabase
                .from('cutting_components')
                .delete()
                .eq('cutting_job_id', job.id);
            }
          }
          
          // Delete cutting jobs
          await supabase
            .from('cutting_jobs')
            .delete()
            .eq('job_card_id', jobCardId);
          
          // Delete printing jobs
          await supabase
            .from('printing_jobs')
            .delete()
            .eq('job_card_id', jobCardId);
            
          // Delete stitching jobs
          await supabase
            .from('stitching_jobs')
            .delete()
            .eq('job_card_id', jobCardId);
          
          // Delete the job card itself
          const { error: jobCardDeleteError } = await supabase
            .from('job_cards')
            .delete()
            .eq('id', jobCardId);
            
          if (jobCardDeleteError) {
            throw jobCardDeleteError;
          }
          
          successCount++;
        } catch (error) {
          console.error(`Error deleting job card ${jobCardId}:`, error);
          errorCount++;
        }
      }
      
      // Update the job cards list by removing all deleted job cards
      setJobCards(prevJobCards => prevJobCards.filter(jobCard => !jobCardsToDelete.includes(jobCard.id)));
      
      if (errorCount === 0) {
        toast({
          title: "Job cards deleted successfully",
          description: `${successCount} job cards and all related jobs have been removed.`,
        });
      } else {
        toast({
          title: "Partial success",
          description: `${successCount} job cards deleted, but ${errorCount} failed.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error in bulk job card deletion:", error);
      toast({
        title: "Error deleting job cards",
        description: error.message || "An error occurred while deleting the job cards",
        variant: "destructive",
      });
    } finally {
      setBulkDeleteDialogOpen(false);
      setJobCardsToDelete([]);
      setBulkDeleteLoading(false);
    }
  };

  return {
    bulkDeleteDialogOpen,
    setBulkDeleteDialogOpen,
    jobCardsToDelete,
    bulkDeleteLoading,
    confirmBulkDeleteJobCards,
    handleBulkDeleteJobCards
  };
};
