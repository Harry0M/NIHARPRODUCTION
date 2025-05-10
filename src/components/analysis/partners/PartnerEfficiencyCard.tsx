
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PartnerPerformanceData } from "@/types/production";
import { formatEfficiency, formatWaste } from "@/utils/partnerAnalysisUtils";
import { formatCurrency } from "@/utils/analysisUtils";

interface PartnerEfficiencyCardProps {
  partnerData: PartnerPerformanceData;
  onClick?: () => void;
}

export const PartnerEfficiencyCard = ({ partnerData, onClick }: PartnerEfficiencyCardProps) => {
  const { 
    partner_name, 
    job_type, 
    total_jobs, 
    completed_jobs, 
    efficiency_ratio, 
    total_provided_quantity, 
    total_received_quantity,
    average_rate,
    total_cost
  } = partnerData;

  const completionRate = total_jobs > 0 ? (completed_jobs / total_jobs) * 100 : 0;
  const wastePercentage = total_provided_quantity > 0 ? 
    ((total_provided_quantity - total_received_quantity) / total_provided_quantity) * 100 : 0;

  return (
    <Card 
      className={`shadow-sm hover:shadow-md transition-shadow ${efficiency_ratio >= 90 ? 'bg-green-50 dark:bg-green-900/10' : 
        efficiency_ratio >= 75 ? 'bg-yellow-50 dark:bg-yellow-900/10' : 'bg-red-50 dark:bg-red-900/10'}`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="truncate">{partner_name}</span>
          <span className={`text-sm px-2 py-1 rounded-md ${
            efficiency_ratio >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300' : 
            efficiency_ratio >= 75 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-300' : 
            'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300'}`}>
            {formatEfficiency(efficiency_ratio)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Job Type</p>
            <p className="font-medium">{job_type.charAt(0).toUpperCase() + job_type.slice(1)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Jobs</p>
            <p className="font-medium">{completed_jobs}/{total_jobs} ({completionRate.toFixed(0)}%)</p>
          </div>
          <div>
            <p className="text-muted-foreground">Provided</p>
            <p className="font-medium">{total_provided_quantity.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Received</p>
            <p className="font-medium">{total_received_quantity.toFixed(0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Waste</p>
            <p className="font-medium">{formatWaste(wastePercentage)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Avg Rate</p>
            <p className="font-medium">{formatCurrency(average_rate)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
