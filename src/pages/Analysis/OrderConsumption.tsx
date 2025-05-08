
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useInventoryAnalytics } from "@/hooks/analysis/useInventoryAnalytics";
import { formatCurrency, formatQuantity, formatAnalysisDate } from "@/utils/analysisUtils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, BarChart as BarChartIcon, AlertCircle, FileText } from "lucide-react";
import { LoadingSpinner } from "@/components/production/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Separator } from "@/components/ui/separator";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell } from "recharts";

const OrderConsumption = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { orderConsumptionData, filters, updateFilters, isLoading } = useInventoryAnalytics();
  
  // Filter data based on search (by order number or company name)
  const filteredData = searchQuery
    ? orderConsumptionData?.filter(item => 
        item.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.material_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : orderConsumptionData;
    
  // Group by order for chart visualization
  const orderChartData = filteredData?.reduce((acc: any[], item) => {
    const existingOrder = acc.find(o => o.order_id === item.order_id);
    if (existingOrder) {
      existingOrder.usage += Number(item.total_material_used || 0);
    } else {
      acc.push({
        order_id: item.order_id,
        name: item.order_number,
        company: item.company_name,
        usage: Number(item.total_material_used || 0)
      });
    }
    return acc;
  }, []).slice(0, 10);
  
  // Group by material for chart visualization
  const materialChartData = filteredData?.reduce((acc: any[], item) => {
    const existingMaterial = acc.find(m => m.material_id === item.material_id);
    if (existingMaterial) {
      existingMaterial.usage += Number(item.total_material_used || 0);
    } else if (item.material_id && item.material_name) {
      acc.push({
        material_id: item.material_id,
        name: item.material_name,
        usage: Number(item.total_material_used || 0),
        unit: item.unit || 'units'
      });
    }
    return acc;
  }, []).slice(0, 10);
  
  // Colors for the chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff7300'];
  
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
          <h1 className="text-2xl font-bold">Order Consumption Analysis</h1>
        </div>
        <p className="text-muted-foreground">
          Analyze which orders consumed which materials and in what quantities
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
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by order number, company or material..."
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Orders Analyzed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.from(new Set(filteredData?.map(item => item.order_id))).length}
            </div>
            <p className="text-xs text-muted-foreground">Unique orders with material usage</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Materials Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.from(new Set(filteredData?.map(item => item.material_id))).length}
            </div>
            <p className="text-xs text-muted-foreground">Different materials used across orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.from(new Set(filteredData?.map(item => item.company_name))).length}
            </div>
            <p className="text-xs text-muted-foreground">Unique companies with orders</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChartIcon className="h-5 w-5 mr-2" />
              Top Orders by Material Consumption
            </CardTitle>
            <CardDescription>Orders with highest material usage</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            {orderChartData && orderChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={orderChartData}
                  margin={{
                    top: 5, right: 30, left: 20, bottom: 5,
                  }}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value} units`, 'Total Usage']}
                    labelFormatter={(value) => `Order: ${value}`}
                  />
                  <Legend />
                  <Bar dataKey="usage" name="Material Usage">
                    {orderChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <AlertCircle className="mx-auto h-8 w-8" />
                  <h3 className="mt-2">No order consumption data available</h3>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Top Materials Used in Orders
            </CardTitle>
            <CardDescription>Most consumed materials across all orders</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            {materialChartData && materialChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={materialChartData}
                  margin={{
                    top: 5, right: 30, left: 80, bottom: 5,
                  }}
                >
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value} ${props.payload.unit}`,
                      'Usage'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="usage" name="Usage">
                    {materialChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <AlertCircle className="mx-auto h-8 w-8" />
                  <h3 className="mt-2">No material consumption data available</h3>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Order Material Breakdown</CardTitle>
          <CardDescription>Detailed analysis of materials consumed per order</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="py-2 px-4 text-left font-medium">Order Number</th>
                  <th className="py-2 px-4 text-left font-medium">Company</th>
                  <th className="py-2 px-4 text-left font-medium">Material</th>
                  <th className="py-2 px-4 text-left font-medium">Component</th>
                  <th className="py-2 px-4 text-right font-medium">Quantity</th>
                  <th className="py-2 px-4 text-right font-medium">Unit</th>
                  <th className="py-2 px-4 text-right font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredData && filteredData.length > 0 ? (
                  filteredData.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-4 text-left font-medium">{item.order_number || '-'}</td>
                      <td className="py-2 px-4 text-left">{item.company_name || '-'}</td>
                      <td className="py-2 px-4 text-left">{item.material_name || '-'}</td>
                      <td className="py-2 px-4 text-left">{item.component_type || '-'}</td>
                      <td className="py-2 px-4 text-right">{Number(item.total_material_used).toFixed(2)}</td>
                      <td className="py-2 px-4 text-right">{item.unit || '-'}</td>
                      <td className="py-2 px-4 text-right">{item.usage_date ? formatAnalysisDate(item.usage_date) : '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-muted-foreground">
                      No order consumption data found
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

export default OrderConsumption;
