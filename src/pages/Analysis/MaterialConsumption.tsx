
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Search, Download, Filter, TrendingUp, Package, Calendar } from "lucide-react";
import { useInventoryAnalytics } from "@/hooks/analysis/useInventoryAnalytics";
import { LoadingSpinner } from "@/components/production/LoadingSpinner";
import { formatCurrency } from "@/utils/analysisUtils";

export const MaterialConsumption = () => {
  const {
    consumptionData,
    orderConsumptionData,
    filters,
    updateFilters,
    isLoading
  } = useInventoryAnalytics();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("total_consumption");
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Filter and sort consumption data
  const filteredData = consumptionData
    .filter(item => 
      item.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.color && item.color.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "total_consumption":
          return b.total_consumption - a.total_consumption;
        case "orders_count":
          return b.orders_count - a.orders_count;
        case "material_name":
          return a.material_name.localeCompare(b.material_name);
        default:
          return 0;
      }
    });

  // Prepare chart data
  const topMaterials = filteredData.slice(0, 10);
  const chartData = topMaterials.map(item => ({
    name: item.material_name,
    consumption: item.total_consumption,
    orders: item.orders_count,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

  // Calculate total statistics
  const totalConsumption = consumptionData.reduce((sum, item) => sum + item.total_consumption, 0);
  const totalOrders = consumptionData.reduce((sum, item) => sum + item.orders_count, 0);
  const avgConsumptionPerOrder = totalOrders > 0 ? totalConsumption / totalOrders : 0;

  // Date filter handling
  const handleDateRangeChange = (period: string) => {
    setSelectedPeriod(period);
    
    const now = new Date();
    let dateRange;
    
    switch (period) {
      case "week":
        dateRange = {
          start: new Date(now.setDate(now.getDate() - 7)).toISOString(),
          end: new Date().toISOString()
        };
        break;
      case "month":
        dateRange = {
          start: new Date(now.setMonth(now.getMonth() - 1)).toISOString(),
          end: new Date().toISOString()
        };
        break;
      case "quarter":
        dateRange = {
          start: new Date(now.setMonth(now.getMonth() - 3)).toISOString(),
          end: new Date().toISOString()
        };
        break;
      default:
        dateRange = undefined;
    }
    
    updateFilters({ dateRange });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1.5">
        <h1 className="text-3xl font-bold">Material Consumption Analysis</h1>
        <p className="text-muted-foreground">
          Track material usage patterns and consumption trends across orders
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consumption</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConsumption.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Across all materials
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Orders processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Order</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgConsumptionPerOrder.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Units per order
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total_consumption">Consumption</SelectItem>
                <SelectItem value="orders_count">Order Count</SelectItem>
                <SelectItem value="material_name">Name</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPeriod} onValueChange={handleDateRangeChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Consumed Materials</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => [value.toFixed(2), 'Consumption']} />
                  <Bar dataKey="consumption" fill="#8884d8" />
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
            <CardTitle>Consumption Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.slice(0, 8)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="consumption"
                  >
                    {chartData.slice(0, 8).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value.toFixed(2), 'Consumption']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No consumption data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Material Consumption Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Material</th>
                  <th className="text-left p-2">Color</th>
                  <th className="text-left p-2">GSM</th>
                  <th className="text-right p-2">Total Consumption</th>
                  <th className="text-right p-2">Orders</th>
                  <th className="text-right p-2">Avg per Order</th>
                  <th className="text-left p-2">Unit</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={item.material_id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{item.material_name}</td>
                    <td className="p-2">{item.color || '-'}</td>
                    <td className="p-2">{item.gsm || '-'}</td>
                    <td className="p-2 text-right font-mono">{item.total_consumption.toFixed(2)}</td>
                    <td className="p-2 text-right">{item.orders_count}</td>
                    <td className="p-2 text-right font-mono">
                      {(item.total_consumption / item.orders_count).toFixed(2)}
                    </td>
                    <td className="p-2">{item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
