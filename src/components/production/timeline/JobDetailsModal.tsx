
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StageStatus } from "@/components/production/StageStatus";
import { TimelineJob } from "@/types/production";
import { format } from "date-fns";
import { Download, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { downloadAsPDF } from "@/utils/downloadUtils";

interface JobDetailsModalProps {
  job: TimelineJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JobDetailsModal = ({ job, open, onOpenChange }: JobDetailsModalProps) => {
  const navigate = useNavigate();

  if (!job) return null;

  const formatDate = (date: string) => {
    return format(new Date(date), "PPP");
  };

  const handleDownload = () => {
    const data = [{
      type: job.type,
      status: job.status,
      created_at: formatDate(job.created_at),
      worker: job.worker_name || "N/A",
      is_internal: job.is_internal ? "Yes" : "No",
    }];
    
    downloadAsPDF(data, `${job.type}-job-${job.id}`, `${job.type.charAt(0).toUpperCase() + job.type.slice(1)} Job Details`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="capitalize">{job.type} Job Details</span>
              <StageStatus status={job.status} date={job.created_at} />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                onClick={() => navigate(`/production/${job.type}/${job.id}`)}
                size="sm"
              >
                <Edit className="h-4 w-4" />
                Update
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-1">Created</h4>
              <p className="text-sm text-muted-foreground">
                {formatDate(job.created_at)}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Worker</h4>
              <p className="text-sm text-muted-foreground">
                {job.worker_name || "Not assigned"}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Type</h4>
              <p className="text-sm text-muted-foreground capitalize">
                {job.is_internal ? "Internal" : "External"}
              </p>
            </div>
            {job.job_number && (
              <div>
                <h4 className="font-medium mb-1">Job Number</h4>
                <p className="text-sm text-muted-foreground">
                  {job.job_number}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
