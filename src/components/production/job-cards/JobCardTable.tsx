
import { 
  Table, 
  TableBody, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
}

const JobCardTable = ({
  jobCards,
  handleViewDetails,
  handleStageClick,
  confirmDeleteJobCard,
  canStartStage,
  getStatusColor,
  getStatusDisplay,
}: JobCardTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
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
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default JobCardTable;
