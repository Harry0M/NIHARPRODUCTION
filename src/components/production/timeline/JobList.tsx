
import { StageStatus } from "@/components/production/StageStatus";
import { TimelineJob } from "@/types/production";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { JobDetailsModal } from "./JobDetailsModal";

interface JobListProps {
  jobs: TimelineJob[];
  type: string;
  selectedJob: { type: string; id: string | null };
  onJobSelect: (type: string, id: string) => void;
}

export const JobList = ({ jobs, type, selectedJob, onJobSelect }: JobListProps) => {
  const navigate = useNavigate();
  const [selectedJobForModal, setSelectedJobForModal] = useState<TimelineJob | null>(null);

  if (jobs.length === 0) return null;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return "Invalid date";
    }
  };

  const handleJobClick = (job: TimelineJob) => {
    // Select the job in the timeline
    onJobSelect(type, job.id);
    // Open the modal with job details
    setSelectedJobForModal(job);
  };

  return (
    <>
      <div className="mt-2 space-y-1 max-h-60 overflow-y-auto pr-1">
        {jobs.map((job, index) => (
          <div 
            key={job.id} 
            className={`text-xs flex items-center justify-between gap-2 p-2 rounded-sm cursor-pointer hover:bg-muted/50 transition-colors ${
              selectedJob.type === type && selectedJob.id === job.id ? 'bg-muted' : ''
            }`}
            onClick={() => handleJobClick(job)}
          >
            <div className="flex items-center gap-2">
              <StageStatus 
                status={job.status as any}
                date={job.created_at}
                tooltip={`${type} job ${job.job_number || index + 1}${job.worker_name ? ` - ${job.worker_name}` : ''}`}
              />
              <span className="font-medium truncate">
                {job.worker_name || `Job ${job.job_number || index + 1}`}
              </span>
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDate(job.created_at)}
            </div>
          </div>
        ))}
      </div>

      <JobDetailsModal
        job={selectedJobForModal}
        open={!!selectedJobForModal}
        onOpenChange={(open) => {
          if (!open) setSelectedJobForModal(null);
        }}
      />
    </>
  );
};
