
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Scissors, Printer, PackageCheck, Clock, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { JobStatus, TimelineJob } from "@/types/production";

interface ProductionTimelineCardProps {
  jobCardId?: string;
}

export const ProductionTimelineCard = ({ jobCardId }: ProductionTimelineCardProps) => {
  const navigate = useNavigate();
  const [cuttingJobs] = useState<TimelineJob[]>([]);
  const [printingJobs] = useState<TimelineJob[]>([]);
  const [stitchingJobs] = useState<TimelineJob[]>([]);
  
  const isCuttingStarted = cuttingJobs.length > 0;
  const isPrintingStarted = printingJobs.length > 0;
  const isStitchingStarted = stitchingJobs.length > 0;
  
  // Check if at least one job in each stage is completed to allow progression
  const isCuttingCompleted = cuttingJobs.some(job => job.status === 'completed');
  const isPrintingCompleted = printingJobs.some(job => job.status === 'completed');
  const isStitchingCompleted = stitchingJobs.length > 0 && 
    stitchingJobs.some(job => job.status === 'completed');

  const handleCreateProcess = (process: string) => {
    if (!jobCardId) return;
    
    navigate(`/production/${process}/${jobCardId}`);
  };

  const navigateDispatch = () => {
    if (!jobCardId) return;
    navigate(`/dispatch/${jobCardId}`);
  };

  const handleProcessClick = (process: string) => {    
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
            description: "Please complete at least one stitching job first.",
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
              count={cuttingJobs.length}
              onNewJob={() => handleProcessClick('cutting')}
            />
          </div>

          <div>
            <StageHeader
              icon={<Printer className="h-5 w-5" />}
              title="Printing"
              count={printingJobs.length}
              onNewJob={() => handleProcessClick('printing')}
              disabled={!isCuttingStarted && !isPrintingStarted}
            />
          </div>

          <div>
            <StageHeader
              icon={<PackageCheck className="h-5 w-5" />}
              title="Stitching"
              count={stitchingJobs.length}
              onNewJob={() => handleProcessClick('stitching')}
              disabled={!isPrintingStarted && !isStitchingStarted}
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

interface StageHeaderProps {
  icon: React.ReactNode;
  title: string;
  count: number;
  onNewJob: () => void;
  disabled?: boolean;
}

const StageHeader = ({ icon, title, count, onNewJob, disabled = false }: StageHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-medium">{title}</h3>
        <span className="text-sm text-muted-foreground">({count})</span>
      </div>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={onNewJob}
        disabled={disabled}
      >
        New Job
      </Button>
    </div>
  );
};

interface DispatchStageProps {
  isStitchingCompleted: boolean;
  onDispatchClick: () => void;
}

const DispatchStage = ({ isStitchingCompleted, onDispatchClick }: DispatchStageProps) => {
  return (
    <div className="p-3 border rounded-md bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isStitchingCompleted && <AlertTriangle className="h-4 w-4 text-amber-500" />}
          <h3 className="font-medium">Dispatch</h3>
          <span className="text-sm text-muted-foreground">(Final Stage)</span>
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onDispatchClick}
          disabled={!isStitchingCompleted}
        >
          Prepare Dispatch
        </Button>
      </div>
      {!isStitchingCompleted && (
        <p className="text-xs text-muted-foreground mt-1">
          Complete at least one stitching job to prepare for dispatch
        </p>
      )}
    </div>
  );
};
