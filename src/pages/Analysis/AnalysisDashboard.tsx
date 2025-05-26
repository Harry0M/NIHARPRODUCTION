import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInventoryAnalytics } from "@/hooks/analysis/useInventoryAnalytics";
import { formatCurrency } from "@/utils/analysisUtils";
import { LoadingSpinner } from "@/components/production/LoadingSpinner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { AlertTriangle, TrendingUp, Package, DollarSign, Activity, Target, Zap, ChartBar } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AnalysisDashboard = () => {
  const {
    inventoryData,
    consumptionData,
    wastageData,
    inventoryValueData,
    refillNeedsData,
    isLoading,
    getInventoryValue,
    getLowStockItems,
    getTopConsumedMaterials,
    getTotalWastage,
    getWastageByWorker
  } = useInventoryAnalytics();

  const totalValue = getInventoryValue();
  const lowStockItems = getLowStockItems();
  const topConsumed = getTopConsumedMaterials(5);
  const totalWastage = getTotalWastage();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // Prepare data for consumption chart
  const consumptionChartData = topConsumed.map(item => ({
    name: item.material_name,
    value: item.total_consumption,
    fill: COLORS[topConsumed.indexOf(item) % COLORS.length]
  }));

  // Prepare data for inventory value chart
  const valueChartData = inventoryValueData
    .sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0))
    .slice(0, 5)
    .map(item => ({
      name: item.material_name,
      value: item.totalValue || 0,
      fill: COLORS[inventoryValueData.indexOf(item) % COLORS.length]
    }));

  // Prepare wastage by worker data
  const wastageByWorkerData = getWastageByWorker()
    .sort((a, b) => b.totalWastage - a.totalWastage)
    .slice(0, 5)
    .map(item => ({
      name: item.worker,
      value: item.totalWastage,
      fill: COLORS[getWastageByWorker().indexOf(item) % COLORS.length]
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1.5">
        <h1 className="text-3xl font-bold">Analysis Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive view of inventory, consumption, and production analytics
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Across {inventoryData.length} materials
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Items below minimum level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wastage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWastage}</div>
            <p className="text-xs text-muted-foreground">
              Units across all jobs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Materials</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consumptionData.length}</div>
            <p className="text-xs text-muted-foreground">
              Materials in use
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Material Consumption
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Analyze material usage patterns and trends across orders
            </p>
            <Button asChild className="w-full">
              <Link to="/analysis/material-consumption">
                View Analysis
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Inventory Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track inventory value distribution and cost analysis
            </p>
            <Button asChild className="w-full">
              <Link to="/analysis/inventory-value">
                View Analysis
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Refill Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Monitor stock levels and identify refill needs
            </p>
            <Button asChild className="w-full">
              <Link to="/analysis/refill-analysis">
                View Analysis
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ChartBar className="h-5 w-5 mr-2" />
              Top Consumed Materials
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {consumptionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consumptionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No consumption data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Inventory Value Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {valueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={valueChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {valueChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatCurrency(value as number), 'Value']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No value data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Inventory Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lowStockItems.length > 0 ? (
              lowStockItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{item.material_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Current: {item.quantity} {item.unit} | Minimum: {item.min_stock_level} {item.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                      Low Stock
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>All materials are adequately stocked</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisDashboard;
