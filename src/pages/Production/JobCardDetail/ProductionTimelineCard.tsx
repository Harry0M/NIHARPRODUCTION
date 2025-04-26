
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Scissors, Printer, PackageCheck, Clock, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { StageHeader } from "@/components/production/timeline/StageHeader";
import { JobList } from "@/components/production/timeline/JobList";
import { DispatchStage } from "@/components/production/timeline/DispatchStage";
import { TimelineJob } from "@/types/production";

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
  
  const isCuttingStarted = cuttingJobs.length > 0;
  const isPrintingStarted = printingJobs.length > 0;
  const isStitchingStarted = stitchingJobs.length > 0;
  
  // Check if at least one cutting job is completed instead of requiring all to be completed
  const isCuttingCompleted = cuttingJobs.some(job => job.status === 'completed');
  const isPrintingCompleted = printingJobs.some(job => job.status === 'completed');
  const isStitchingCompleted = stitchingJobs.length > 0 && 
    stitchingJobs.every(job => job.status === 'completed');

  const handleProcessClick = (process: string) => {
    const jobId = selectedJob.type === process ? selectedJob.id : null;
    
    switch (process) {
      case 'cutting':
        handleCreateProcess(process);
        break;
      case 'printing':
        if (!isCuttingStarted && !isPrintingStarted) {
          toast({
            title: "Cannot start printing",
            description: "Please create at least one cutting job first.",
            variant: "destructive"
          });
          return;
        }
        handleCreateProcess(process);
        break;
      case 'stitching':
        if (!isPrintingStarted && !isStitchingStarted) {
          toast({
            title: "Cannot start stitching",
            description: "Please create at least one printing job first.",
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
            description: "Please complete all stitching jobs first.",
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
            <StageHeader
              icon={<Scissors className="h-5 w-5" />}
              title="Cutting"
              count={cuttingCount}
              onNewJob={() => {
                setSelectedJob({ type: "", id: null });
                handleProcessClick('cutting');
              }}
            />
            <JobList
              jobs={cuttingJobs}
              type="cutting"
              selectedJob={selectedJob}
              onJobSelect={(type, id) => setSelectedJob({ type, id })}
            />
          </div>

          <div>
            <StageHeader
              icon={<Printer className="h-5 w-5" />}
              title="Printing"
              count={printingCount}
              onNewJob={() => {
                setSelectedJob({ type: "", id: null });
                handleProcessClick('printing');
              }}
              disabled={!isCuttingStarted && !isPrintingStarted}
            />
            <JobList
              jobs={printingJobs}
              type="printing"
              selectedJob={selectedJob}
              onJobSelect={(type, id) => setSelectedJob({ type, id })}
            />
          </div>

          <div>
            <StageHeader
              icon={<PackageCheck className="h-5 w-5" />}
              title="Stitching"
              count={stitchingCount}
              onNewJob={() => {
                setSelectedJob({ type: "", id: null });
                handleProcessClick('stitching');
              }}
              disabled={!isPrintingStarted && !isStitchingStarted}
            />
            <JobList
              jobs={stitchingJobs}
              type="stitching"
              selectedJob={selectedJob}
              onJobSelect={(type, id) => setSelectedJob({ type, id })}
            />
          </div>

          <Separator />

          <DispatchStage
            isStitchingCompleted={isStitchingCompleted}
            onDispatchClick={() => handleProcessClick('dispatch')}
          />
        </div>
      </CardContent>
    </Card>
  );
};
