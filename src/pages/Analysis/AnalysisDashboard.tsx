
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInventoryAnalytics } from "@/hooks/analysis/useInventoryAnalytics";
import { formatCurrency, calculatePercentage, formatQuantity } from "@/utils/analysisUtils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { LoadingSpinner } from "@/components/production/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { AlertCircle, BarChart as BarChartIcon, FileText, TrendingDown, TrendingUp, ArchiveIcon, Package, RefreshCcw } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const AnalysisDashboard = () => {
  const navigate = useNavigate();
  const { 
    consumptionData, 
    inventoryValueData, 
    refillNeedsData, 
    isLoading 
  } = useInventoryAnalytics();

  // Prepare data for pie chart
  const pieData = consumptionData?.slice(0, 5).map(item => ({
    name: item.material_name,
    value: Number(item.total_usage),
    id: item.material_id
  }));

  // Prepare data for value chart
  const valueData = inventoryValueData?.slice(0, 5).map(item => ({
    name: item.material_name,
    value: item.totalValue,
    id: item.id
  }));

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Calculate total inventory value
  const totalInventoryValue = inventoryValueData?.reduce(
    (sum, item) => sum + (item.totalValue || 0), 
    0
  ) || 0;

  // Count materials below reorder level
  const materialsNeedingRefill = refillNeedsData?.length || 0;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1.5">
        <h1 className="text-2xl font-bold">Inventory Analysis</h1>
        <p className="text-muted-foreground">
          Analyze material consumption, inventory value, and refill requirements
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Inventory Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInventoryValue)}</div>
            <p className="text-xs text-muted-foreground">
              Across {inventoryValueData?.length || 0} materials
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Materials Consumed
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consumptionData?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Different materials used in orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Needing Refill
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{materialsNeedingRefill}</div>
            <p className="text-xs text-muted-foreground">
              Materials below reorder level
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Consumption Rate
            </CardTitle>
            <BarChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {consumptionData && consumptionData.length > 0 
                ? `${formatQuantity(Number(consumptionData[0]?.total_usage || 0), consumptionData[0]?.unit || '')}`
                : "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              Most consumed material
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="consumption">Consumption</TabsTrigger>
          <TabsTrigger value="value">Value Analysis</TabsTrigger>
          <TabsTrigger value="refill">Refill Needs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <BarChartIcon className="h-5 w-5 mr-2" />
                  Top Material Consumption
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[300px] w-full">
                  {pieData && pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-muted-foreground">
                        <ArchiveIcon className="mx-auto h-8 w-8" />
                        <h3 className="mt-2">No consumption data available</h3>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Package className="h-5 w-5 mr-2" />
                  Materials by Value
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[300px] w-full">
                  {valueData && valueData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={valueData}
                        margin={{
                          top: 20, right: 40, left: 40, bottom: 20,
                        }}
                      >
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip formatter={(value) => [`₹${value}`, 'Value']} />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-muted-foreground">
                        <ArchiveIcon className="mx-auto h-8 w-8" />
                        <h3 className="mt-2">No value data available</h3>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Button 
                onClick={() => navigate('/analysis/materials')}
                className="flex items-center justify-between"
              >
                <span>Material Consumption Details</span>
                <FileText className="h-4 w-4 ml-2" />
              </Button>
              <Button 
                onClick={() => navigate('/analysis/orders')}
                className="flex items-center justify-between"
              >
                <span>Order Consumption Breakdown</span>
                <FileText className="h-4 w-4 ml-2" />
              </Button>
              <Button 
                onClick={() => navigate('/analysis/refill')}
                className="flex items-center justify-between"
              >
                <span>View Refill Requirements</span>
                <RefreshCcw className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="consumption" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Material Consumption Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={() => navigate('/analysis/materials')}>
                  Go to Detailed Material Consumption
                </Button>
                
                <Separator />
                
                {consumptionData && consumptionData.length > 0 ? (
                  <div className="relative">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 text-left font-medium">Material</th>
                          <th className="py-2 text-right font-medium">Total Usage</th>
                          <th className="py-2 text-right font-medium">Unit</th>
                          <th className="py-2 text-right font-medium">Orders</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consumptionData.slice(0, 10).map((item, index) => (
                          <tr key={item.material_id} className="border-b">
                            <td className="py-2 text-left">{item.material_name}</td>
                            <td className="py-2 text-right">{Number(item.total_usage).toFixed(2)}</td>
                            <td className="py-2 text-right">{item.unit}</td>
                            <td className="py-2 text-right">{item.orders_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex justify-center py-8">
                    <div className="text-center text-muted-foreground">
                      <ArchiveIcon className="mx-auto h-8 w-8" />
                      <h3 className="mt-2">No consumption data available</h3>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="value" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Value Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/analysis/value')} className="mb-4">
                Go to Detailed Value Analysis
              </Button>
              
              <Separator className="my-2" />
              
              {inventoryValueData && inventoryValueData.length > 0 ? (
                <div className="relative">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left font-medium">Material</th>
                        <th className="py-2 text-right font-medium">Quantity</th>
                        <th className="py-2 text-right font-medium">Rate (₹)</th>
                        <th className="py-2 text-right font-medium">Total Value (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryValueData.slice(0, 10).map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="py-2 text-left">{item.material_name}</td>
                          <td className="py-2 text-right">{item.quantity.toFixed(2)} {item.unit}</td>
                          <td className="py-2 text-right">{item.purchase_rate?.toFixed(2) || 'N/A'}</td>
                          <td className="py-2 text-right">{item.totalValue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex justify-center py-8">
                  <div className="text-center text-muted-foreground">
                    <ArchiveIcon className="mx-auto h-8 w-8" />
                    <h3 className="mt-2">No inventory value data available</h3>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="refill" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Refill Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/analysis/refill')} className="mb-4">
                Go to Detailed Refill Analysis
              </Button>
              
              <Separator className="my-2" />
              
              {refillNeedsData && refillNeedsData.length > 0 ? (
                <div className="relative">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left font-medium">Material</th>
                        <th className="py-2 text-right font-medium">Current</th>
                        <th className="py-2 text-right font-medium">Reorder Level</th>
                        <th className="py-2 text-right font-medium">Min Stock</th>
                        <th className="py-2 text-right font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {refillNeedsData.map((item) => {
                        const status = item.quantity < (item.min_stock_level || 0) 
                          ? 'critical' 
                          : 'warning';
                        
                        return (
                          <tr key={item.id} className="border-b">
                            <td className="py-2 text-left">{item.material_name}</td>
                            <td className="py-2 text-right">{item.quantity.toFixed(2)} {item.unit}</td>
                            <td className="py-2 text-right">{item.reorder_level?.toFixed(2) || 'N/A'}</td>
                            <td className="py-2 text-right">{item.min_stock_level?.toFixed(2) || 'N/A'}</td>
                            <td className="py-2 text-right">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium
                                ${status === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`
                              }>
                                {status === 'critical' ? 'Critical' : 'Low'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex justify-center py-8">
                  <div className="text-center text-muted-foreground">
                    <ArchiveIcon className="mx-auto h-8 w-8" />
                    <h3 className="mt-2">No materials need refill</h3>
                    <p className="text-sm mt-1">All inventory levels are above reorder points</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalysisDashboard;
