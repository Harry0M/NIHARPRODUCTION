
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useInventoryAnalytics } from "@/hooks/analysis/useInventoryAnalytics";
import { formatCurrency } from "@/utils/analysisUtils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, TrendingUp, ChartPie, AlertCircle } from "lucide-react";
import { LoadingSpinner } from "@/components/production/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell, Pie, PieChart } from "recharts";
import { Progress } from "@/components/ui/progress";

const InventoryValue = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { inventoryValueData, isLoading } = useInventoryAnalytics();
  
  // Filter data based on search
  const filteredData = searchQuery
    ? inventoryValueData?.filter(item => 
        item.material_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : inventoryValueData;
  
  // Calculate total inventory value
  const totalValue = filteredData?.reduce(
    (sum, item) => sum + (item.totalValue || 0), 
    0
  ) || 0;
  
  // Prepare data for chart visualization (top 5 by value)
  const topMaterialsByValue = filteredData
    ?.sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0))
    .slice(0, 5);
  
  // Prepare data for pie chart
  const pieData = topMaterialsByValue?.map(item => ({
    name: item.material_name,
    value: item.totalValue,
  }));
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // Calculate percentage for each item
  filteredData?.forEach(item => {
    item.percentage = totalValue > 0 ? (item.totalValue / totalValue) * 100 : 0;
  });
  
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
          <h1 className="text-2xl font-bold">Inventory Value Analysis</h1>
        </div>
        <p className="text-muted-foreground">
          Analyze the value distribution of your inventory stock
        </p>
      </div>
      
      {/* Search Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filter Materials</CardTitle>
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
          </div>
        </CardContent>
      </Card>
      
      {/* Value Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">Current value of all materials</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most Valuable Material</CardTitle>
          </CardHeader>
          <CardContent>
            {topMaterialsByValue && topMaterialsByValue.length > 0 ? (
              <>
                <div className="text-2xl font-bold">{topMaterialsByValue[0].material_name}</div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(topMaterialsByValue[0].totalValue)}
                  {topMaterialsByValue[0].percentage ? 
                    ` (${topMaterialsByValue[0].percentage.toFixed(1)}% of total)` : 
                    ''}
                </p>
              </>
            ) : (
              <div className="text-xl">No data available</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Material Value</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredData && filteredData.length > 0 ? (
              <div className="text-2xl font-bold">
                {formatCurrency(totalValue / filteredData.length)}
              </div>
            ) : (
              <div className="text-xl">₹0.00</div>
            )}
            <p className="text-xs text-muted-foreground">Average value per material</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Top Materials by Value
            </CardTitle>
            <CardDescription>Materials with highest inventory value</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            {topMaterialsByValue && topMaterialsByValue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topMaterialsByValue}
                  margin={{
                    top: 20, right: 30, left: 20, bottom: 5,
                  }}
                >
                  <XAxis dataKey="material_name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(value as number), 'Value']} />
                  <Legend />
                  <Bar dataKey="totalValue" name="Value">
                    {topMaterialsByValue.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <AlertCircle className="mx-auto h-8 w-8" />
                  <h3 className="mt-2">No material value data available</h3>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ChartPie className="h-5 w-5 mr-2" />
              Value Distribution
            </CardTitle>
            <CardDescription>Percentage of total inventory value by material</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            {pieData && pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatCurrency(value as number), 'Value']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <AlertCircle className="mx-auto h-8 w-8" />
                  <h3 className="mt-2">No material value distribution data available</h3>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Material Value Details</CardTitle>
          <CardDescription>Detailed value breakdown of all inventory materials</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="py-2 px-4 text-left font-medium">Material</th>
                  <th className="py-2 px-4 text-left font-medium">Quantity</th>
                  <th className="py-2 px-4 text-right font-medium">Unit</th>
                  <th className="py-2 px-4 text-right font-medium">Rate</th>
                  <th className="py-2 px-4 text-right font-medium">Total Value</th>
                  <th className="py-2 px-4 text-right font-medium">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredData && filteredData.length > 0 ? (
                  filteredData
                    .sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0))
                    .map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-2 px-4 text-left font-medium">{item.material_name}</td>
                        <td className="py-2 px-4 text-left">{item.quantity.toFixed(2)}</td>
                        <td className="py-2 px-4 text-right">{item.unit}</td>
                        <td className="py-2 px-4 text-right">
                          {item.purchase_rate ? formatCurrency(item.purchase_rate) : '-'}
                        </td>
                        <td className="py-2 px-4 text-right font-medium">{formatCurrency(item.totalValue)}</td>
                        <td className="py-2 px-4 text-right">
                          <div className="flex items-center gap-2">
                            <Progress value={item.percentage} className="h-2" />
                            <span>{item.percentage ? item.percentage.toFixed(1) : 0}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-muted-foreground">
                      No material value data found
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

export default InventoryValue;
