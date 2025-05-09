
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInventoryAnalytics } from "@/hooks/analysis/useInventoryAnalytics";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Separator } from "@/components/ui/separator";
import { Download, FileDown, BarChart2, PieChart, Package, DollarSign, Percent } from "lucide-react";
import { addDays, subMonths, formatISO } from "date-fns";
import { formatCurrency, formatQuantity } from "@/utils/analysisUtils";
import { PieChart as RechartPieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

// Helper function to generate beautiful colors
const generateColors = (count: number): string[] => {
  const baseColors = [
    "#0ea5e9", // Blue
    "#10b981", // Green
    "#f97316", // Orange
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#84cc16", // Lime
    "#eab308", // Yellow
    "#f43f5e", // Red
  ];

  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }

  // If we need more colors, cycle through with different opacities
  const colors = [...baseColors];
  let opacity = 0.8;
  while (colors.length < count) {
    baseColors.forEach((color) => {
      if (colors.length < count) {
        // Create a lighter version of the color
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        
        const newColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        colors.push(newColor);
      }
    });
    opacity -= 0.2;
    if (opacity < 0.2) opacity = 0.8;
  }

  return colors;
};

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-2 border rounded shadow-sm">
        <p className="font-medium">{payload[0].name}</p>
        <p>{`${payload[0].value.toFixed(2)} ${payload[0].unit || ""}`}</p>
        {payload[0].percentage && (
          <p>{`${payload[0].percentage.toFixed(2)}%`}</p>
        )}
      </div>
    );
  }

  return null;
};

const OrderConsumption = () => {
  const {
    orderConsumptionData,
    loading,
    fetchOrderConsumptionData,
    generateOrderConsumptionCSV,
  } = useInventoryAnalytics();

  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    from: subMonths(new Date(), 3),
    to: new Date(),
  });
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchOrderConsumptionData(dateRange);
  }, [fetchOrderConsumptionData, dateRange]);

  // Get the selected order details for the detail view
  const orderDetail = orderConsumptionData.find((order) => order.order_id === selectedOrder);

  // Handle CSV download
  const handleDownloadCSV = () => {
    const csvContent = generateOrderConsumptionCSV();
    if (!csvContent) return;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `order_consumption_${formatISO(new Date(), { representation: 'date' })}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Chart data preparation 
  const prepareBarChartData = () => {
    if (!orderConsumptionData.length) return [];

    return orderConsumptionData.slice(0, 10).map((order) => ({
      name: order.order_number,
      cost: order.total_production_cost,
      revenue: order.total_revenue,
      profit: order.profit,
    }));
  };

  const preparePieChartData = (orderId: string) => {
    const order = orderConsumptionData.find((o) => o.order_id === orderId);
    if (!order) return [];

    return order.materials.map((material) => ({
      name: material.material_name,
      value: material.total_cost,
      percentage: material.percentage_of_total,
      unit: "₹"
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Consumption Analysis</h1>
          <p className="text-muted-foreground">
            Analyze material consumption and costs by order
          </p>
        </div>
        
        <div className="flex gap-2">
          <DateRangePicker
            value={dateRange}
            onValueChange={setDateRange}
          />
          <Button variant="outline" onClick={handleDownloadCSV}>
            <FileDown size={16} className="mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Orders List</TabsTrigger>
          {selectedOrder && (
            <TabsTrigger value="detail">Order Detail</TabsTrigger>
          )}
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>
        
        {/* All Orders List Tab */}
        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2" size={20} />
                Orders Material Consumption
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : orderConsumptionData.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No consumption data available for the selected period</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order Number</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Production Cost</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderConsumptionData.map((order) => (
                        <TableRow 
                          key={order.order_id}
                          className={selectedOrder === order.order_id ? "bg-muted/50" : ""}
                        >
                          <TableCell className="font-medium">{order.order_number}</TableCell>
                          <TableCell>{order.company_name}</TableCell>
                          <TableCell>{order.product_name}</TableCell>
                          <TableCell>
                            {new Date(order.order_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">{order.order_quantity}</TableCell>
                          <TableCell className="text-right">₹{formatCurrency(order.total_production_cost)}</TableCell>
                          <TableCell className="text-right">₹{formatCurrency(order.total_revenue)}</TableCell>
                          <TableCell className={`text-right ${order.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                            ₹{formatCurrency(order.profit)}
                          </TableCell>
                          <TableCell className={`text-right ${order.profit_margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {order.profit_margin.toFixed(2)}%
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order.order_id);
                                setActiveTab("detail");
                              }}
                            >
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Order Detail Tab */}
        <TabsContent value="detail" className="space-y-6">
          {orderDetail && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="mr-2" size={20} />
                    Order #{orderDetail.order_number} Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <h3 className="font-medium text-muted-foreground">Order Information</h3>
                      <div className="grid grid-cols-2 gap-1">
                        <span className="text-muted-foreground">Company:</span>
                        <span className="font-medium">{orderDetail.company_name}</span>
                        
                        <span className="text-muted-foreground">Product:</span>
                        <span className="font-medium">{orderDetail.product_name}</span>
                        
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium">{new Date(orderDetail.order_date).toLocaleDateString()}</span>
                        
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="font-medium">{orderDetail.order_quantity}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium text-muted-foreground">Unit Economics</h3>
                      <div className="grid grid-cols-2 gap-1">
                        <span className="text-muted-foreground">Cost per unit:</span>
                        <span className="font-medium">₹{formatCurrency(orderDetail.total_production_cost / orderDetail.order_quantity)}</span>
                        
                        <span className="text-muted-foreground">Selling price:</span>
                        <span className="font-medium">₹{formatCurrency(orderDetail.selling_rate)}</span>
                        
                        <span className="text-muted-foreground">Profit per unit:</span>
                        <span className={`font-medium ${orderDetail.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                          ₹{formatCurrency(orderDetail.profit / orderDetail.order_quantity)}
                        </span>
                        
                        <span className="text-muted-foreground">Profit margin:</span>
                        <span className={`font-medium ${orderDetail.profit_margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {orderDetail.profit_margin.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-medium text-muted-foreground">Order Totals</h3>
                      <div className="grid grid-cols-2 gap-1">
                        <span className="text-muted-foreground">Total cost:</span>
                        <span className="font-medium">₹{formatCurrency(orderDetail.total_production_cost)}</span>
                        
                        <span className="text-muted-foreground">Total revenue:</span>
                        <span className="font-medium">₹{formatCurrency(orderDetail.total_revenue)}</span>
                        
                        <span className="text-muted-foreground">Total profit:</span>
                        <span className={`font-medium ${orderDetail.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                          ₹{formatCurrency(orderDetail.profit)}
                        </span>
                        
                        <span className="text-muted-foreground">Materials used:</span>
                        <span className="font-medium">{orderDetail.materials.length}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Material Breakdown</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Material</TableHead>
                              <TableHead className="text-right">Quantity</TableHead>
                              <TableHead className="text-right">Unit Price</TableHead>
                              <TableHead className="text-right">Total Cost</TableHead>
                              <TableHead className="text-right">% of Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {orderDetail.materials.map((material) => (
                              <TableRow key={material.material_id}>
                                <TableCell className="font-medium">{material.material_name}</TableCell>
                                <TableCell className="text-right">
                                  {formatQuantity(material.quantity_used, material.unit)}
                                </TableCell>
                                <TableCell className="text-right">
                                  ₹{formatCurrency(material.cost_per_unit)}
                                </TableCell>
                                <TableCell className="text-right">
                                  ₹{formatCurrency(material.total_cost)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {material.percentage_of_total.toFixed(2)}%
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      
                      <div className="min-h-[300px] flex flex-col justify-center">
                        <h4 className="text-center text-sm font-medium mb-4">Material Cost Distribution</h4>
                        <ResponsiveContainer width="100%" height={300}>
                          <RechartPieChart>
                            <Pie
                              data={preparePieChartData(orderDetail.order_id)}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                              nameKey="name"
                              label={({ name, percent }) => 
                                percent > 0.05 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''}
                            >
                              {preparePieChartData(orderDetail.order_id).map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={generateColors(orderDetail.materials.length)[index % generateColors(orderDetail.materials.length).length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </RechartPieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
        
        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue, Cost, and Profit Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart2 className="mr-2" size={20} />
                  Revenue, Cost & Profit (Top 10 Orders)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={prepareBarChartData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={70} 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="cost" name="Production Cost" fill="#f97316" />
                      <Bar dataKey="revenue" name="Revenue" fill="#10b981" />
                      <Bar dataKey="profit" name="Profit" fill="#0ea5e9" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Profit Margin Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Percent className="mr-2" size={20} />
                  Profit Margin Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Profit Metrics */}
                  <div className="space-y-6">
                    {/* Average Profit Margin */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Avg Profit Margin</span>
                        <span className="text-2xl font-bold">
                          {orderConsumptionData.length > 0 
                            ? (orderConsumptionData.reduce((sum, order) => sum + order.profit_margin, 0) / 
                               orderConsumptionData.length).toFixed(2)
                            : "0.00"}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, Math.max(0, 
                              orderConsumptionData.length > 0 
                              ? (orderConsumptionData.reduce((sum, order) => sum + order.profit_margin, 0) / 
                                orderConsumptionData.length)
                              : 0
                            ))}%` 
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Highest/Lowest Profit */}
                    <div className="space-y-4">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground block">Highest Margin</span>
                        {orderConsumptionData.length > 0 && (
                          <div className="flex justify-between mt-1">
                            <span className="font-medium">
                              {orderConsumptionData
                                .reduce((prev, current) => 
                                  (prev.profit_margin > current.profit_margin) ? prev : current
                                ).order_number}
                            </span>
                            <span className="text-green-600 font-bold">
                              {orderConsumptionData
                                .reduce((prev, current) => 
                                  (prev.profit_margin > current.profit_margin) ? prev : current
                                ).profit_margin.toFixed(2)}%
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-muted-foreground block">Lowest Margin</span>
                        {orderConsumptionData.length > 0 && (
                          <div className="flex justify-between mt-1">
                            <span className="font-medium">
                              {orderConsumptionData
                                .reduce((prev, current) => 
                                  (prev.profit_margin < current.profit_margin) ? prev : current
                                ).order_number}
                            </span>
                            <span className={`font-bold ${
                              orderConsumptionData
                                .reduce((prev, current) => 
                                  (prev.profit_margin < current.profit_margin) ? prev : current
                                ).profit_margin < 0 ? 'text-red-600' : 'text-orange-500'
                            }`}>
                              {orderConsumptionData
                                .reduce((prev, current) => 
                                  (prev.profit_margin < current.profit_margin) ? prev : current
                                ).profit_margin.toFixed(2)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Profit Distribution */}
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "Profitable Orders",
                              value: orderConsumptionData.filter(o => o.profit_margin >= 0).length,
                              fill: "#10b981"
                            },
                            {
                              name: "Loss-making Orders",
                              value: orderConsumptionData.filter(o => o.profit_margin < 0).length,
                              fill: "#f43f5e"
                            }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Profit/Loss Overview */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <Card className="bg-green-50 dark:bg-green-950/20">
                    <CardContent className="p-4">
                      <div className="flex flex-col">
                        <div className="text-green-600 flex items-center mb-2">
                          <DollarSign size={16} className="mr-1" />
                          <span className="text-sm font-medium">Total Profit</span>
                        </div>
                        <span className="text-xl font-bold">
                          ₹{formatCurrency(orderConsumptionData.reduce(
                            (sum, order) => sum + Math.max(0, order.profit), 0
                          ))}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-red-50 dark:bg-red-950/20">
                    <CardContent className="p-4">
                      <div className="flex flex-col">
                        <div className="text-red-600 flex items-center mb-2">
                          <DollarSign size={16} className="mr-1" />
                          <span className="text-sm font-medium">Total Loss</span>
                        </div>
                        <span className="text-xl font-bold">
                          ₹{formatCurrency(Math.abs(orderConsumptionData.reduce(
                            (sum, order) => sum + Math.min(0, order.profit), 0
                          )))}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderConsumption;
