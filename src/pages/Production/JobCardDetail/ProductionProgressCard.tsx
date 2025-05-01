
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Scissors, Printer, PackageCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { JobStatus } from "@/types/production";

interface JobInfo {
  id: string;
  status: JobStatus;
  worker_name: string | null;
  created_at: string;
}

interface ProductionProgressCardProps {
  jobCard: {
    cutting_jobs: JobInfo[];
    printing_jobs: JobInfo[];
    stitching_jobs: JobInfo[];
  }
}

export const ProductionProgressCard = ({ jobCard }: ProductionProgressCardProps) => {
  // Calculate overall status for a stage based on all jobs
  const calculateStageStatus = (jobs: JobInfo[] | undefined): string => {
    if (!jobs || jobs.length === 0) return 'No jobs created';
    if (jobs.every(job => job.status === 'completed')) return 'completed';
    if (jobs.some(job => job.status === 'in_progress')) return 'in_progress';
    return 'pending';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric'
      }).format(date);
    } catch (e) {
      return 'Invalid date';
    }
  };

  const cuttingStatus = calculateStageStatus(jobCard.cutting_jobs);
  const printingStatus = calculateStageStatus(jobCard.printing_jobs);
  const stitchingStatus = calculateStageStatus(jobCard.stitching_jobs);

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
              {jobCard.cutting_jobs?.length > 0 && (
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
            
            {jobCard.cutting_jobs?.length ? (
              <div className="space-y-2">
                {jobCard.cutting_jobs.map((job, index) => (
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
              {jobCard.printing_jobs?.length > 0 && (
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
            
            {jobCard.printing_jobs?.length ? (
              <div className="space-y-2">
                {jobCard.printing_jobs.map((job, index) => (
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
              {jobCard.stitching_jobs?.length > 0 && (
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
            
            {jobCard.stitching_jobs?.length ? (
              <div className="space-y-2">
                {jobCard.stitching_jobs.map((job, index) => (
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
