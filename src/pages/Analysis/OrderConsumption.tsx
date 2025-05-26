
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Search, Download, Filter, Calendar, Package, TrendingUp } from "lucide-react";
import { useInventoryAnalytics } from "@/hooks/analysis/useInventoryAnalytics";
import { LoadingSpinner } from "@/components/production/LoadingSpinner";
import { formatCurrency } from "@/utils/analysisUtils";

export const OrderConsumption = () => {
  const {
    orderConsumptionData,
    filters,
    updateFilters,
    isLoading
  } = useInventoryAnalytics();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("usage_date");
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [selectedMaterial, setSelectedMaterial] = useState("all");

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Get unique materials for filter
  const uniqueMaterials = useMemo(() => {
    const materials = Array.from(new Set(orderConsumptionData.map(item => item.material_name)));
    return materials.sort();
  }, [orderConsumptionData]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    return orderConsumptionData
      .filter(item => {
        const matchesSearch = 
          item.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.material_name.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesMaterial = selectedMaterial === "all" || item.material_name === selectedMaterial;
        
        return matchesSearch && matchesMaterial;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "usage_date":
            return new Date(b.usage_date).getTime() - new Date(a.usage_date).getTime();
          case "total_material_used":
            return b.total_material_used - a.total_material_used;
          case "order_number":
            return a.order_number.localeCompare(b.order_number);
          case "company_name":
            return a.company_name.localeCompare(b.company_name);
          default:
            return 0;
        }
      });
  }, [orderConsumptionData, searchTerm, selectedMaterial, sortBy]);

  // Calculate statistics
  const totalConsumption = filteredData.reduce((sum, item) => sum + item.total_material_used, 0);
  const uniqueOrders = new Set(filteredData.map(item => item.order_id)).size;
  const uniqueCompanies = new Set(filteredData.map(item => item.company_name)).size;
  const avgConsumptionPerOrder = uniqueOrders > 0 ? totalConsumption / uniqueOrders : 0;

  // Prepare chart data - consumption over time
  const consumptionByDate = useMemo(() => {
    const grouped = filteredData.reduce((acc, item) => {
      const date = new Date(item.usage_date).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { date, total: 0, orders: new Set() };
      }
      acc[date].total += item.total_material_used;
      acc[date].orders.add(item.order_id);
      return acc;
    }, {} as Record<string, { date: string; total: number; orders: Set<string> }>);

    return Object.values(grouped)
      .map(item => ({
        date: item.date,
        consumption: item.total,
        orders: item.orders.size
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 data points
  }, [filteredData]);

  // Top materials by consumption
  const materialConsumption = useMemo(() => {
    const grouped = filteredData.reduce((acc, item) => {
      if (!acc[item.material_name]) {
        acc[item.material_name] = 0;
      }
      acc[item.material_name] += item.total_material_used;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, consumption]) => ({ name, consumption }))
      .sort((a, b) => b.consumption - a.consumption)
      .slice(0, 10);
  }, [filteredData]);

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
        <h1 className="text-3xl font-bold">Order Material Consumption</h1>
        <p className="text-muted-foreground">
          Detailed breakdown of material usage per order and company
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
              Units consumed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Processed</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueOrders}</div>
            <p className="text-xs text-muted-foreground">
              Unique orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueCompanies}</div>
            <p className="text-xs text-muted-foreground">
              Active companies
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
                placeholder="Search orders, companies, or materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Materials</SelectItem>
                {uniqueMaterials.map(material => (
                  <SelectItem key={material} value={material}>{material}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usage_date">Date</SelectItem>
                <SelectItem value="total_material_used">Consumption</SelectItem>
                <SelectItem value="order_number">Order Number</SelectItem>
                <SelectItem value="company_name">Company</SelectItem>
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
            <CardTitle>Consumption Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            {consumptionByDate.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={consumptionByDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value.toFixed(2), 'Consumption']} />
                  <Line type="monotone" dataKey="consumption" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
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
            <CardTitle>Top Materials by Consumption</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            {materialConsumption.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={materialConsumption}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => [value.toFixed(2), 'Consumption']} />
                  <Bar dataKey="consumption" fill="#82ca9d" />
                </BarChart>
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
          <CardTitle>Order Consumption Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Order</th>
                  <th className="text-left p-2">Company</th>
                  <th className="text-left p-2">Material</th>
                  <th className="text-left p-2">Component</th>
                  <th className="text-right p-2">Consumption</th>
                  <th className="text-left p-2">Unit</th>
                  <th className="text-left p-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={`${item.order_id}-${item.material_id}-${index}`} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{item.order_number}</td>
                    <td className="p-2">{item.company_name}</td>
                    <td className="p-2">{item.material_name}</td>
                    <td className="p-2">
                      <Badge variant="outline">{item.component_type}</Badge>
                    </td>
                    <td className="p-2 text-right font-mono">{item.total_material_used.toFixed(2)}</td>
                    <td className="p-2">{item.unit}</td>
                    <td className="p-2">{new Date(item.usage_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No consumption data found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
