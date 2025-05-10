
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { JobData } from "@/types/production";

interface PrintingStageListProps {
  jobs: JobData[];
}

export const PrintingStageList = ({ jobs }: PrintingStageListProps) => {
  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">No active printing jobs found</p>
          <Link to="/production/job-cards/new">
            <Badge variant="outline" className="hover:bg-accent cursor-pointer">
              Create a new job card to start production
            </Badge>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Group jobs by orderId
  const orderGroups = jobs.reduce((groups, job) => {
    const key = job.orderId || 'unknown';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(job);
    return groups;
  }, {} as Record<string, JobData[]>);

  return (
    <div className="space-y-8">
      {Object.entries(orderGroups).map(([orderId, orderJobs]) => {
        const firstJob = orderJobs[0];
        return (
          <div key={orderId} className="space-y-2">
            {/* Order header */}
            <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
              <div>
                <h3 className="font-semibold text-lg">Order: {firstJob.order}</h3>
                <p className="text-sm text-muted-foreground">Jobs: {orderJobs.length}</p>
              </div>
              <Badge variant="outline">
                {firstJob.bagDimensions || 'N/A'} cm
              </Badge>
            </div>
            
            {/* Jobs in this order */}
            <div className="grid gap-4">
              {orderJobs.map(job => (
                <Link to={`/production/printing/${job.jobCardId}`} key={job.id} className="block">
                  <Card className="overflow-hidden hover:border-primary hover:shadow-md transition-all duration-200">
                    <CardHeader className="bg-muted/50 py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{job.product}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Job Card: {job.jobCardId.split('-').pop()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={job.worker.includes("Internal") ? "default" : "secondary"}>
                            {job.worker}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {job.daysLeft} days left
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="py-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                          <div className="text-sm font-medium mb-1">Progress</div>
                          <div className="flex items-center gap-2">
                            <Progress value={job.progress} className="h-2 w-40" />
                            <span className="text-sm">{job.progress}%</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-1">Quantity</div>
                          <div className="text-sm">{job.quantity.toLocaleString()} units</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-background rounded p-2 border">
                          <div className="font-medium mb-1">Design</div>
                          <div className="text-muted-foreground">{job.design || 'Not specified'}</div>
                        </div>
                        <div className="bg-background rounded p-2 border">
                          <div className="font-medium mb-1">Screen Status</div>
                          <div className="text-muted-foreground">{job.screenStatus || 'Not specified'}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
