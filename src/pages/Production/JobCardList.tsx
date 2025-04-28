
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import JobCardListHeader from "@/components/production/job-cards/JobCardListHeader";
import JobCardFilters from "@/components/production/job-cards/JobCardFilters";
import JobCardEmptyState from "@/components/production/job-cards/JobCardEmptyState";
import JobCardTable from "@/components/production/job-cards/JobCardTable";
import JobCardDeleteDialog from "@/components/production/job-cards/JobCardDeleteDialog";

import { useJobCards } from "@/hooks/job-cards/useJobCards";
import { useJobCardStatus } from "@/hooks/job-cards/useJobCardStatus";
import { useJobCardStages } from "@/hooks/job-cards/useJobCardStages";
import { useJobCardDelete } from "@/hooks/job-cards/useJobCardDelete";

const JobCardList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
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

  return (
    <div className="space-y-6">
      <JobCardListHeader />

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
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
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
    </div>
  );
};

export default JobCardList;
