
import { ProductionMetricsChart } from "@/components/dashboard/ProductionMetricsChart";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your production metrics and status</p>
      </div>
      
      <div className="grid gap-6">
        <ProductionMetricsChart />
      </div>
    </div>
  );
};

export default Dashboard;
