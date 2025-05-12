
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Trash } from "lucide-react";
import JobCardListHeader from "@/components/production/job-cards/JobCardListHeader";
import JobCardFilters from "@/components/production/job-cards/JobCardFilters";
import JobCardEmptyState from "@/components/production/job-cards/JobCardEmptyState";
import JobCardTable from "@/components/production/job-cards/JobCardTable";
import JobCardDeleteDialog from "@/components/production/job-cards/JobCardDeleteDialog";
import BulkJobCardDeleteDialog from "@/components/production/job-cards/BulkJobCardDeleteDialog";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import { showToast } from "@/components/ui/enhanced-toast";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

import { useJobCards } from "@/hooks/job-cards/useJobCards";
import { useJobCardStatus } from "@/hooks/job-cards/useJobCardStatus";
import { useJobCardStages } from "@/hooks/job-cards/useJobCardStages";
import { useJobCardDelete } from "@/hooks/job-cards/useJobCardDelete";
import { useBulkJobCardDelete } from "@/hooks/job-cards/useBulkJobCardDelete";

const JobCardList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedJobCards, setSelectedJobCards] = useState<string[]>([]);
  
  const { jobCards, setJobCards, loading } = useJobCards();
  const { getStatusColor, getStatusDisplay } = useJobCardStatus();
  const { canStartStage, handleStageClick, handleViewDetails } = useJobCardStages();
  const { 
    deleteDialogOpen, 
    setDeleteDialogOpen, 
    deleteLoading,
    confirmDeleteJobCard, 
    handleDeleteJobCard 
  } = useJobCardDelete(setJobCards);
  
  const {
    bulkDeleteDialogOpen,
    setBulkDeleteDialogOpen,
    bulkDeleteLoading,
    confirmBulkDeleteJobCards,
    handleBulkDeleteJobCards
  } = useBulkJobCardDelete(setJobCards);

  // Set up keyboard shortcuts
  const shortcuts = {
    'a': () => {
      if (selectedJobCards.length > 0) {
        const allSelected = filteredJobCards.length === selectedJobCards.length;
        handleSelectAllJobCards(!allSelected);
      } else if (filteredJobCards.length > 0) {
        handleSelectAllJobCards(true);
      }
    },
    'escape': () => {
      if (selectedJobCards.length > 0) {
        setSelectedJobCards([]);
      }
    },
    'delete': () => {
      if (selectedJobCards.length === 1) {
        confirmDeleteJobCard(selectedJobCards[0]);
      }
    }
  };
  
  useKeyboardShortcuts(shortcuts);

  const filteredJobCards = jobCards.filter(jobCard => {
    const matchesSearch = (
      jobCard.job_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jobCard.order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jobCard.order.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesStatus = statusFilter === "all" || jobCard.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleStageClickWrapper = (stage: string, id: string) => {
    handleStageClick(stage, id, jobCards);
  };

  const handleSelectJobCard = (id: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedJobCards(prev => [...prev, id]);
    } else {
      setSelectedJobCards(prev => prev.filter(jobCardId => jobCardId !== id));
    }
  };

  const handleSelectAllJobCards = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedJobCards(filteredJobCards.map(card => card.id));
    } else {
      setSelectedJobCards([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedJobCards.length === 0) return;
    confirmBulkDeleteJobCards(selectedJobCards);
  };

  const handleBulkStatusUpdate = (status: string) => {
    if (selectedJobCards.length === 0) return;
    
    // In a real implementation, you'd want to update these in the database
    const updatedJobCards = jobCards.map(card => {
      if (selectedJobCards.includes(card.id)) {
        return { ...card, status: status as any };
      }
      return card;
    });
    
    setJobCards(updatedJobCards);
    showToast({
      title: `Updated ${selectedJobCards.length} job cards to ${status}`,
      type: "success"
    });
    setSelectedJobCards([]);
  };

  return (
    <div className="space-y-6">
      <JobCardListHeader />

      {selectedJobCards.length > 0 && (
        <div className="bg-muted/80 border rounded-md p-2 flex items-center justify-between animate-in slide-in-from-top">
          <div className="text-sm font-medium">
            {selectedJobCards.length} {selectedJobCards.length === 1 ? 'job card' : 'job cards'} selected
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleBulkStatusUpdate('in_progress')}
            >
              <Check className="h-4 w-4 mr-1" />
              Mark In Progress
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleBulkStatusUpdate('completed')}
            >
              <Check className="h-4 w-4 mr-1" />
              Mark Completed
            </Button>
            <Button 
              size="sm" 
              variant="destructive"
              onClick={handleBulkDelete}
            >
              <Trash className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Job Cards</CardTitle>
          <CardDescription>Production job cards for all orders</CardDescription>
        </CardHeader>
        <CardContent>
          <JobCardFilters 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />

          {loading ? (
            <SkeletonTable rows={5} columns={5} />
          ) : (
            <>
              {filteredJobCards.length === 0 ? (
                <JobCardEmptyState searchTerm={searchTerm} statusFilter={statusFilter} />
              ) : (
                <JobCardTable 
                  jobCards={filteredJobCards}
                  handleViewDetails={handleViewDetails}
                  handleStageClick={handleStageClickWrapper}
                  confirmDeleteJobCard={confirmDeleteJobCard}
                  canStartStage={canStartStage}
                  getStatusColor={getStatusColor}
                  getStatusDisplay={getStatusDisplay}
                  selectedJobCards={selectedJobCards}
                  onSelectJobCard={handleSelectJobCard}
                  onSelectAllJobCards={handleSelectAllJobCards}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <JobCardDeleteDialog 
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        deleteLoading={deleteLoading}
        onDelete={handleDeleteJobCard}
      />
      
      <BulkJobCardDeleteDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        deleteLoading={bulkDeleteLoading}
        onDelete={handleBulkDeleteJobCards}
        jobCardCount={selectedJobCards.length}
      />
    </div>
  );
};

export default JobCardList;
