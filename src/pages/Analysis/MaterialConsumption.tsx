
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useInventoryAnalytics } from "@/hooks/analysis/useInventoryAnalytics";
import { formatCurrency, formatQuantity } from "@/utils/analysisUtils";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, BarChart as BarChartIcon, Search, AlertCircle, Database } from "lucide-react";
import { LoadingSpinner } from "@/components/production/LoadingSpinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { format } from "date-fns";

const MaterialConsumption = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { consumptionData, filters, updateFilters, isLoading } = useInventoryAnalytics();
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff7300'];
  
  // Filter data based on search
  const filteredData = searchQuery 
    ? consumptionData?.filter(item => 
        item.material_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : consumptionData;

  // Prepare data for charts
  const chartData = filteredData?.slice(0, 10).map(item => ({
    name: item.material_name,
    value: Number(item.total_usage),
    id: item.material_id,
    unit: item.unit,
    orders: item.orders_count
  }));
  
  // Calculate total consumption
  const totalConsumption = filteredData?.reduce((sum, item) => sum + Number(item.total_usage || 0), 0) || 0;
  
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1.5">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/analysis')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Material Consumption Analysis</h1>
        </div>
        <p className="text-muted-foreground">
          Analyze which materials are being consumed the most across orders
        </p>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Materials</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-[300px]">
              <Label>Date Range</Label>
              <DatePickerWithRange 
                date={{
                  from: filters.dateRange.startDate,
                  to: filters.dateRange.endDate
                }}
                onChange={(range) => {
                  updateFilters({
                    dateRange: {
                      startDate: range.from,
                      endDate: range.to
                    }
                  });
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredData?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Materials with consumption data</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Consumption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalConsumption.toFixed(2)}
              <span className="text-muted-foreground text-sm ml-1">units</span>
            </div>
            <p className="text-xs text-muted-foreground">Across all materials</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most Consumed Material</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredData && filteredData.length > 0 ? (
              <>
                <div className="text-2xl font-bold">{filteredData[0].material_name}</div>
                <p className="text-xs text-muted-foreground">
                  {formatQuantity(Number(filteredData[0].total_usage), filteredData[0].unit || "")}
                </p>
              </>
            ) : (
              <div className="text-xl">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChartIcon className="h-5 w-5 mr-2" />
              Material Consumption Distribution
            </CardTitle>
            <CardDescription>Percentage breakdown of material usage</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} ${props.payload.unit}`,
                      props.payload.name
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <AlertCircle className="mx-auto h-8 w-8" />
                  <h3 className="mt-2">No consumption data available</h3>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Top 10 Materials by Consumption
            </CardTitle>
            <CardDescription>Materials with highest consumption</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={chartData}
                  margin={{
                    top: 5, right: 30, left: 60, bottom: 5,
                  }}
                >
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} ${props.payload.unit}`,
                      'Consumption'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#82ca9d" name="Usage" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <AlertCircle className="mx-auto h-8 w-8" />
                  <h3 className="mt-2">No consumption data available</h3>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Material Consumption Details</CardTitle>
          <CardDescription>Detailed breakdown of material usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="py-2 px-4 text-left font-medium">Material</th>
                  <th className="py-2 px-4 text-left font-medium">GSM</th>
                  <th className="py-2 px-4 text-left font-medium">Color</th>
                  <th className="py-2 px-4 text-right font-medium">Consumption</th>
                  <th className="py-2 px-4 text-right font-medium">Unit</th>
                  <th className="py-2 px-4 text-right font-medium">Orders</th>
                  <th className="py-2 px-4 text-right font-medium">First Used</th>
                  <th className="py-2 px-4 text-right font-medium">Last Used</th>
                </tr>
              </thead>
              <tbody>
                {filteredData && filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <tr key={item.material_id} className="border-b">
                      <td className="py-2 px-4 text-left font-medium">{item.material_name}</td>
                      <td className="py-2 px-4 text-left">{item.gsm || '-'}</td>
                      <td className="py-2 px-4 text-left">{item.color || '-'}</td>
                      <td className="py-2 px-4 text-right">{Number(item.total_usage).toFixed(2)}</td>
                      <td className="py-2 px-4 text-right">{item.unit}</td>
                      <td className="py-2 px-4 text-right">{item.orders_count}</td>
                      <td className="py-2 px-4 text-right">
                        {item.first_usage_date ? format(new Date(item.first_usage_date), 'dd MMM yyyy') : '-'}
                      </td>
                      <td className="py-2 px-4 text-right">
                        {item.last_usage_date ? format(new Date(item.last_usage_date), 'dd MMM yyyy') : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-muted-foreground">
                      No consumption data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialConsumption;
