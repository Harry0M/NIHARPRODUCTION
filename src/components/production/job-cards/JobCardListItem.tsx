
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash } from "lucide-react";
import { JobCardData } from "@/types/production";
import { formatDate } from "@/utils/dateUtils";

interface JobCardListItemProps {
  jobCard: JobCardData;
  handleViewDetails: (id: string) => void;
  handleStageClick: (stage: string, id: string) => void;
  confirmDeleteJobCard: (id: string) => void;
  canStartStage: (jobCard: JobCardData, stage: string) => boolean;
  getStatusColor: (status: string) => string;
  getStatusDisplay: (status: string) => string;
  isSelected?: boolean;
  onSelectChange?: (isSelected: boolean) => void;
}

const JobCardListItem = ({
  jobCard,
  handleViewDetails,
  handleStageClick,
  confirmDeleteJobCard,
  canStartStage,
  getStatusColor,
  getStatusDisplay,
  isSelected = false,
  onSelectChange
}: JobCardListItemProps) => {
  return (
    <TableRow key={jobCard.id} className={isSelected ? "bg-muted/50" : ""}>
      {onSelectChange && (
        <TableCell>
          <Checkbox 
            checked={isSelected}
            onCheckedChange={(checked) => onSelectChange(!!checked)}
            aria-label={`Select job card ${jobCard.job_name}`}
          />
        </TableCell>
      )}
      <TableCell className="font-medium">
        <Button 
          variant="link" 
          className="p-0 h-auto font-medium text-left"
          onClick={() => handleViewDetails(jobCard.id)}
        >
          {jobCard.job_name}
        </Button>
      </TableCell>
      <TableCell>{jobCard.order.order_number}</TableCell>
      <TableCell>{jobCard.order.company_name}</TableCell>
      <TableCell>
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(jobCard.status)}`}>
          {getStatusDisplay(jobCard.status)}
        </span>
      </TableCell>
      <TableCell className="text-right">
        {formatDate(jobCard.created_at)}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewDetails(jobCard.id)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleStageClick('cutting', jobCard.id)}
            >
              Cutting
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleStageClick('printing', jobCard.id)}
              className={!canStartStage(jobCard, 'printing') ? 'text-muted-foreground' : ''}
            >
              Printing {!canStartStage(jobCard, 'printing') && '(Complete cutting first)'}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleStageClick('stitching', jobCard.id)}
              className={!canStartStage(jobCard, 'stitching') ? 'text-muted-foreground' : ''}
            >
              Stitching {!canStartStage(jobCard, 'stitching') && '(Complete printing first)'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => confirmDeleteJobCard(jobCard.id)}>
              <Trash className="mr-2 h-4 w-4" /> Delete Job Card
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default JobCardListItem;
