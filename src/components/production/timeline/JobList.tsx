
import { StageStatus } from "@/components/production/StageStatus";
import { TimelineJob } from "@/types/production";
import { format } from "date-fns";

interface JobListProps {
  jobs: TimelineJob[];
  type: string;
  selectedJob: { type: string; id: string | null };
  onJobSelect: (type: string, id: string) => void;
}

export const JobList = ({ jobs, type, selectedJob, onJobSelect }: JobListProps) => {
  if (jobs.length === 0) return null;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    <div className="mt-2 space-y-1">
      {jobs.map((job, index) => (
        <div 
          key={job.id} 
          className={`text-xs flex items-center justify-between gap-2 p-2 rounded-sm cursor-pointer ${
            selectedJob.type === type && selectedJob.id === job.id ? 'bg-muted' : ''
          }`}
          onClick={() => onJobSelect(type, job.id)}
        >
          <div className="flex items-center gap-2">
            <StageStatus 
              status={job.status as any}
              date={job.created_at}
              tooltip={`${type} job ${index + 1}${job.worker_name ? ` - ${job.worker_name}` : ''}`}
            />
            <span className="font-medium">
              {job.worker_name || `Job ${index + 1}`}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDate(job.created_at)}
          </div>
        </div>
      ))}
    </div>
  );
};
