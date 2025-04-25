
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Scissors, Printer, PackageCheck, Truck, Clock, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { StageStatus } from "@/components/production/StageStatus";
import { useState } from "react";

interface TimelineJob {
  id: string;
  status: string;
  worker_name: string | null;
  created_at: string;
}

interface ProductionTimelineCardProps {
  cuttingCount: number;
  printingCount: number;
  stitchingCount: number;
  handleCreateProcess: (process: string) => void;
  navigateDispatch: () => void;
  cuttingJobs?: TimelineJob[];
  printingJobs?: TimelineJob[];
  stitchingJobs?: TimelineJob[];
}

export const ProductionTimelineCard = ({
  cuttingCount,
  printingCount,
  stitchingCount,
  handleCreateProcess,
  navigateDispatch,
  cuttingJobs = [],
  printingJobs = [],
  stitchingJobs = [],
}: ProductionTimelineCardProps) => {
  const [selectedJob, setSelectedJob] = useState<{ type: string, id: string | null }>({
    type: "",
    id: null
  });
  
  const isCuttingCompleted = cuttingJobs.length > 0 && 
    cuttingJobs.every(job => job.status === 'completed');
  
  const isPrintingCompleted = printingJobs.length > 0 && 
    printingJobs.every(job => job.status === 'completed');
  
  const isStitchingCompleted = stitchingJobs.length > 0 && 
    stitchingJobs.every(job => job.status === 'completed');

  const renderJobsList = (jobs: TimelineJob[], type: string) => {
    if (jobs.length === 0) return null;

    return (
      <div className="mt-2 space-y-1">
        {jobs.map((job, index) => (
          <div 
            key={job.id} 
            className={`text-xs flex items-center gap-2 p-1 rounded-sm cursor-pointer ${selectedJob.type === type && selectedJob.id === job.id ? 'bg-muted' : ''}`}
            onClick={() => setSelectedJob({ type, id: job.id })}
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

  const handleProcessClick = (process: string) => {
    // For edit mode, pass the selected job ID if it matches the process type
    const jobId = selectedJob.type === process ? selectedJob.id : null;
    
    switch (process) {
      case 'cutting':
        // Always allow creating new cutting jobs
        handleCreateProcess(process);
        break;
      case 'printing':
        if (!isCuttingCompleted && !printingJobs.length) {
          toast({
            title: "Cannot start printing",
            description: "Please complete at least one cutting job first.",
            variant: "destructive"
          });
          return;
        }
        handleCreateProcess(process);
        break;
      case 'stitching':
        if (!isPrintingCompleted && !stitchingJobs.length) {
          toast({
            title: "Cannot start stitching",
            description: "Please complete at least one printing job first.",
            variant: "destructive"
          });
          return;
        }
        handleCreateProcess(process);
        break;
      case 'dispatch':
        if (!isStitchingCompleted) {
          toast({
            title: "Cannot start dispatch",
            description: "Please complete all production stages first.",
            variant: "destructive"
          });
          return;
        }
        navigateDispatch();
        break;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock size={18} />
          Production Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scissors className={`h-5 w-5 ${isCuttingCompleted ? 'text-green-500' : 'text-muted-foreground'}`} />
                <div>
                  <p className="text-sm font-medium">Cutting</p>
                  <p className="text-xs text-muted-foreground">
                    {cuttingCount ? `${cuttingCount} job(s)` : "No jobs yet"}
                  </p>
                </div>
              </div>
              <Button 
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => {
                  setSelectedJob({ type: "", id: null });  // Clear selection for new job
                  handleProcessClick('cutting');
                }}
              >
                <Plus className="h-3 w-3" /> New Job
              </Button>
            </div>
            {renderJobsList(cuttingJobs, 'cutting')}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className={`h-5 w-5 ${!isCuttingCompleted ? 'text-muted-foreground' : isPrintingCompleted ? 'text-green-500' : 'text-amber-500'}`} />
                <div>
                  <p className="text-sm font-medium">Printing</p>
                  <p className="text-xs text-muted-foreground">
                    {!isCuttingCompleted && !printingJobs.length ? (
                      <span className="flex items-center gap-1 text-amber-500">
                        <AlertTriangle size={12} />
                        Complete cutting first
                      </span>
                    ) : (
                      printingCount ? `${printingCount} job(s)` : "No jobs yet"
                    )}
                  </p>
                </div>
              </div>
              <Button 
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => {
                  setSelectedJob({ type: "", id: null });  // Clear selection for new job
                  handleProcessClick('printing');
                }}
                disabled={!isCuttingCompleted && !printingJobs.length}
              >
                <Plus className="h-3 w-3" /> New Job
              </Button>
            </div>
            {renderJobsList(printingJobs, 'printing')}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PackageCheck className={`h-5 w-5 ${!isPrintingCompleted && !stitchingJobs.length ? 'text-muted-foreground' : isStitchingCompleted ? 'text-green-500' : 'text-amber-500'}`} />
                <div>
                  <p className="text-sm font-medium">Stitching</p>
                  <p className="text-xs text-muted-foreground">
                    {!isPrintingCompleted && !stitchingJobs.length ? (
                      <span className="flex items-center gap-1 text-amber-500">
                        <AlertTriangle size={12} />
                        Complete printing first
                      </span>
                    ) : (
                      stitchingCount ? `${stitchingCount} job(s)` : "No jobs yet"
                    )}
                  </p>
                </div>
              </div>
              <Button 
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => {
                  setSelectedJob({ type: "", id: null });  // Clear selection for new job
                  handleProcessClick('stitching');
                }}
                disabled={!isPrintingCompleted && !stitchingJobs.length}
              >
                <Plus className="h-3 w-3" /> New Job
              </Button>
            </div>
            {renderJobsList(stitchingJobs, 'stitching')}
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className={`h-5 w-5 ${!isStitchingCompleted ? 'text-muted-foreground' : 'text-green-500'}`} />
              <div>
                <p className="text-sm font-medium">Dispatch</p>
                <p className="text-xs text-muted-foreground">
                  {!isStitchingCompleted ? (
                    <span className="flex items-center gap-1 text-amber-500">
                      <AlertTriangle size={12} />
                      Complete all stages first
                    </span>
                  ) : (
                    "Final stage"
                  )}
                </p>
              </div>
            </div>
            <Button 
              size="sm"
              variant="outline"
              onClick={() => handleProcessClick('dispatch')}
              disabled={!isStitchingCompleted}
            >
              View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
