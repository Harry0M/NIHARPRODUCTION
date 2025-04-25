
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Scissors, Printer, PackageCheck, Truck, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { StageStatus } from "@/components/production/StageStatus";

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
          <div key={job.id} className="text-xs text-muted-foreground flex items-center gap-2">
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
    switch (process) {
      case 'cutting':
        handleCreateProcess(process);
        break;
      case 'printing':
        if (!isCuttingCompleted) {
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
        if (!isPrintingCompleted) {
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
                onClick={() => handleProcessClick('cutting')}
              >
                Add Job
              </Button>
            </div>
            {renderJobsList(cuttingJobs, 'Cutting')}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className={`h-5 w-5 ${!isCuttingCompleted ? 'text-muted-foreground' : isPrintingCompleted ? 'text-green-500' : 'text-amber-500'}`} />
                <div>
                  <p className="text-sm font-medium">Printing</p>
                  <p className="text-xs text-muted-foreground">
                    {!isCuttingCompleted ? (
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
                onClick={() => handleProcessClick('printing')}
                disabled={!isCuttingCompleted}
              >
                Add Job
              </Button>
            </div>
            {renderJobsList(printingJobs, 'Printing')}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PackageCheck className={`h-5 w-5 ${!isPrintingCompleted ? 'text-muted-foreground' : isStitchingCompleted ? 'text-green-500' : 'text-amber-500'}`} />
                <div>
                  <p className="text-sm font-medium">Stitching</p>
                  <p className="text-xs text-muted-foreground">
                    {!isPrintingCompleted ? (
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
                onClick={() => handleProcessClick('stitching')}
                disabled={!isPrintingCompleted}
              >
                Add Job
              </Button>
            </div>
            {renderJobsList(stitchingJobs, 'Stitching')}
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
