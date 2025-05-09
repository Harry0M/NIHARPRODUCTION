
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
import { FileDown, PieChart, BarChart2, Package } from "lucide-react";
import { subMonths, formatISO } from "date-fns";
import { formatCurrency, formatQuantity } from "@/utils/analysisUtils";
import {
  PieChart as RechartPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from "recharts";

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

const MaterialConsumption = () => {
  const {
    materialConsumptionData,
    loading,
    fetchMaterialConsumptionData,
    generateMaterialConsumptionCSV,
  } = useInventoryAnalytics();

  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    from: subMonths(new Date(), 3),
    to: new Date(),
  });
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchMaterialConsumptionData(dateRange);
  }, [fetchMaterialConsumptionData, dateRange]);

  // Get the selected material details
  const materialDetail = materialConsumptionData.find(
    (material) => material.material_id === selectedMaterial
  );

  // Handle CSV download
  const handleDownloadCSV = () => {
    const csvContent = generateMaterialConsumptionCSV();
    if (!csvContent) return;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `material_consumption_${formatISO(new Date(), { representation: 'date' })}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Chart data preparation
  const prepareBarChartData = () => {
    if (!materialConsumptionData.length) return [];
    
    return materialConsumptionData
      .slice(0, 10)
      .map((material) => ({
        name: material.material_name,
        value: material.total_consumption,
        unit: material.unit,
      }));
  };

  const preparePieChartData = () => {
    if (!materialConsumptionData.length) return [];
    
    return materialConsumptionData
      .slice(0, 10)
      .map((material) => ({
        name: material.material_name,
        value: material.total_value,
        percentage: material.total_value / materialConsumptionData.reduce((sum, m) => sum + m.total_value, 0) * 100,
        unit: "₹",
      }));
  };

  const prepareOrderPieChartData = (materialId: string) => {
    const material = materialConsumptionData.find((m) => m.material_id === materialId);
    if (!material) return [];
    
    return material.usage_by_order.map((usage) => ({
      name: usage.order_number,
      value: usage.usage_quantity,
      percentage: usage.usage_percentage,
      unit: material.unit,
    }));
  };

  const prepareOrderValuePieChartData = (materialId: string) => {
    const material = materialConsumptionData.find((m) => m.material_id === materialId);
    if (!material) return [];
    
    return material.usage_by_order.map((usage) => ({
      name: usage.order_number,
      value: usage.usage_value,
      percentage: (usage.usage_value / material.total_value) * 100,
      unit: "₹",
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Material Consumption Analysis</h1>
          <p className="text-muted-foreground">
            Track how materials are used across different orders
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
          <TabsTrigger value="all">Materials List</TabsTrigger>
          {selectedMaterial && (
            <TabsTrigger value="detail">Material Detail</TabsTrigger>
          )}
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>
        
        {/* All Materials Tab */}
        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2" size={20} />
                Materials Consumption Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : materialConsumptionData.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No consumption data available for the selected period</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead className="text-right">Consumption</TableHead>
                        <TableHead className="text-right">Orders Count</TableHead>
                        <TableHead className="text-right">Total Value</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materialConsumptionData.map((material) => (
                        <TableRow 
                          key={material.material_id}
                          className={selectedMaterial === material.material_id ? "bg-muted/50" : ""}
                        >
                          <TableCell className="font-medium">{material.material_name}</TableCell>
                          <TableCell className="text-right">{formatQuantity(material.total_consumption, material.unit)}</TableCell>
                          <TableCell className="text-right">{material.orders_count}</TableCell>
                          <TableCell className="text-right">₹{formatCurrency(material.total_value)}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedMaterial(material.material_id);
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
        
        {/* Material Detail Tab */}
        <TabsContent value="detail" className="space-y-6">
          {materialDetail && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="mr-2" size={20} />
                    {materialDetail.material_name} Usage Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-muted-foreground">Total Consumption</h3>
                          <p className="text-2xl font-bold">{formatQuantity(materialDetail.total_consumption, materialDetail.unit)}</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-muted-foreground">Orders Using This Material</h3>
                          <p className="text-2xl font-bold">{materialDetail.orders_count}</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-muted-foreground">Total Value</h3>
                          <p className="text-2xl font-bold">₹{formatCurrency(materialDetail.total_value)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Usage by Order</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order #</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Percentage</TableHead>
                            <TableHead className="text-right">Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {materialDetail.usage_by_order.map((usage) => (
                            <TableRow key={usage.order_id}>
                              <TableCell className="font-medium">{usage.order_number}</TableCell>
                              <TableCell>{usage.company_name}</TableCell>
                              <TableCell className="text-right">
                                {formatQuantity(usage.usage_quantity, materialDetail.unit)}
                              </TableCell>
                              <TableCell className="text-right">
                                {usage.usage_percentage.toFixed(2)}%
                              </TableCell>
                              <TableCell className="text-right">
                                ₹{formatCurrency(usage.usage_value)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Usage Distribution</h3>
                      <div className="h-[350px]">
                        <Tabs defaultValue="quantity">
                          <TabsList className="mb-4">
                            <TabsTrigger value="quantity">By Quantity</TabsTrigger>
                            <TabsTrigger value="value">By Value</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="quantity">
                            <ResponsiveContainer width="100%" height={300}>
                              <RechartPieChart>
                                <Pie
                                  data={prepareOrderPieChartData(materialDetail.material_id)}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={100}
                                  innerRadius={60}
                                  paddingAngle={1}
                                  dataKey="value"
                                  nameKey="name"
                                  label={({ name, percent }) => 
                                    percent > 0.05 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''
                                  }
                                >
                                  {prepareOrderPieChartData(materialDetail.material_id).map((entry, index) => (
                                    <Cell 
                                      key={`cell-${index}`} 
                                      fill={generateColors(materialDetail.usage_by_order.length)[index % generateColors(materialDetail.usage_by_order.length).length]}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                              </RechartPieChart>
                            </ResponsiveContainer>
                          </TabsContent>
                          
                          <TabsContent value="value">
                            <ResponsiveContainer width="100%" height={300}>
                              <RechartPieChart>
                                <Pie
                                  data={prepareOrderValuePieChartData(materialDetail.material_id)}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={100}
                                  innerRadius={60}
                                  paddingAngle={1}
                                  dataKey="value"
                                  nameKey="name"
                                  label={({ name, percent }) => 
                                    percent > 0.05 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''
                                  }
                                >
                                  {prepareOrderValuePieChartData(materialDetail.material_id).map((entry, index) => (
                                    <Cell 
                                      key={`cell-${index}`} 
                                      fill={generateColors(materialDetail.usage_by_order.length)[index % generateColors(materialDetail.usage_by_order.length).length]}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                              </RechartPieChart>
                            </ResponsiveContainer>
                          </TabsContent>
                        </Tabs>
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
            {/* Top Materials by Consumption */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart2 className="mr-2" size={20} />
                  Top Materials by Consumption
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
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar
                        dataKey="value"
                        name="Consumption"
                        fill="#0ea5e9"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Materials by Value */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="mr-2" size={20} />
                  Materials by Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartPieChart>
                      <Pie
                        data={preparePieChartData()}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        innerRadius={70}
                        paddingAngle={1}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => 
                          percent > 0.05 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''
                        }
                      >
                        {preparePieChartData().map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={generateColors(materialConsumptionData.length)[index % generateColors(materialConsumptionData.length).length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </RechartPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MaterialConsumption;
