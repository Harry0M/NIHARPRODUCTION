
import { 
  Table, 
  TableBody, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { JobCardData } from "@/types/production";
import JobCardListItem from "./JobCardListItem";

interface JobCardTableProps {
  jobCards: JobCardData[];
  handleViewDetails: (id: string) => void;
  handleStageClick: (stage: string, id: string) => void;
  confirmDeleteJobCard: (id: string) => void;
  canStartStage: (jobCard: JobCardData, stage: string) => boolean;
  getStatusColor: (status: string) => string;
  getStatusDisplay: (status: string) => string;
  selectedJobCards?: string[];
  onSelectJobCard?: (id: string, isSelected: boolean) => void;
  onSelectAllJobCards?: (isSelected: boolean) => void;
}

const JobCardTable = ({
  jobCards,
  handleViewDetails,
  handleStageClick,
  confirmDeleteJobCard,
  canStartStage,
  getStatusColor,
  getStatusDisplay,
  selectedJobCards = [],
  onSelectJobCard,
  onSelectAllJobCards
}: JobCardTableProps) => {
  const allSelected = jobCards.length > 0 && selectedJobCards.length === jobCards.length;
  const someSelected = selectedJobCards.length > 0 && selectedJobCards.length < jobCards.length;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {onSelectJobCard && (
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={allSelected}
                  onCheckedChange={(checked) => onSelectAllJobCards?.(!!checked)}
                  aria-label="Select all job cards"
                  className={someSelected ? "opacity-50" : ""}
                />
              </TableHead>
            )}
            <TableHead className="w-[180px]">Job Card</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Created</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobCards.map((jobCard) => (
            <JobCardListItem
              key={jobCard.id}
              jobCard={jobCard}
              handleViewDetails={handleViewDetails}
              handleStageClick={handleStageClick}
              confirmDeleteJobCard={confirmDeleteJobCard}
              canStartStage={canStartStage}
              getStatusColor={getStatusColor}
              getStatusDisplay={getStatusDisplay}
              isSelected={selectedJobCards?.includes(jobCard.id)}
              onSelectChange={onSelectJobCard && ((isSelected) => onSelectJobCard(jobCard.id, isSelected))}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default JobCardTable;
