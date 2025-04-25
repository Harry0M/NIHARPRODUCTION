
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface StitchingJobData {
  id: string;
  created_at?: string;
  status: string;
}

interface JobSelectionProps {
  existingJobs: StitchingJobData[];
  selectedJobId: string | null;
  onSelectJob: (jobId: string) => void;
  onCreateNewJob: () => void;
}

export const JobSelection = ({
  existingJobs,
  selectedJobId,
  onSelectJob,
  onCreateNewJob
}: JobSelectionProps) => {
  if (!existingJobs.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Job Selection</CardTitle>
        <CardDescription>Select an existing job or create a new one</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {existingJobs.map((job) => (
            <Button
              key={job.id}
              variant={selectedJobId === job.id ? "default" : "outline"}
              size="sm"
              onClick={() => onSelectJob(job.id)}
              className="flex items-center gap-1"
            >
              Job {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'N/A'}
              <span className={`ml-1 w-2 h-2 rounded-full ${
                job.status === 'completed' ? 'bg-green-500' :
                job.status === 'in_progress' ? 'bg-amber-500' : 'bg-gray-500'
              }`}></span>
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateNewJob}
            className="flex items-center gap-1"
          >
            <Plus size={14} /> New Job
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
