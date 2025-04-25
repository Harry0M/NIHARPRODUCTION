
import { StageStatus } from "@/components/production/StageStatus";
import { TimelineJob } from "@/types/production";

interface JobListProps {
  jobs: TimelineJob[];
  type: string;
  selectedJob: { type: string; id: string | null };
  onJobSelect: (type: string, id: string) => void;
}

export const JobList = ({ jobs, type, selectedJob, onJobSelect }: JobListProps) => {
  if (jobs.length === 0) return null;

  return (
    <div className="mt-2 space-y-1">
      {jobs.map((job, index) => (
        <div 
          key={job.id} 
          className={`text-xs flex items-center gap-2 p-1 rounded-sm cursor-pointer ${
            selectedJob.type === type && selectedJob.id === job.id ? 'bg-muted' : ''
          }`}
          onClick={() => onJobSelect(type, job.id)}
        >
          <StageStatus 
            status={job.status as any}
            date={job.created_at}
            tooltip={`${type} job ${index + 1}${job.worker_name ? ` - ${job.worker_name}` : ''}`}
          />
        </div>
      ))}
    </div>
  );
};
