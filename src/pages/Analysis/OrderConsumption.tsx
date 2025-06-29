import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { formatCurrency, formatAnalysisDate } from "@/utils/analysisUtils";
import { format, subMonths } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, BarChart as BarChartIcon, AlertCircle, FileText, TrendingUp, DollarSign, ShoppingBag, Building2, Download, FileSpreadsheet, Package } from "lucide-react";
import { LoadingSpinner } from "@/components/production/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Separator } from "@/components/ui/separator";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell, PieChart as RechartsPieChart, Pie } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CartesianGrid } from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

// Order analysis interface
interface OrderAnalysis {
  id: string;
  order_number: string;
  company_name: string;
  order_date: string;
  status: string;
  order_quantity: number;
  product_quantity?: number;
  total_quantity?: number;
  material_cost: number;
  cutting_charge: number;
  printing_charge: number;
  stitching_charge: number;
  transport_charge: number;
  production_cost: number;
  total_cost: number;
  margin: number;
  calculated_selling_price: number;
  profit: number;
  profit_margin: number;
  bag_length: number;
  bag_width: number;
  catalog_name?: string;
  components?: Array<{
    id: string;
    component_type: string;
    custom_name?: string;
    consumption: number;
    component_cost: number;
    material_id: string;
    material_name: string;
    unit: string;
    material_rate: number;
  }>;
}

const OrderConsumption = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{from?: Date; to?: Date}>({
    from: subMonths(new Date(), 6),
    to: new Date()
  });
  
  // Fetch orders data for analysis - with order components
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders-analysis', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          id, 
          order_number, 
          company_name, 
          order_date, 
          status, 
          quantity,
          bag_length,
          bag_width,
          material_cost,
          cutting_charge,
          printing_charge,
          stitching_charge,
          transport_charge,
          total_cost,
          margin,
          calculated_selling_price,
          order_components (
            id,
            component_type,
            custom_name,
            consumption,
            component_cost,
            material_id
          )
        `);
      
      // Apply date filters
      if (dateRange.from) {
        query = query.gte('order_date', dateRange.from.toISOString());
      }
      if (dateRange.to) {
        query = query.lte('order_date', dateRange.to.toISOString());
      }
      
      const { data, error } = await query.order('order_date', { ascending: false });
      
      if (error) throw error;
      
      // Process the data to calculate profit and other metrics
      const processedData: OrderAnalysis[] = (data || []).map(order => {
        const materialCost = Number(order.material_cost || 0);
        const cuttingCharge = Number(order.cutting_charge || 0);
        const printingCharge = Number(order.printing_charge || 0);
        const stitchingCharge = Number(order.stitching_charge || 0);
        const transportCharge = Number(order.transport_charge || 0);
        const totalCost = Number(order.total_cost || 0);
        const sellingPrice = Number(order.calculated_selling_price || 0);
        const margin = Number(order.margin || 0);
        
        // Process order components for material breakdown
        const components = (order.order_components || []).map(component => ({
          id: component.id,
          component_type: component.component_type,
          custom_name: component.custom_name,
          consumption: Number(component.consumption || 0),
          component_cost: Number(component.component_cost || 0),
          material_id: component.material_id,
          material_name: component.custom_name || component.component_type,
          unit: 'units',
          material_rate: 0 // Will be calculated differently
        }));
        
        // Calculate profit
        const profit = sellingPrice - totalCost;
        const profitMargin = totalCost > 0 ? (profit / totalCost) * 100 : 0;
        
        return {
          id: order.id,
          order_number: order.order_number,
          company_name: order.company_name,
          order_date: order.order_date,
          status: order.status,
          order_quantity: Number(order.quantity || 1),
          product_quantity: 1,
          total_quantity: Number(order.quantity || 1),
          material_cost: materialCost,
          cutting_charge: cuttingCharge,
          printing_charge: printingCharge,
          stitching_charge: stitchingCharge,
          transport_charge: transportCharge,
          production_cost: cuttingCharge + printingCharge + stitchingCharge,
          total_cost: totalCost,
          margin: margin,
          calculated_selling_price: sellingPrice,
          profit: profit,
          profit_margin: profitMargin,
          bag_length: Number(order.bag_length || 0),
          bag_width: Number(order.bag_width || 0),
          catalog_name: 'Unknown Product', // Simplified for now since catalog relation has issues
          components: components // Add components data
        };
      });
      
      return processedData;
    }
  });
  
  // Filter the data based on search query if needed
  const filteredData = ordersData?.filter(order => {
    if (!searchQuery) return true;
    return order.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           order.order_number?.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];
    
  console.log("Filtered data:", filteredData);
    
  // Group by order for visualization and analysis
  // Use filtered data directly for visualization and analysis
  const orderChartData = filteredData?.map(item => ({
    order_id: item.id,
    order_number: item.order_number,
    company_name: item.company_name,
    date: item.order_date ? new Date(item.order_date) : null,
    quantity: item.order_quantity,
    totalCost: item.total_cost,
    totalCostFormatted: formatCurrency(item.total_cost),
    sellingPrice: item.calculated_selling_price,
    sellingPriceFormatted: formatCurrency(item.calculated_selling_price),
    profit: item.profit,
    profitFormatted: formatCurrency(item.profit),
    profitMargin: item.profit_margin,
    marginPercent: item.margin,
    productionCosts: {
      cuttingCost: item.cutting_charge,
      printingCost: item.printing_charge,
      stitchingCost: item.stitching_charge,
      transportCost: item.transport_charge
    },
    materialCost: item.material_cost,
    materials: (item.components || []).map(comp => ({
      material_id: comp.material_id,
      material_name: comp.material_name,
      quantity: comp.consumption,
      unit: comp.unit,
      value: comp.component_cost,
      component_type: comp.component_type,
      custom_name: comp.custom_name
    })),
    catalog_name: item.catalog_name
  })) || [];
  
  // Process the data for analytics
  
  // 1. Group orders by month for trend analysis
  const monthlyOrdersData = orderChartData?.reduce((acc: any, order) => {
    if (order.date) {
      const monthKey = `${order.date.getFullYear()}-${String(order.date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: new Date(order.date.getFullYear(), order.date.getMonth(), 1),
          count: 0,
          revenue: 0,
          profit: 0,
          materialCost: 0
        };
      }
      acc[monthKey].count += 1;
      acc[monthKey].revenue += order.sellingPrice || 0;
      acc[monthKey].profit += order.profit || 0;
      acc[monthKey].materialCost += order.materialCost || 0;
    }
    return acc;
  }, {});

  // Convert to array and sort by month
  const monthlyOrdersTrend = Object.values(monthlyOrdersData || {}).sort((a: any, b: any) => {
    return new Date(a.month).getTime() - new Date(b.month).getTime();
  }).map((item: any) => ({
    ...item,
    month: item.month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }));

  // 2. Find highest profit orders
  const highestProfitOrders = [...(orderChartData || [])]
    .sort((a, b) => (b.profit || 0) - (a.profit || 0))
    .slice(0, 5);

  // 3. Find orders with highest material consumption (by value)
  const highestMaterialConsumption = [...(orderChartData || [])]
    .sort((a, b) => (b.materialCost || 0) - (a.materialCost || 0))
    .slice(0, 5);

  // 4. Get details of selected order
  const selectedOrder = selectedOrderId 
    ? orderChartData?.find(order => order.order_id === selectedOrderId)
    : null;
  
  // Sort materials by value for selected order
  const sortedMaterials = selectedOrder?.materials?.sort((a: any, b: any) => b.value - a.value) || [];
  
  // Prepare data for material distribution chart in selected order
  const materialDistributionData = sortedMaterials.map((material: any) => ({
    name: material.material_name,
    value: material.quantity,
    unit: material.unit,
    materialValue: material.value
  }));
  
  // Prepare cost breakdown data for pie chart
  const getCostBreakdownData = (order: any) => {
    if (!order) return [];
    
    const data = [
      { name: 'Material', value: order.materialCost },
      { name: 'Cutting', value: order.productionCosts?.cuttingCost || 0 },
      { name: 'Printing', value: order.productionCosts?.printingCost || 0 },
      { name: 'Stitching', value: order.productionCosts?.stitchingCost || 0 },
      { name: 'Transport', value: order.productionCosts?.transportCost || 0 }
    ];
    
    // Filter out zero-value segments
    return data.filter(item => item.value > 0);
  };
  
  // Colors for the chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff7300', '#a05195', '#d45087', '#2f4b7c'];
  
  const handleDownloadCSV = () => {
    if (!orderChartData?.length) return;
    const formattedData = orderChartData.map(order => ({
      'Order Number': order.order_number,
      'Company': order.company_name,
      'Product': order.catalog_name,
      'Quantity': order.quantity,
      'Total Cost': order.totalCost,
      'Selling Price': order.sellingPrice,
      'Profit': order.profit,
      'Profit Margin %': order.profitMargin,
      'Material Cost': order.materialCost,
      'Production Cost': Object.values(order.productionCosts).reduce((sum: number, cost: number) => sum + cost, 0)
    }));
    
    // Simple CSV download (you may want to implement a proper CSV export function)
    console.log('CSV Data:', formattedData);
  };

  const handleDownloadPDF = () => {
    if (!orderChartData?.length) return;
    const formattedData = orderChartData.map(order => ({
      'Order Number': order.order_number,
      'Company': order.company_name,
      'Product': order.catalog_name,
      'Quantity': order.quantity,
      'Total Cost': order.totalCost,
      'Selling Price': order.sellingPrice,
      'Profit': order.profit,
      'Profit Margin %': order.profitMargin
    }));
    
    // Simple PDF download (you may want to implement a proper PDF export function)
    console.log('PDF Data:', formattedData);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/analysis')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Order Consumption Analysis</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              Download CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-1" />
              Download PDF
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          Analyze material usage, costs, and profitability by order
        </p>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Filters</CardTitle>            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center"
                onClick={() => {
                  if (orderChartData && orderChartData.length > 0) {
                    const exportData = orderChartData.map(order => ({
                      'Order Number': order.order_number,
                      'Company': order.company_name,
                      'Total Cost': order.totalCost,
                      'Selling Price': order.sellingPrice,
                      'Profit': order.profit
                    }));
                    console.log('CSV Export Data:', exportData);
                  }
                }}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center"
                onClick={() => {
                  if (orderChartData && orderChartData.length > 0) {
                    console.log('PDF Export:', orderChartData);
                  }
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center"
                onClick={() => {
                  if (orderChartData && orderChartData.length > 0) {
                    console.log('Detailed Export:', orderChartData);
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Details
              </Button>
            </div>
          </div>
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
                  from: dateRange.from,
                  to: dateRange.to
                }}
                onChange={(range) => {
                  setDateRange({
                    from: range.from,
                    to: range.to
                  });
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side - Orders List */}
        <div className="md:col-span-1 space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Orders Analyzed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {orderChartData?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Orders with material usage data</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Companies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Array.from(new Set(orderChartData?.map(item => item.company_name))).length}
                </div>
                <p className="text-xs text-muted-foreground">Unique companies with orders</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{formatCurrency(orderChartData?.reduce((sum, order) => sum + (order.sellingPrice || 0), 0) || 0)}
                </div>
                <p className="text-xs text-muted-foreground">From all analyzed orders</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ₹{formatCurrency(orderChartData?.reduce((sum, order) => sum + (order.profit || 0), 0) || 0)}
                </div>
                <p className="text-xs text-muted-foreground">Across all orders</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Orders List */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Orders
              </CardTitle>
              <CardDescription>Click on an order to see details</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="p-0">
                  {orderChartData && orderChartData.length > 0 ? (
                    orderChartData.map((order) => (
                      <div 
                        key={order.order_id}
                        className={`flex items-center justify-between p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedOrderId === order.order_id ? 'bg-muted' : ''}`}
                        onClick={() => setSelectedOrderId(order.order_id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate flex items-center gap-2">
                            {order.order_number}
                            {order.profit > 0 ? (
                              <Badge className="text-xs bg-green-500 hover:bg-green-600">+{order.profitMargin.toFixed(1)}%</Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs bg-red-500 hover:bg-red-600">{order.profitMargin.toFixed(1)}%</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">{order.company_name}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">₹{formatCurrency(order.sellingPrice)}</div>
                          <div className="text-sm text-muted-foreground">{order.date ? order.date.toLocaleDateString() : '-'}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">No orders found</div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        {/* Center-Right Sections - Order Details & Analysis */}
        <div className="md:col-span-2 space-y-6">
          {/* Monthly Order Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChartIcon className="h-5 w-5 mr-2" />
                Monthly Order Trends
              </CardTitle>
              <CardDescription>Orders per month with revenue and profit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {monthlyOrdersTrend && monthlyOrdersTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyOrdersTrend}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        formatter={(value: any, name: any) => [`₹${formatCurrency(Number(value))}`, name]}
                        labelFormatter={(value: any) => `${value}`}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="count" name="Order Count" fill="#8884d8" />
                      <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="#82ca9d" />
                      <Bar yAxisId="right" dataKey="profit" name="Profit" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-muted-foreground">No monthly data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Highest Profit & Material Usage Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Highest Profit Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Highest Profit Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[250px]">
                  {highestProfitOrders && highestProfitOrders.length > 0 ? (
                    <div className="p-0">
                      {highestProfitOrders.map((order, index) => (
                        <div 
                          key={order.order_id}
                          className={`flex items-center justify-between p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedOrderId === order.order_id ? 'bg-muted' : ''}`}
                          onClick={() => setSelectedOrderId(order.order_id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{order.order_number}</div>
                            <div className="text-sm text-muted-foreground">{order.company_name}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600 dark:text-green-400">₹{formatCurrency(order.profit)}</div>
                            <div className="text-xs">Profit Margin: {order.profitMargin.toFixed(1)}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      No profit data available
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
            
            {/* Highest Material Consumption */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Package className="h-5 w-5 mr-2" />
                  Highest Material Consumption
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[250px]">
                  {highestMaterialConsumption && highestMaterialConsumption.length > 0 ? (
                    <div className="p-0">
                      {highestMaterialConsumption.map((order, index) => (
                        <div 
                          key={order.order_id}
                          className={`flex items-center justify-between p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedOrderId === order.order_id ? 'bg-muted' : ''}`}
                          onClick={() => setSelectedOrderId(order.order_id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{order.order_number}</div>
                            <div className="text-sm text-muted-foreground">{order.company_name}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">₹{formatCurrency(order.materialCost)}</div>
                            <div className="text-xs">Material Cost</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      No material consumption data available
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {selectedOrder ? (
            <>
              {/* Order Detail Card */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{selectedOrder.order_number}</CardTitle>
                      <CardDescription>
                        {selectedOrder.company_name} • {selectedOrder.catalog_name} • {selectedOrder.date ? selectedOrder.date.toLocaleDateString() : 'Unknown date'}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                        onClick={() => {
                          // Create a detailed export of this single order
                          if (selectedOrder) {
                            // Create single-order exports for both summary and details
                            const summaryData = [{
                              'Order Number': selectedOrder.order_number,
                              'Company': selectedOrder.company_name,
                              'Total Cost': selectedOrder.totalCost,
                              'Selling Price': selectedOrder.sellingPrice,
                              'Profit': selectedOrder.profit
                            }];
                            console.log('Single Order Export:', summaryData);
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                        onClick={() => {
                          // Generate PDF for single order
                          if (selectedOrder) {
                            console.log('Single Order PDF:', selectedOrder);
                          }
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Export PDF
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedOrderId(null)}
                      >
                        Back to Overview
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="space-y-1 p-4 bg-muted/30 rounded-lg">
                      <div className="text-sm text-muted-foreground">Order Quantity</div>
                      <div className="text-2xl font-bold">{selectedOrder.quantity}</div>
                    </div>
                    <div className="space-y-1 p-4 bg-muted/30 rounded-lg">
                      <div className="text-sm text-muted-foreground">Total Revenue</div>
                      <div className="text-2xl font-bold">₹{formatCurrency(selectedOrder.sellingPrice)}</div>
                    </div>
                    <div className={`space-y-1 p-4 rounded-lg ${selectedOrder.profit > 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                      <div className="text-sm text-muted-foreground">Profit</div>
                      <div className="text-2xl font-bold">₹{formatCurrency(selectedOrder.profit)}</div>
                      <div className="text-sm">{selectedOrder.profitMargin.toFixed(1)}% margin</div>
                    </div>
                  </div>
                  
                  <Tabs defaultValue="materials">
                    <TabsList className="mb-4">
                      <TabsTrigger value="materials">Material Breakdown</TabsTrigger>
                      <TabsTrigger value="costs">Cost Structure</TabsTrigger>
                      <TabsTrigger value="chart">Visual Analysis</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="materials" className="space-y-4">
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Material</TableHead>
                              <TableHead className="text-right">Quantity</TableHead>
                              <TableHead className="text-right">Unit</TableHead>
                              <TableHead className="text-right">Value</TableHead>
                              <TableHead className="text-right">% of Cost</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedMaterials.length > 0 ? (
                              sortedMaterials.map((material: any) => (
                                <TableRow key={material.material_id}>
                                  <TableCell className="font-medium">{material.material_name}</TableCell>
                                  <TableCell className="text-right">{material.quantity.toFixed(2)}</TableCell>
                                  <TableCell className="text-right">{material.unit}</TableCell>
                                  <TableCell className="text-right">₹{formatCurrency(material.value)}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <span>{selectedOrder.materialCost ? ((material.value / selectedOrder.materialCost) * 100).toFixed(1) : 0}%</span>
                                      <div className="w-16">
                                        <Progress value={selectedOrder.materialCost ? ((material.value / selectedOrder.materialCost) * 100) : 0} className="h-2" />
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                  No material data available for this order
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="costs" className="space-y-4">
                      {/* Material Cost Section */}
                      <div className="p-4 rounded-md bg-muted/20">
                        <h3 className="font-medium mb-2">Material Costs</h3>
                        <div className="space-y-3">
                          {sortedMaterials.length > 0 ? (
                            <>
                              {sortedMaterials.map((material: any) => (
                                <div key={material.material_id} className="flex justify-between items-center">
                                  <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                                    {material.material_name} ({material.quantity.toFixed(2)} {material.unit})
                                  </span>
                                  <span className="font-medium">₹{formatCurrency(material.value)}</span>
                                </div>
                              ))}
                              <Separator />
                              <div className="flex justify-between items-center font-medium">
                                <span>Total Material Cost</span>
                                <span>₹{formatCurrency(selectedOrder.materialCost)}</span>
                              </div>
                            </>
                          ) : (
                            <div className="text-center text-muted-foreground py-2">
                              No material data available
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Production Cost Section */}
                      <div className="p-4 rounded-md bg-muted/20">
                        <h3 className="font-medium mb-2">Production Costs</h3>
                        <div className="space-y-3">
                          {selectedOrder.productionCosts ? (
                            <>
                              {selectedOrder.productionCosts.cuttingCost > 0 && (
                                <div className="flex justify-between items-center">
                                  <span>Cutting Charge</span>
                                  <span className="font-medium">₹{formatCurrency(selectedOrder.productionCosts.cuttingCost)}</span>
                                </div>
                              )}
                              {selectedOrder.productionCosts.printingCost > 0 && (
                                <div className="flex justify-between items-center">
                                  <span>Printing Charge</span>
                                  <span className="font-medium">₹{formatCurrency(selectedOrder.productionCosts.printingCost)}</span>
                                </div>
                              )}
                              {selectedOrder.productionCosts.stitchingCost > 0 && (
                                <div className="flex justify-between items-center">
                                  <span>Stitching Charge</span>
                                  <span className="font-medium">₹{formatCurrency(selectedOrder.productionCosts.stitchingCost)}</span>
                                </div>
                              )}
                              {selectedOrder.productionCosts.transportCost > 0 && (
                                <div className="flex justify-between items-center">
                                  <span>Transport Charge</span>
                                  <span className="font-medium">₹{formatCurrency(selectedOrder.productionCosts.transportCost)}</span>
                                </div>
                              )}
                              <Separator />
                              <div className="flex justify-between items-center font-medium">
                                <span>Total Production Cost</span>
                                <span>₹{formatCurrency(selectedOrder.productionCosts.cuttingCost + selectedOrder.productionCosts.printingCost + selectedOrder.productionCosts.stitchingCost + selectedOrder.productionCosts.transportCost)}</span>
                              </div>
                            </>
                          ) : (
                            <div className="text-center text-muted-foreground py-2">
                              No production cost data available
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Total Cost and Profit Section */}
                      <div className="p-4 rounded-md bg-muted/20">
                        <h3 className="font-medium mb-2">Summary & Profit</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span>Total Material Cost</span>
                            <span className="font-medium">₹{formatCurrency(selectedOrder.materialCost)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Total Production Cost</span>
                            <span className="font-medium">₹{formatCurrency((selectedOrder.productionCosts?.cuttingCost || 0) + (selectedOrder.productionCosts?.printingCost || 0) + (selectedOrder.productionCosts?.stitchingCost || 0) + (selectedOrder.productionCosts?.transportCost || 0))}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between items-center">
                            <span>Total Cost</span>
                            <span className="font-medium">₹{formatCurrency(selectedOrder.totalCost)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Applied Margin</span>
                            <span className="font-medium">{selectedOrder.marginPercent?.toFixed(1) || "15.0"}%</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between items-center">
                            <span>Revenue</span>
                            <span className="font-medium">₹{formatCurrency(selectedOrder.sellingPrice)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Profit</span>
                            <span className={`font-medium ${selectedOrder.profit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              ₹{formatCurrency(selectedOrder.profit)} ({selectedOrder.profitMargin.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="chart" className="space-y-8">
                      {/* Material Distribution Pie Chart */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">Material Distribution</h3>
                        <div className="h-[300px]">
                          {materialDistributionData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsPieChart>
                                <Pie
                                  data={materialDistributionData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                  outerRadius={120}
                                  fill="#8884d8"
                                  dataKey="value"
                                  nameKey="name"
                                >
                                  {materialDistributionData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  formatter={(value: any, name: any, props: any) => [
                                    `${value} ${props.payload.unit} (₹${formatCurrency(props.payload.materialValue)})`,
                                    props.payload.name
                                  ]}
                                />
                              </RechartsPieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center text-muted-foreground">
                                <AlertCircle className="mx-auto h-8 w-8" />
                                <h3 className="mt-2">No material data available</h3>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Cost Breakdown Pie Chart */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">Cost Structure</h3>
                        <div className="h-[300px]">
                          {selectedOrder.totalCost > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsPieChart>
                                <Pie
                                  data={getCostBreakdownData(selectedOrder)}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                  outerRadius={120}
                                  fill="#8884d8"
                                  dataKey="value"
                                  nameKey="name"
                                >
                                  {getCostBreakdownData(selectedOrder).map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  formatter={(value: any) => [`₹${formatCurrency(value)}`, "Cost"]}
                                />
                                <Legend />
                              </RechartsPieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center text-muted-foreground">
                                <AlertCircle className="mx-auto h-8 w-8" />
                                <h3 className="mt-2">No cost data available</h3>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="chart" className="space-y-8">
                      {/* Material Distribution Pie Chart */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">Material Distribution</h3>
                        <div className="h-[300px]">
                          {materialDistributionData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsPieChart>
                                <Pie
                                  data={materialDistributionData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                  outerRadius={120}
                                  fill="#8884d8"
                                  dataKey="value"
                                  nameKey="name"
                                >
                                  {materialDistributionData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  formatter={(value: any, name: any, props: any) => [
                                    `${value} ${props.payload.unit} (₹${formatCurrency(props.payload.materialValue)})`,
                                    props.payload.name
                                  ]}
                                />
                              </RechartsPieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center text-muted-foreground">
                                <AlertCircle className="mx-auto h-8 w-8" />
                                <h3 className="mt-2">No material data available</h3>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Cost Breakdown Pie Chart */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">Cost Structure</h3>
                        <div className="h-[300px]">
                          {selectedOrder.totalCost > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsPieChart>
                                <Pie
                                  data={getCostBreakdownData(selectedOrder)}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                  outerRadius={120}
                                  fill="#8884d8"
                                  dataKey="value"
                                  nameKey="name"
                                >
                                  {getCostBreakdownData(selectedOrder).map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  formatter={(value: any) => [`₹${formatCurrency(value)}`, "Cost"]}
                                />
                                <Legend />
                              </RechartsPieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center text-muted-foreground">
                                <AlertCircle className="mx-auto h-8 w-8" />
                                <h3 className="mt-2">No cost data available</h3>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="flex justify-end border-t pt-4">
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    onClick={() => navigate(`/orders/${selectedOrder.order_id}`)}
                  >
                    View Order Details
                  </Button>
                </CardFooter>
              </Card>
            </>
          ) : (
            <>
              {/* Overview Charts */}
              <div className="grid gap-6 grid-cols-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Order Profitability Analysis
                    </CardTitle>
                    <CardDescription>Revenue, cost and profit margin by order</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    {orderChartData && orderChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={orderChartData.slice(0, 10)}
                          margin={{
                            top: 20, right: 30, left: 20, bottom: 60,
                          }}
                          onClick={(data) => data && data.activePayload && setSelectedOrderId(data.activePayload[0].payload.order_id)}
                          className="cursor-pointer"
                        >
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={50} />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: any, name: any) => [`₹${formatCurrency(Number(value))}`, name]}
                            labelFormatter={(value: any) => `Order: ${value}`}
                          />
                          <Legend />
                          <Bar dataKey="sellingPrice" name="Revenue" fill="#82ca9d" />
                          <Bar dataKey="totalCost" name="Cost" fill="#8884d8" />
                          <Bar dataKey="profit" name="Profit" fill="#ffc658">
                            {orderChartData.slice(0, 10).map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.profit > 0 ? '#4ade80' : '#f87171'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-muted-foreground">
                          <AlertCircle className="mx-auto h-8 w-8" />
                          <h3 className="mt-2">No order data available</h3>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Cost Structure Overview
                    </CardTitle>
                    <CardDescription>Breakdown of costs by category across orders</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    {orderChartData && orderChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={orderChartData.slice(0, 10).sort((a, b) => b.totalCost - a.totalCost)}
                          margin={{
                            top: 20, right: 30, left: 20, bottom: 60,
                          }}
                          onClick={(data) => data && data.activePayload && setSelectedOrderId(data.activePayload[0].payload.order_id)}
                          className="cursor-pointer"
                        >
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={50} />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: any) => [`₹${formatCurrency(Number(value))}`, "Cost"]}
                            labelFormatter={(value: any) => `Order: ${value}`}
                          />
                          <Legend />
                          <Bar dataKey="materialCost" name="Material Cost" stackId="a" fill="#8884d8" />
                          <Bar dataKey="productionCosts.cuttingCost" name="Cutting" stackId="a" fill="#82ca9d" />
                          <Bar dataKey="productionCosts.printingCost" name="Printing" stackId="a" fill="#ffc658" />
                          <Bar dataKey="productionCosts.stitchingCost" name="Stitching" stackId="a" fill="#ff8042" />
                          <Bar dataKey="productionCosts.transportCost" name="Transport" stackId="a" fill="#a4de6c" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-muted-foreground">
                          <AlertCircle className="mx-auto h-8 w-8" />
                          <h3 className="mt-2">No cost data available</h3>
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

export default OrderConsumption;
