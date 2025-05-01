
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Scissors, Printer, PackageCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TimelineJob {
  id: string;
  status: string;
  worker_name: string | null;
  created_at: string;
}
type FormatDateFn = (d: string) => string;
type StatusColorFn = (s: string) => string;

interface ProductionProgressCardProps {
  cuttingJobs: TimelineJob[];
  printingJobs: TimelineJob[];
  stitchingJobs: TimelineJob[];
  getStatusColor: StatusColorFn;
  formatDate: FormatDateFn;
}

export const ProductionProgressCard = ({
  cuttingJobs,
  printingJobs,
  stitchingJobs,
  getStatusColor,
  formatDate,
}: ProductionProgressCardProps) => {
  // Calculate overall status for a stage based on all jobs
  const calculateStageStatus = (jobs: TimelineJob[]): string => {
    if (jobs.length === 0) return 'No jobs created';
    if (jobs.every(job => job.status === 'completed')) return 'completed';
    if (jobs.some(job => job.status === 'in_progress')) return 'in_progress';
    return 'pending';
  };

  const cuttingStatus = calculateStageStatus(cuttingJobs);
  const printingStatus = calculateStageStatus(printingJobs);
  const stitchingStatus = calculateStageStatus(stitchingJobs);

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Production Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cutting Summary */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Scissors className="h-5 w-5" /> 
                Cutting
              </h3>
              {cuttingJobs?.length > 0 && (
                <Badge 
                  variant="outline"
                  className={getStatusColor(cuttingStatus)}
                >
                  {cuttingStatus === 'completed' 
                    ? 'All Completed' 
                    : cuttingStatus === 'in_progress'
                    ? 'In Progress'
                    : 'Pending'}
                </Badge>
              )}
            </div>
            
            {cuttingJobs?.length ? (
              <div className="space-y-2">
                {cuttingJobs.map((job, index) => (
                  <div key={job.id} className="text-sm border-l-2 border-gray-200 pl-3">
                    <p>Job {index + 1}: {job.worker_name || 'Not assigned'}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(job.created_at)}
                      </p>
                      <Badge variant="outline" className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No cutting jobs created yet</p>
            )}
          </div>
          
          {/* Printing Summary */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Printer className="h-5 w-5" /> 
                Printing
              </h3>
              {printingJobs?.length > 0 && (
                <Badge 
                  variant="outline"
                  className={getStatusColor(printingStatus)}
                >
                  {printingStatus === 'completed' 
                    ? 'All Completed' 
                    : printingStatus === 'in_progress'
                    ? 'In Progress'
                    : 'Pending'}
                </Badge>
              )}
            </div>
            
            {printingJobs?.length ? (
              <div className="space-y-2">
                {printingJobs.map((job, index) => (
                  <div key={job.id} className="text-sm border-l-2 border-gray-200 pl-3">
                    <p>Job {index + 1}: {job.worker_name || 'Not assigned'}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(job.created_at)}
                      </p>
                      <Badge variant="outline" className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No printing jobs created yet</p>
            )}
          </div>
          
          {/* Stitching Summary */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <PackageCheck className="h-5 w-5" /> 
                Stitching
              </h3>
              {stitchingJobs?.length > 0 && (
                <Badge 
                  variant="outline"
                  className={getStatusColor(stitchingStatus)}
                >
                  {stitchingStatus === 'completed' 
                    ? 'All Completed' 
                    : stitchingStatus === 'in_progress'
                    ? 'In Progress'
                    : 'Pending'}
                </Badge>
              )}
            </div>
            
            {stitchingJobs?.length ? (
              <div className="space-y-2">
                {stitchingJobs.map((job, index) => (
                  <div key={job.id} className="text-sm border-l-2 border-gray-200 pl-3">
                    <p>Job {index + 1}: {job.worker_name || 'Not assigned'}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(job.created_at)}
                      </p>
                      <Badge variant="outline" className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No stitching jobs created yet</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
