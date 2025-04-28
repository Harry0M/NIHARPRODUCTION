
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type JobStatus = "pending" | "in_progress" | "completed";
interface CuttingJobSlim {
  id: string;
  status: JobStatus;
}
interface CuttingJobSelectionProps {
  existingJobs: CuttingJobSlim[];
  selectedJobId: string | null;
  handleSelectJob: (jobId: string) => void;
  handleNewJob: () => void;
}

export function CuttingJobSelection({
  existingJobs,
  selectedJobId,
  handleSelectJob
}: CuttingJobSelectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Selection</CardTitle>
        <CardDescription>Select an existing job to edit</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {existingJobs.map((job, index) => (
              <Button
                key={job.id}
                variant={selectedJobId === job.id ? "default" : "outline"}
                onClick={() => handleSelectJob(job.id)}
                className="flex items-center"
              >
                Job {index + 1} ({job.status})
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
