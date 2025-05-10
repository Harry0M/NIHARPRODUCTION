import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type JobStatus = "pending" | "in_progress" | "completed";
interface CuttingJobSlim {
  id: string;
  status: JobStatus;
  worker_name?: string | null;
  received_quantity?: number | null;
  created_at?: string;
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
  handleSelectJob,
  handleNewJob
}: CuttingJobSelectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Cutting Jobs</CardTitle>
            <CardDescription>Select a job to edit or create a new one</CardDescription>
          </div>
          <Button onClick={handleNewJob} size="sm" variant={!selectedJobId ? "default" : "outline"}>
            New Job
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="bg-muted/50 p-3 grid grid-cols-12 font-medium text-sm">
            <div className="col-span-4">Worker & Quantity</div>
            <div className="col-span-4">Status</div>
            <div className="col-span-4">Actions</div>
          </div>
          
          {existingJobs.map((job, index) => (
            <div 
              key={job.id} 
              className={`p-3 border-t grid grid-cols-12 items-center hover:bg-muted/20 transition-colors ${selectedJobId === job.id ? 'bg-primary/5 border-primary' : ''}`}
            >
              <div className="col-span-4">
                <p className="font-medium">
                  {job.worker_name 
                    ? `${job.worker_name} - ${job.received_quantity || 0} pcs` 
                    : `Cutting Job ${index + 1}`}
                </p>
                {job.created_at && (
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(job.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="col-span-4">
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${job.status === 'completed' ? 'bg-green-100 text-green-700' : job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {job.status === 'in_progress' ? 'In Progress' : job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </span>
              </div>
              <div className="col-span-4 flex justify-end">
                <Button
                  onClick={() => handleSelectJob(job.id)}
                  size="sm"
                  variant={selectedJobId === job.id ? "default" : "outline"}
                  className="text-xs"
                >
                  {selectedJobId === job.id ? "Selected" : "Select"}
                </Button>
              </div>
            </div>
          ))}
          
          {existingJobs.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              No cutting jobs found. Create a new job to get started.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Add default export
export default CuttingJobSelection;
