
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { JobData } from "@/types/production";

interface DispatchStageListProps {
  jobs: JobData[];
}

export const DispatchStageList = ({ jobs }: DispatchStageListProps) => {
  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">No orders ready for dispatch</p>
          <Link to="/orders">
            <Badge variant="outline" className="hover:bg-accent cursor-pointer">
              View all orders
            </Badge>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {jobs.map(job => (
        <Link to={`/dispatch/${job.jobCardId}`} key={job.id} className="block">
          <Card className="overflow-hidden hover:border-primary hover:shadow-md transition-all duration-200">
            <CardHeader className="bg-muted/50 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{job.product}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Order: {job.order}</span>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                  Ready for Dispatch
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="py-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm font-medium mb-1">Customer</div>
                  <div className="text-sm">{job.order}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Quantity</div>
                  <div className="text-sm">{job.quantity.toLocaleString()} units</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-background rounded p-2 border">
                  <div className="font-medium mb-1">Quality Check</div>
                  <div className="text-green-600">Pending</div>
                </div>
                <div className="bg-background rounded p-2 border">
                  <div className="font-medium mb-1">Packaging</div>
                  <div className="text-green-600">Ready</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};
