import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useInventoryAnalytics } from "@/hooks/analysis/useInventoryAnalytics";
import { formatCurrency, formatQuantity } from "@/utils/analysisUtils";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, BarChart as BarChartIcon, Search, AlertCircle, Database, PieChart as PieChartIcon, Package, PercentIcon, DollarSign } from "lucide-react";
import { LoadingSpinner } from "@/components/production/LoadingSpinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";

const MaterialConsumption = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const { consumptionData, orderConsumptionData, filters, updateFilters, isLoading } = useInventoryAnalytics();
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff7300', '#a05195', '#d45087', '#2f4b7c'];
  
  // Filter data based on search
  const filteredData = searchQuery 
    ? consumptionData?.filter(item => 
        item.material_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : consumptionData;

  // Get detailed data for selected material
  const selectedMaterial = selectedMaterialId 
    ? filteredData?.find(item => item.material_id === selectedMaterialId)
    : null;
  
  // Filter order consumption data based on selected material
  const materialOrderDetails = selectedMaterialId
    ? orderConsumptionData?.filter(item => item.material_id === selectedMaterialId)
    : [];

  // Organize order details by order for the selected material
  const orderBreakdown = materialOrderDetails.reduce((acc: any, item) => {
    const existingOrder = acc.find((o: any) => o.order_id === item.order_id);
    if (existingOrder) {
      existingOrder.quantity += Number(item.total_material_used || 0);
    } else {
      acc.push({
        order_id: item.order_id,
        order_number: item.order_number,
        company_name: item.company_name,
        usage_date: item.usage_date,
        quantity: Number(item.total_material_used || 0),
        unit: item.unit
      });
    }
    return acc;
  }, []);

  // Calculate total quantity for percentage calculations
  const totalMaterialQuantity = selectedMaterial ? Number(selectedMaterial.total_usage) : 0;
  
  // Add percentage to order breakdown
  // Using a default purchase price (0) if not available
  const materialPurchasePrice = selectedMaterial && 'purchase_rate' in selectedMaterial ? 
    Number(selectedMaterial.purchase_rate) : 0;
    
  const orderBreakdownWithPercentage = orderBreakdown.map((order: any) => ({
    ...order,
    percentage: totalMaterialQuantity > 0 ? (order.quantity / totalMaterialQuantity) * 100 : 0,
    value: order.quantity * materialPurchasePrice
  }));

  // Sort order breakdown by quantity descending
  const sortedOrderBreakdown = [...orderBreakdownWithPercentage].sort((a, b) => b.quantity - a.quantity);

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
      
      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side - Materials List */}
        <div className="md:col-span-1 space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Materials Analyzed</CardTitle>
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
          </div>
          
          {/* Materials List */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Materials Used
              </CardTitle>
              <CardDescription>Click on a material to see details</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="p-0">
                  {filteredData && filteredData.length > 0 ? (
                    filteredData.map((material) => (
                      <div 
                        key={material.material_id}
                        className={`flex items-center justify-between p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedMaterialId === material.material_id ? 'bg-muted' : ''}`}
                        onClick={() => setSelectedMaterialId(material.material_id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{material.material_name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <span>{formatQuantity(Number(material.total_usage), material.unit || "")}</span>
                            <span>•</span>
                            <span>{material.orders_count} orders</span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          {((Number(material.total_usage) / totalConsumption) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">No materials found</div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Side - Material Details or Charts */}
        <div className="md:col-span-2 space-y-6">
          {selectedMaterial ? (
            <>
              {/* Material Detail Card */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{selectedMaterial.material_name}</CardTitle>
                      <CardDescription>
                        {selectedMaterial.color ? `Color: ${selectedMaterial.color}` : ''} 
                        {selectedMaterial.gsm ? ` • GSM: ${selectedMaterial.gsm}` : ''}
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedMaterialId(null)}
                    >
                      Back to Overview
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="space-y-1 p-4 bg-muted/30 rounded-lg">
                      <div className="text-sm text-muted-foreground">Total Consumption</div>
                      <div className="text-2xl font-bold">{formatQuantity(Number(selectedMaterial.total_usage), selectedMaterial.unit || "")}</div>
                    </div>
                    <div className="space-y-1 p-4 bg-muted/30 rounded-lg">
                      <div className="text-sm text-muted-foreground">Used in Orders</div>
                      <div className="text-2xl font-bold">{selectedMaterial.orders_count}</div>
                    </div>
                    <div className="space-y-1 p-4 bg-muted/30 rounded-lg">
                        <div className="text-sm text-muted-foreground">Material Value</div>
                        <div className="text-2xl font-bold">
                          ₹{formatCurrency(Number(selectedMaterial.total_usage) * materialPurchasePrice)}
                        </div>
                    </div>
                  </div>
                  
                  <Tabs defaultValue="orders">
                    <TabsList className="mb-4">
                      <TabsTrigger value="orders">Usage by Order</TabsTrigger>
                      <TabsTrigger value="chart">Usage Distribution</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="orders" className="space-y-4">
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order</TableHead>
                              <TableHead>Company</TableHead>
                              <TableHead className="text-right">Quantity</TableHead>
                              <TableHead className="text-right">Value</TableHead>
                              <TableHead className="text-right">% of Use</TableHead>
                              <TableHead className="text-right">Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedOrderBreakdown.length > 0 ? (
                              sortedOrderBreakdown.map((order: any) => (
                                <TableRow key={order.order_id}>
                                  <TableCell className="font-medium">{order.order_number}</TableCell>
                                  <TableCell>{order.company_name || '-'}</TableCell>
                                  <TableCell className="text-right">{formatQuantity(order.quantity, order.unit)}</TableCell>
                                  <TableCell className="text-right">₹{formatCurrency(order.value)}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <span>{order.percentage.toFixed(1)}%</span>
                                      <div className="w-16">
                                        <Progress value={order.percentage} className="h-2" />
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">{order.usage_date ? format(new Date(order.usage_date), 'dd MMM yyyy') : '-'}</TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                  No order data available for this material
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="chart" className="space-y-4">
                      <div className="h-[400px]">
                        {sortedOrderBreakdown.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={sortedOrderBreakdown.slice(0, 10)}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="quantity"
                                nameKey="order_number"
                              >
                                {sortedOrderBreakdown.slice(0, 10).map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value: any, name: any, props: any) => [
                                  `${value} ${props.payload.unit}`,
                                  props.payload.order_number
                                ]}
                              />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center text-muted-foreground">
                              <AlertCircle className="mx-auto h-8 w-8" />
                              <h3 className="mt-2">No order data available for this material</h3>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Overview Charts */}
              <div className="grid gap-6 grid-cols-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChartIcon className="h-5 w-5 mr-2" />
                      Top 10 Materials by Consumption
                    </CardTitle>
                    <CardDescription>Click on a material to see detailed breakdown</CardDescription>
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
                            outerRadius={150}
                            fill="#8884d8"
                            dataKey="value"
                            onClick={(data) => setSelectedMaterialId(data.id)}
                            className="cursor-pointer"
                          >
                            {chartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name, props) => [
                              `${value} ${props.payload.unit}`,
                              `${props.payload.name} (${props.payload.orders} orders)`
                            ]}
                          />
                          <Legend 
                            onClick={(data) => setSelectedMaterialId(data.id)}
                            className="cursor-pointer"
                          />
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
                      <BarChartIcon className="h-5 w-5 mr-2" />
                      Order Count by Material
                    </CardTitle>
                    <CardDescription>Number of orders where each material was used</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    {chartData && chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={chartData.sort((a, b) => b.orders - a.orders)}
                          margin={{
                            top: 5, right: 30, left: 60, bottom: 5,
                          }}
                          onClick={(data) => data && data.activePayload && setSelectedMaterialId(data.activePayload[0].payload.id)}
                          className="cursor-pointer"
                        >
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={120} />
                          <Tooltip 
                            formatter={(value, name) => [value, 'Orders']}
                          />
                          <Legend />
                          <Bar dataKey="orders" fill="#82ca9d" name="Order Count">
                            {chartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Bar>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialConsumption;
