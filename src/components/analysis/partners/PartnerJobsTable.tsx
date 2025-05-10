
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PartnerJobData } from "@/types/production";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/analysisUtils";
import { 
  formatEfficiency, 
  formatWaste, 
  calculateCompletionDays, 
  formatPartnerDate 
} from "@/utils/partnerAnalysisUtils";

interface PartnerJobsTableProps {
  jobs: PartnerJobData[];
}

export const PartnerJobsTable = ({ jobs }: PartnerJobsTableProps) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Partner</TableHead>
            <TableHead>Job Info</TableHead>
            <TableHead>Quantities</TableHead>
            <TableHead>Efficiency</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                No job data available
              </TableCell>
            </TableRow>
          ) : (
            jobs.map((job) => {
              const jobType = job.job_type.charAt(0).toUpperCase() + job.job_type.slice(1);
              const completionDays = calculateCompletionDays(job.created_at, job.completed_at);
              
              return (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">
                    {job.partner_name}
                    <div className="text-xs text-muted-foreground mt-1">
                      {jobType}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{job.job_name || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">{job.order_name || 'N/A'}</div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">Provided:</span> {job.provided_quantity}
                    </div>
                    <div>
                      <span className="font-medium">Received:</span> {job.received_quantity}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                        job.waste_percentage <= 5 ? 'bg-green-500' : 
                        job.waste_percentage <= 15 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></span>
                      {formatEfficiency(100 - job.waste_percentage)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Waste: {formatWaste(job.waste_percentage)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(job.rate)}
                  </TableCell>
                  <TableCell>
                    <div>{formatPartnerDate(job.created_at)}</div>
                    {job.completed_at && (
                      <div className="text-xs text-muted-foreground">
                        Completed: {completionDays !== null ? `${completionDays} day${completionDays !== 1 ? 's' : ''}` : 'N/A'}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      job.status === 'completed' ? 'default' : 
                      job.status === 'in_progress' ? 'outline' : 'secondary'
                    }>
                      {job.status === 'in_progress' ? 'In Progress' : 
                       job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
