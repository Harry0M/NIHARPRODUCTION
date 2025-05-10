
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PartnerPerformanceData } from "@/types/production";
import { formatCurrency } from "@/utils/analysisUtils";
import { formatEfficiency } from "@/utils/partnerAnalysisUtils";

interface PartnerPerformanceSummaryProps {
  partnerData: PartnerPerformanceData[];
}

export const PartnerPerformanceSummary = ({ partnerData }: PartnerPerformanceSummaryProps) => {
  // Calculate aggregated metrics
  const totalJobs = partnerData.reduce((sum, partner) => sum + partner.total_jobs, 0);
  const completedJobs = partnerData.reduce((sum, partner) => sum + partner.completed_jobs, 0);
  const totalProvided = partnerData.reduce((sum, partner) => sum + partner.total_provided_quantity, 0);
  const totalReceived = partnerData.reduce((sum, partner) => sum + partner.total_received_quantity, 0);
  const totalCost = partnerData.reduce((sum, partner) => sum + partner.total_cost, 0);
  
  const overallEfficiency = totalProvided > 0 ? (totalReceived / totalProvided) * 100 : 0;
  const averageRate = totalReceived > 0 ? totalCost / totalReceived : 0;
  const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Jobs Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedJobs}/{totalJobs}</div>
          <p className="text-muted-foreground text-sm">
            {completionRate.toFixed(0)}% completion rate
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Efficiency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatEfficiency(overallEfficiency)}</div>
          <p className="text-muted-foreground text-sm">
            {totalReceived.toFixed(0)} received / {totalProvided.toFixed(0)} provided
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Financial</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
          <p className="text-muted-foreground text-sm">
            Avg. Rate: {formatCurrency(averageRate)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
