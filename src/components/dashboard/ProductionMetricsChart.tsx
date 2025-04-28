
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts";
import { LoadingSpinner } from "@/components/production/LoadingSpinner";

export const ProductionMetricsChart = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["productionMetrics"],
    queryFn: async () => {
      const { data: jobs } = await supabase
        .from("job_cards")
        .select(`
          created_at,
          status,
          orders (
            quantity
          )
        `);
      
      // Group and aggregate data by month
      const monthlyData = jobs?.reduce((acc: any, job) => {
        const date = new Date(job.created_at);
        const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        
        if (!acc[monthYear]) {
          acc[monthYear] = {
            month: monthYear,
            completed: 0,
            inProgress: 0,
            pending: 0,
            total: 0
          };
        }
        
        acc[monthYear].total += job.orders?.quantity || 0;
        
        if (job.status === 'completed') {
          acc[monthYear].completed += job.orders?.quantity || 0;
        } else if (job.status === 'pending') {
          acc[monthYear].pending += job.orders?.quantity || 0;
        } else {
          acc[monthYear].inProgress += job.orders?.quantity || 0;
        }
        
        return acc;
      }, {});
      
      return Object.values(monthlyData || {});
    }
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Production Metrics</CardTitle>
        <CardDescription>Monthly production volume by status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer
            config={{
              completed: { color: "#22c55e" },
              inProgress: { color: "#eab308" },
              pending: { color: "#94a3b8" }
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="completed" name="Completed" stackId="a" fill="var(--color-completed)" />
                <Bar dataKey="inProgress" name="In Progress" stackId="a" fill="var(--color-inProgress)" />
                <Bar dataKey="pending" name="Pending" stackId="a" fill="var(--color-pending)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};
