
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WastageSummary } from "@/types/wastage";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface WastageChartsProps {
  summary: WastageSummary;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899', '#8b5cf6'];

export function WastageCharts({ summary }: WastageChartsProps) {
  // Prepare data for job type comparison chart
  const jobTypeData = Object.entries(summary.by_type).map(([type, data]) => ({
    name: type === 'printing_jobs' ? 'Printing' : 
          type === 'stitching_jobs' ? 'Stitching' : 
          type === 'cutting_jobs' ? 'Cutting' : type,
    wastagePercentage: parseFloat(data.wastage_percentage.toFixed(2)),
    wastageQuantity: data.wastage_quantity
  }));

  // Prepare data for workers pie chart
  const workerData = summary.worst_workers.map(worker => ({
    name: worker.worker_name || 'Unknown Worker',
    value: parseFloat(worker.wastage_percentage.toFixed(2))
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Wastage by Job Type</CardTitle>
          <CardDescription>
            Comparison of wastage percentages across different job types
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={jobTypeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis 
                yAxisId="left"
                orientation="left"
                label={{ value: 'Wastage %', angle: -90, position: 'insideLeft' }} 
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                label={{ value: 'Quantity', angle: 90, position: 'insideRight' }} 
              />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="wastagePercentage" name="Wastage %" fill="#8884d8" />
              <Bar yAxisId="right" dataKey="wastageQuantity" name="Quantity" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Wastage by Worker</CardTitle>
          <CardDescription>
            Top workers contributing to wastage by percentage
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={workerData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {workerData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, 'Wastage Percentage']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
