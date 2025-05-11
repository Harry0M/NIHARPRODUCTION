
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WastageSummary } from "@/types/wastage";
import { AlertTriangle, BarChart3, PackageCheck, Percent } from "lucide-react";

interface WastageSummaryCardsProps {
  summary: WastageSummary;
}

export function WastageSummaryCards({ summary }: WastageSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Total Wastage</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {summary.total_wastage_percentage.toFixed(2)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.total_wastage_quantity} units across {summary.total_jobs} jobs
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Printing Wastage</CardTitle>
          <PackageCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {summary.by_type['printing_jobs']
              ? summary.by_type['printing_jobs'].wastage_percentage.toFixed(2)
              : '0.00'}%
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.by_type['printing_jobs']
              ? summary.by_type['printing_jobs'].wastage_quantity + ' units / ' + summary.by_type['printing_jobs'].jobs_count + ' jobs'
              : 'No data available'}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Stitching Wastage</CardTitle>
          <PackageCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {summary.by_type['stitching_jobs']
              ? summary.by_type['stitching_jobs'].wastage_percentage.toFixed(2)
              : '0.00'}%
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.by_type['stitching_jobs']
              ? summary.by_type['stitching_jobs'].wastage_quantity + ' units / ' + summary.by_type['stitching_jobs'].jobs_count + ' jobs'
              : 'No data available'}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Worst Performer</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {summary.worst_workers.length > 0
              ? summary.worst_workers[0].wastage_percentage.toFixed(2) + '%'
              : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.worst_workers.length > 0
              ? (summary.worst_workers[0].worker_name || 'Unknown Worker')
              : 'No data available'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
