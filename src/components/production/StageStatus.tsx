
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar, Check, Clock } from "lucide-react";
import * as React from "react";

// Define valid status types from the database
type Status = "pending" | "in_progress" | "completed" | "cancelled";

interface StageStatusProps {
  status: Status;
  date?: string;
  tooltip?: string;
}

export const StageStatus: React.FC<StageStatusProps> = ({ status, date, tooltip }) => {
  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return <Check className="h-3.5 w-3.5" />;
      case "in_progress":
        return <Clock className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  const formattedDate = date ? new Date(date).toLocaleDateString() : "";

  const content = (
    <div className="flex items-center space-x-2">
      <Badge variant="outline" className={`${getStatusColor()} capitalize flex items-center gap-1`}>
        {getStatusIcon()}
        {status.replace(/_/g, " ")}
      </Badge>
      
      {date && (
        <div className="flex items-center text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 mr-1" />
          {formattedDate}
        </div>
      )}
    </div>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
};
