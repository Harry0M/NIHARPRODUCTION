
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useInventoryAnalytics } from "@/hooks/analysis/useInventoryAnalytics";
import { formatCurrency, formatQuantity, formatAnalysisDate } from "@/utils/analysisUtils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, BarChart as BarChartIcon, AlertCircle, FileText, Package, PieChart, TrendingUp, DollarSign, ShoppingBag, Building2, FileDown, TrendingDown } from "lucide-react";
import { LoadingSpinner } from "@/components/production/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Separator } from "@/components/ui/separator";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell, PieChart as RechartsPieChart, Pie } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartTooltip
} from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const OrderConsumption = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("profit-desc");
  const { orderConsumptionData, filters, updateFilters, isLoading } = useInventoryAnalytics();
  
  // Fetch order details for cost calculations
  const { data: orderDetails, isLoading: loadingOrderDetails } = useQuery({
    queryKey: ['order-details-for-analysis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, 
          order_number, 
          company_name, 
          order_date, 
          order_status, 
          quantity, 
          delivery_date,
          catalog_id,
          catalog:catalog_id (
            id,
            name,
            selling_rate,
            total_cost
          )
        `);
      
      if (error) throw error;
      return data || [];
    }
  });
  
  // Filter data based on search (by order number or company name)
  const filteredData = searchQuery
    ? orderConsumptionData?.filter(item => 
        item.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.material_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : orderConsumptionData;
    
  // Group by order for visualization and analysis
  const orderChartData = filteredData?.reduce((acc: any[], item) => {
    const existingOrder = acc.find(o => o.order_id === item.order_id);
    
    // Get the complete order details including quantity and product costs
    const completeOrderDetails = orderDetails?.find(o => o.id === item.order_id);
    const orderQuantity = completeOrderDetails?.quantity || 0;
    const productCost = completeOrderDetails?.catalog?.total_cost || 0;
    const sellingRate = completeOrderDetails?.catalog?.selling_rate || 0;
    
    // Calculate total cost and profit
    const totalCost = productCost * orderQuantity;
    const materialCost = Number(item.total_material_used || 0) * (item.purchase_price || 0);
    const totalRevenue = sellingRate * orderQuantity;
    const profit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    
    if (existingOrder) {
      existingOrder.usage += Number(item.total_material_used || 0);
      existingOrder.materialValue += Number(item.total_material_used || 0) * (item.purchase_price || 0);
      
      // Add this material to the materials array if not already present
      const existingMaterial = existingOrder.materials.find((m: any) => m.material_id === item.material_id);
      if (!existingMaterial && item.material_id) {
        existingOrder.materials.push({
          material_id: item.material_id,
          material_name: item.material_name,
          quantity: Number(item.total_material_used || 0),
          unit: item.unit || 'units',
          value: Number(item.total_material_used || 0) * (item.purchase_price || 0),
          purchase_price: item.purchase_price || 0,
          component_type: item.component_type || 'Unknown'
        });
      } else if (existingMaterial) {
        existingMaterial.quantity += Number(item.total_material_used || 0);
        existingMaterial.value += Number(item.total_material_used || 0) * (item.purchase_price || 0);
      }
    } else {
      const materials = [];
      if (item.material_id) {
        materials.push({
          material_id: item.material_id,
          material_name: item.material_name,
          quantity: Number(item.total_material_used || 0),
          unit: item.unit || 'units',
          value: Number(item.total_material_used || 0) * (item.purchase_price || 0),
          purchase_price: item.purchase_price || 0,
          component_type: item.component_type || 'Unknown'
        });
      }
      
      acc.push({
        order_id: item.order_id,
        name: item.order_number,
        company: item.company_name,
        usage: Number(item.total_material_used || 0),
        date: item.usage_date ? new Date(item.usage_date) : null,
        materials: materials,
        materialValue: Number(item.total_material_used || 0) * (item.purchase_price || 0),
        orderQuantity: orderQuantity,
        productCost: productCost,
        sellingRate: sellingRate,
        totalCost: totalCost,
        totalRevenue: totalRevenue,
        profit: profit,
        profitMargin: profitMargin,
        productName: completeOrderDetails?.catalog?.name || 'Unknown Product',
      });
    }
    return acc;
  }, []);

  // Apply sorting
  const sortedOrderChartData = [...(orderChartData || [])].sort((a, b) => {
    switch (sortBy) {
      case 'profit-desc':
        return b.profit - a.profit;
      case 'profit-asc':
        return a.profit - b.profit;
      case 'revenue-desc':
        return b.totalRevenue - a.totalRevenue;
      case 'revenue-asc':
        return a.totalRevenue - b.totalRevenue;
      case 'margin-desc':
        return b.profitMargin - a.profitMargin;
      case 'margin-asc':
        return a.profitMargin - b.profitMargin;
      case 'date-desc':
        return b.date && a.date ? b.date.getTime() - a.date.getTime() : 0;
      case 'date-asc':
        return a.date && b.date ? a.date.getTime() - b.date.getTime() : 0;
      default:
        return 0;
    }
  });
  
  // Get details of selected order
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
    materialValue: material.value,
    price: material.purchase_price
  }));

  // Group materials by component type
  const materialsByType = sortedMaterials.reduce((acc: any, material: any) => {
    const type = material.component_type || 'Unknown';
    if (!acc[type]) {
      acc[type] = {
        type,
        value: 0,
        materials: []
      };
    }
    acc[type].value += material.value;
    acc[type].materials.push(material);
    return acc;
  }, {});

  const componentTypeData = Object.values(materialsByType);
  
  // Generate a CSV of order material usage
  const generateOrderCSV = () => {
    if (!selectedOrder || !selectedOrder.materials.length) return;
    
    // CSV header
    let csvContent = "Material Name,Component Type,Quantity,Unit,Unit Price (₹),Total Value (₹)\r\n";
    
    // Add rows
    selectedOrder.materials.forEach((material: any) => {
      const row = [
        `"${material.material_name}"`,
        `"${material.component_type}"`,
        material.quantity.toFixed(2),
        material.unit,
        material.purchase_price.toFixed(2),
        material.value.toFixed(2)
      ];
      csvContent += row.join(',') + "\r\n";
    });
    
    // Add summary
    csvContent += "\r\nSummary\r\n";
    csvContent += `"Material Cost",${selectedOrder.materialValue.toFixed(2)}\r\n`;
    csvContent += `"Production Cost",${(selectedOrder.totalCost - selectedOrder.materialValue).toFixed(2)}\r\n`;
    csvContent += `"Total Cost",${selectedOrder.totalCost.toFixed(2)}\r\n`;
    csvContent += `"Total Revenue",${selectedOrder.totalRevenue.toFixed(2)}\r\n`;
    csvContent += `"Profit",${selectedOrder.profit.toFixed(2)}\r\n`;
    csvContent += `"Profit Margin",${selectedOrder.profitMargin.toFixed(2)}%\r\n`;
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Order_${selectedOrder.name}_Analysis.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Colors for the chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff7300', '#a05195', '#d45087', '#2f4b7c'];
  
  if (isLoading || loadingOrderDetails) {
    return <LoadingSpinner />;
  }

  // Calculate summary values
  const totalProfit = sortedOrderChartData?.reduce((sum, order) => sum + order.profit, 0) || 0;
  const totalRevenue = sortedOrderChartData?.reduce((sum, order) => sum + order.totalRevenue, 0) || 0;
  const totalMaterialValue = sortedOrderChartData?.reduce((sum, order) => sum + order.materialValue, 0) || 0;
  const averageMargin = sortedOrderChartData?.length ? 
    sortedOrderChartData.reduce((sum, order) => sum + order.profitMargin, 0) / sortedOrderChartData.length : 0;

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
          Analyze material usage, costs, and profitability by order
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
            <div className="w-full md:w-[200px]">
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sort order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profit-desc">Profit (High to Low)</SelectItem>
                  <SelectItem value="profit-asc">Profit (Low to High)</SelectItem>
                  <SelectItem value="revenue-desc">Revenue (High to Low)</SelectItem>
                  <SelectItem value="revenue-asc">Revenue (Low to High)</SelectItem>
                  <SelectItem value="margin-desc">Margin % (High to Low)</SelectItem>
                  <SelectItem value="margin-asc">Margin % (Low to High)</SelectItem>
                  <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                  <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <p className="text-sm text-muted-foreground flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                Total Revenue
              </p>
              <h3 className="text-2xl font-bold mt-1">{formatCurrency(totalRevenue)}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <p className="text-sm text-muted-foreground flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                Total Profit
              </p>
              <h3 className={`text-2xl font-bold mt-1 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalProfit)}
              </h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <p className="text-sm text-muted-foreground flex items-center">
                <PercentIcon className="h-4 w-4 mr-1" />
                Average Margin
              </p>
              <h3 className={`text-2xl font-bold mt-1 ${averageMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {averageMargin.toFixed(1)}%
              </h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <p className="text-sm text-muted-foreground flex items-center">
                <Package className="h-4 w-4 mr-1" />
                Material Cost
              </p>
              <h3 className="text-2xl font-bold mt-1">
                {formatCurrency(totalMaterialValue)}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side - Orders List */}
        <div className="md:col-span-1 space-y-6">
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
              <ScrollArea className="h-[600px] w-full">
                <div className="p-0">
                  {sortedOrderChartData && sortedOrderChartData.length > 0 ? (
                    sortedOrderChartData.map((order) => (
                      <div 
                        key={order.order_id}
                        className={`flex items-center justify-between p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedOrderId === order.order_id ? 'bg-muted' : ''}`}
                        onClick={() => setSelectedOrderId(order.order_id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate flex items-center gap-2">
                            {order.name}
                            {order.profit > 0 ? (
                              <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-600">+{order.profitMargin.toFixed(1)}%</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-red-50 border-red-200 text-red-600">{order.profitMargin.toFixed(1)}%</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">{order.company}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${order.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{formatCurrency(order.profit)}
                          </div>
                          <div className="text-sm text-muted-foreground">{order.date ? formatAnalysisDate(order.date.toISOString()) : '-'}</div>
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
        
        {/* Right Side - Order Details or Charts */}
        <div className="md:col-span-2 space-y-6">
          {selectedOrder ? (
            <>
              {/* Order Detail Card */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">Order {selectedOrder.name}</CardTitle>
                      <CardDescription>
                        {selectedOrder.company} • {selectedOrder.productName}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={generateOrderCSV}
                        disabled={!selectedOrder.materials.length}
                      >
                        <FileDown className="h-4 w-4 mr-1" />
                        Export
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
                    <Card>
                      <CardContent className="pt-6 pb-6">
                        <div className="text-sm text-muted-foreground">Order Quantity</div>
                        <div className="text-2xl font-bold mt-1">{selectedOrder.orderQuantity}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 pb-6">
                        <div className="text-sm text-muted-foreground">Total Revenue</div>
                        <div className="text-2xl font-bold mt-1">₹{formatCurrency(selectedOrder.totalRevenue)}</div>
                      </CardContent>
                    </Card>
                    <Card className={`${selectedOrder.profit > 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                      <CardContent className="pt-6 pb-6">
                        <div className="text-sm text-muted-foreground">Profit</div>
                        <div className="flex items-center gap-2">
                          <div className="text-2xl font-bold mt-1">₹{formatCurrency(selectedOrder.profit)}</div>
                          {selectedOrder.profit > 0 ? (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div className="text-sm">{selectedOrder.profitMargin.toFixed(1)}% margin</div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Tabs defaultValue="materials">
                    <TabsList className="mb-4">
                      <TabsTrigger value="materials">Material Breakdown</TabsTrigger>
                      <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
                      <TabsTrigger value="chart">Material Distribution</TabsTrigger>
                      <TabsTrigger value="components">Component Types</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="materials" className="space-y-4">
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Material</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead className="text-right">Quantity</TableHead>
                              <TableHead className="text-right">Unit Price</TableHead>
                              <TableHead className="text-right">Value</TableHead>
                              <TableHead className="text-right">% of Cost</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedMaterials.length > 0 ? (
                              sortedMaterials.map((material: any) => (
                                <TableRow key={material.material_id}>
                                  <TableCell className="font-medium">{material.material_name}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="font-normal">
                                      {material.component_type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">{material.quantity.toFixed(2)} {material.unit}</TableCell>
                                  <TableCell className="text-right">₹{formatCurrency(material.purchase_price)}</TableCell>
                                  <TableCell className="text-right">₹{formatCurrency(material.value)}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <span>{selectedOrder.materialValue ? ((material.value / selectedOrder.materialValue) * 100).toFixed(1) : 0}%</span>
                                      <div className="w-16">
                                        <Progress value={selectedOrder.materialValue ? ((material.value / selectedOrder.materialValue) * 100) : 0} className="h-2" />
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                  No material data available for this order
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="costs" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-muted/5">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Cost Breakdown</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span>Material Costs</span>
                                <span className="font-medium">₹{formatCurrency(selectedOrder.materialValue)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Other Production Costs</span>
                                <span className="font-medium">₹{formatCurrency(selectedOrder.totalCost - selectedOrder.materialValue)}</span>
                              </div>
                              <Separator />
                              <div className="flex justify-between items-center">
                                <span>Total Production Cost</span>
                                <span className="font-medium">₹{formatCurrency(selectedOrder.totalCost)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Per Unit Cost</span>
                                <span className="font-medium">₹{formatCurrency(selectedOrder.productCost)}</span>
                              </div>
                            </div>

                            <div className="mt-6 pt-4 border-t">
                              <div className="flex mb-1 text-sm text-muted-foreground">Cost Distribution</div>
                              <div className="h-16">
                                <ChartContainer 
                                  config={{
                                    materials: {
                                      label: "Materials",
                                      theme: {
                                        light: "#0088FE",
                                        dark: "#0088FE"
                                      }
                                    },
                                    other: {
                                      label: "Other",
                                      theme: {
                                        light: "#00C49F",
                                        dark: "#00C49F"
                                      }
                                    }
                                  }}
                                >
                                  <RechartsPieChart width={300} height={60}>
                                    <Pie
                                      data={[
                                        { name: 'Materials', value: selectedOrder.materialValue },
                                        { name: 'Other', value: selectedOrder.totalCost - selectedOrder.materialValue }
                                      ]}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={15}
                                      outerRadius={30}
                                      paddingAngle={5}
                                      dataKey="value"
                                    >
                                      <Cell fill="#0088FE" />
                                      <Cell fill="#00C49F" />
                                    </Pie>
                                  </RechartsPieChart>
                                </ChartContainer>
                              </div>
                              <div className="grid grid-cols-2 text-xs mt-1">
                                <div className="flex items-center">
                                  <div className="w-2 h-2 rounded-full bg-[#0088FE] mr-1"></div>
                                  <span>Materials: {((selectedOrder.materialValue / selectedOrder.totalCost) * 100).toFixed(1)}%</span>
                                </div>
                                <div className="flex items-center">
                                  <div className="w-2 h-2 rounded-full bg-[#00C49F] mr-1"></div>
                                  <span>Other: {(((selectedOrder.totalCost - selectedOrder.materialValue) / selectedOrder.totalCost) * 100).toFixed(1)}%</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-muted/5">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Revenue & Profit</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span>Selling Rate (Per Unit)</span>
                                <span className="font-medium">₹{formatCurrency(selectedOrder.sellingRate)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Order Quantity</span>
                                <span className="font-medium">{selectedOrder.orderQuantity}</span>
                              </div>
                              <Separator />
                              <div className="flex justify-between items-center">
                                <span>Total Revenue</span>
                                <span className="font-medium">₹{formatCurrency(selectedOrder.totalRevenue)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Total Cost</span>
                                <span className="font-medium">₹{formatCurrency(selectedOrder.totalCost)}</span>
                              </div>
                              <Separator />
                              <div className="flex justify-between items-center">
                                <span>Profit</span>
                                <span className={`font-medium ${selectedOrder.profit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  ₹{formatCurrency(selectedOrder.profit)} ({selectedOrder.profitMargin.toFixed(1)}%)
                                </span>
                              </div>
                            </div>

                            <div className="mt-6 pt-4 border-t">
                              <div className="flex mb-1 text-sm text-muted-foreground">Profit Analysis</div>
                              <div className="h-16">
                                <ChartContainer 
                                  config={{
                                    profit: {
                                      label: "Profit",
                                      theme: {
                                        light: selectedOrder.profit > 0 ? "#4ade80" : "#f87171",
                                        dark: selectedOrder.profit > 0 ? "#4ade80" : "#f87171"
                                      }
                                    },
                                    cost: {
                                      label: "Cost",
                                      theme: {
                                        light: "#94a3b8", 
                                        dark: "#64748b"
                                      }
                                    }
                                  }}
                                >
                                  <BarChart
                                    layout="vertical"
                                    width={300}
                                    height={60}
                                    data={[
                                      {
                                        name: 'Order',
                                        cost: selectedOrder.totalCost,
                                        profit: selectedOrder.profit > 0 ? selectedOrder.profit : 0,
                                        loss: selectedOrder.profit < 0 ? Math.abs(selectedOrder.profit) : 0
                                      }
                                    ]}
                                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                                  >
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" hide />
                                    <Bar dataKey="cost" fill="#94a3b8" name="Cost" stackId="a" />
                                    {selectedOrder.profit > 0 ? (
                                      <Bar dataKey="profit" fill="#4ade80" name="Profit" stackId="a" />
                                    ) : (
                                      <Bar dataKey="loss" fill="#f87171" name="Loss" stackId="a" />
                                    )}
                                  </BarChart>
                                </ChartContainer>
                              </div>
                              <div className="grid grid-cols-2 text-xs mt-1">
                                <div className="flex items-center">
                                  <div className="w-2 h-2 rounded-full bg-gray-400 mr-1"></div>
                                  <span>Cost: {formatCurrency(selectedOrder.totalCost)}</span>
                                </div>
                                <div className="flex items-center">
                                  <div className={`w-2 h-2 rounded-full mr-1 ${selectedOrder.profit > 0 ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                  <span>{selectedOrder.profit > 0 ? 'Profit' : 'Loss'}: {formatCurrency(Math.abs(selectedOrder.profit))}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Card className="bg-muted/5">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Unit Economics</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-3 gap-6">
                            <div>
                              <h4 className="text-sm font-medium mb-2">Per Unit Cost</h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>Material Cost:</div>
                                <div className="text-right">₹{formatCurrency(selectedOrder.materialValue / selectedOrder.orderQuantity)}</div>
                                
                                <div>Other Production:</div>
                                <div className="text-right">₹{formatCurrency((selectedOrder.totalCost - selectedOrder.materialValue) / selectedOrder.orderQuantity)}</div>
                                
                                <Separator className="col-span-2 my-1" />
                                
                                <div className="font-medium">Total Unit Cost:</div>
                                <div className="text-right font-medium">₹{formatCurrency(selectedOrder.totalCost / selectedOrder.orderQuantity)}</div>
                              </div>
                            </div>
                            
                            <div className="md:border-l md:pl-6">
                              <h4 className="text-sm font-medium mb-2">Per Unit Revenue</h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>Selling Price:</div>
                                <div className="text-right">₹{formatCurrency(selectedOrder.sellingRate)}</div>
                                
                                <Separator className="col-span-2 my-1" />
                                
                                <div className="font-medium">Unit Profit:</div>
                                <div className={`text-right font-medium ${selectedOrder.profit / selectedOrder.orderQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ₹{formatCurrency(selectedOrder.profit / selectedOrder.orderQuantity)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="md:border-l md:pl-6">
                              <h4 className="text-sm font-medium mb-2">Profit Metrics</h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>Profit Margin:</div>
                                <div className={`text-right ${selectedOrder.profitMargin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {selectedOrder.profitMargin.toFixed(1)}%
                                </div>
                                
                                <div>Markup on Cost:</div>
                                <div className={`text-right ${(selectedOrder.sellingRate / selectedOrder.productCost - 1) * 100 > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {((selectedOrder.sellingRate / selectedOrder.productCost - 1) * 100).toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="chart" className="space-y-4">
                      <div className="h-[400px] border rounded-lg p-4">
                        {materialDistributionData.length > 0 ? (
                          <ChartContainer 
                            config={{
                              material: {
                                label: "Material Usage",
                                theme: {
                                  light: "#8884d8",
                                  dark: "#8884d8"
                                }
                              }
                            }}
                          >
                            <RechartsPieChart>
                              <Pie
                                data={materialDistributionData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name.length > 15 ? name.substring(0, 15) + '...' : name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={150}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                              >
                                {materialDistributionData.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Legend />
                            </RechartsPieChart>
                          </ChartContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center text-muted-foreground">
                              <AlertCircle className="mx-auto h-8 w-8" />
                              <h3 className="mt-2">No material data available for this order</h3>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Material Distribution by Value</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {materialDistributionData
                                .sort((a: any, b: any) => b.materialValue - a.materialValue)
                                .slice(0, 5)
                                .map((material: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
                                    />
                                    <span className="text-sm truncate max-w-[180px]">{material.name}</span>
                                  </div>
                                  <div className="text-sm font-medium">₹{formatCurrency(material.materialValue)}</div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Material Distribution by Quantity</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {materialDistributionData
                                .sort((a: any, b: any) => b.value - a.value)
                                .slice(0, 5)
                                .map((material: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-3 h-3 rounded-full" 
                                      style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
                                    />
                                    <span className="text-sm truncate max-w-[180px]">{material.name}</span>
                                  </div>
                                  <div className="text-sm font-medium">{material.value.toFixed(2)} {material.unit}</div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="components" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Material Value by Component Type</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[300px]">
                              {componentTypeData.length > 0 ? (
                                <ChartContainer 
                                  config={{
                                    value: {
                                      label: "Value",
                                      theme: {
                                        light: "#0088FE",
                                        dark: "#0088FE"
                                      }
                                    }
                                  }}
                                >
                                  <BarChart
                                    data={componentTypeData.map((item: any) => ({
                                      name: item.type,
                                      value: item.value
                                    }))}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                                  >
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                                    <YAxis />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="value" name="Value" fill="#0088FE">
                                      {componentTypeData.map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ChartContainer>
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <div className="text-center text-muted-foreground">
                                    <AlertCircle className="mx-auto h-8 w-8" />
                                    <h3 className="mt-2">No component data available</h3>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        <div>
                          {Object.values(materialsByType).map((typeGroup: any, idx) => (
                            <Accordion
                              key={idx}
                              type="single"
                              collapsible
                              className="mb-2"
                            >
                              <AccordionItem value={typeGroup.type}>
                                <AccordionTrigger className="py-2">
                                  <div className="flex justify-between items-center w-full pr-4">
                                    <span className="font-medium">
                                      {typeGroup.type} 
                                      <span className="text-xs ml-1">({typeGroup.materials.length} items)</span>
                                    </span>
                                    <span>₹{formatCurrency(typeGroup.value)}</span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="rounded-md border overflow-hidden">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Material</TableHead>
                                          <TableHead className="text-right">Quantity</TableHead>
                                          <TableHead className="text-right">Value</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {typeGroup.materials.map((material: any) => (
                                          <TableRow key={material.material_id}>
                                            <TableCell>{material.material_name}</TableCell>
                                            <TableCell className="text-right">{material.quantity.toFixed(2)} {material.unit}</TableCell>
                                            <TableCell className="text-right">₹{formatCurrency(material.value)}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          ))}
                        </div>
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
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Order Profitability Analysis
                    </CardTitle>
                    <CardDescription>Revenue, cost and profit margin by order</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    {sortedOrderChartData && sortedOrderChartData.length > 0 ? (
                      <ChartContainer 
                        config={{
                          revenue: {
                            label: "Revenue",
                            theme: {
                              light: "#82ca9d",
                              dark: "#82ca9d"
                            }
                          },
                          cost: {
                            label: "Cost",
                            theme: {
                              light: "#8884d8",
                              dark: "#8884d8"
                            }
                          },
                          profit: {
                            label: "Profit",
                            theme: {
                              light: "#ffc658",
                              dark: "#ffc658"
                            }
                          }
                        }}
                      >
                        <BarChart
                          data={sortedOrderChartData.slice(0, 10)}
                          margin={{
                            top: 20, right: 30, left: 20, bottom: 60,
                          }}
                          onClick={(data) => data && data.activePayload && setSelectedOrderId(data.activePayload[0].payload.order_id)}
                          className="cursor-pointer"
                        >
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={50} />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                          <Bar dataKey="totalRevenue" name="Revenue" fill="#82ca9d" />
                          <Bar dataKey="totalCost" name="Cost" fill="#8884d8" />
                          <Bar dataKey="profit" name="Profit" fill="#ffc658">
                            {sortedOrderChartData.slice(0, 10).map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.profit > 0 ? '#4ade80' : '#f87171'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ChartContainer>
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
                      Profit Margin by Order
                    </CardTitle>
                    <CardDescription>Profit margin percentage for each order</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    {sortedOrderChartData && sortedOrderChartData.length > 0 ? (
                      <ChartContainer 
                        config={{
                          margin: {
                            label: "Profit Margin",
                            theme: {
                              light: "#0088FE",
                              dark: "#0088FE"
                            }
                          }
                        }}
                      >
                        <BarChart
                          layout="vertical"
                          data={sortedOrderChartData.slice(0, 10).sort((a, b) => b.profitMargin - a.profitMargin)}
                          margin={{
                            top: 5, right: 30, left: 120, bottom: 5,
                          }}
                          onClick={(data) => data && data.activePayload && setSelectedOrderId(data.activePayload[0].payload.order_id)}
                          className="cursor-pointer"
                        >
                          <XAxis type="number" domain={['dataMin', 'dataMax']} />
                          <YAxis dataKey="name" type="category" width={100} />
                          <ChartTooltip 
                            formatter={(value) => [`${value.toFixed(1)}%`, 'Profit Margin']}
                            labelFormatter={(name) => `Order: ${name}`}
                          />
                          <Legend />
                          <Bar dataKey="profitMargin" name="Profit Margin %" fill="#0088FE">
                            {sortedOrderChartData.slice(0, 10).sort((a, b) => b.profitMargin - a.profitMargin).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.profitMargin > 0 ? '#4ade80' : '#f87171'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-muted-foreground">
                          <AlertCircle className="mx-auto h-8 w-8" />
                          <h3 className="mt-2">No order margin data available</h3>
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
