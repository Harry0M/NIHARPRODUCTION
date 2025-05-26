
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { AlertTriangle, Package, TrendingDown, Search, Download, ShoppingCart } from "lucide-react";
import { useInventoryAnalytics } from "@/hooks/analysis/useInventoryAnalytics";
import { LoadingSpinner } from "@/components/production/LoadingSpinner";
import { formatCurrency } from "@/utils/analysisUtils";

export const RefillAnalysis = () => {
  const {
    inventoryData,
    inventoryValueData,
    refillNeedsData,
    isLoading
  } = useInventoryAnalytics();

  const [searchTerm, setSearchTerm] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("urgency");

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Process inventory data to determine refill needs
  const processedInventoryData = useMemo(() => {
    return inventoryData
      .filter(item => item.min_stock_level && item.min_stock_level > 0)
      .map(item => {
        const stockRatio = item.quantity / (item.min_stock_level || 1);
        const needsRefill = item.quantity <= (item.min_stock_level || 0);
        
        let urgency: 'critical' | 'warning' | 'normal' = 'normal';
        if (stockRatio <= 0.2) urgency = 'critical';
        else if (stockRatio <= 0.5) urgency = 'warning';
        
        return {
          ...item,
          needsRefill,
          urgency,
          stockRatio,
          shortage: Math.max(0, (item.min_stock_level || 0) - item.quantity),
          estimatedCost: item.shortage * (item.purchase_rate || 0)
        };
      });
  }, [inventoryData]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    return processedInventoryData
      .filter(item => {
        const matchesSearch = item.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (item.color && item.color.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesUrgency = urgencyFilter === "all" || 
                              (urgencyFilter === "needs_refill" && item.needsRefill) ||
                              item.urgency === urgencyFilter;
        
        return matchesSearch && matchesUrgency;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "urgency":
            const urgencyOrder = { critical: 0, warning: 1, normal: 2 };
            return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
          case "shortage":
            return b.shortage - a.shortage;
          case "stock_ratio":
            return a.stockRatio - b.stockRatio;
          case "material_name":
            return a.material_name.localeCompare(b.material_name);
          default:
            return 0;
        }
      });
  }, [processedInventoryData, searchTerm, urgencyFilter, sortBy]);

  // Calculate statistics
  const criticalItems = processedInventoryData.filter(item => item.urgency === 'critical').length;
  const warningItems = processedInventoryData.filter(item => item.urgency === 'warning').length;
  const totalRefillCost = processedInventoryData
    .filter(item => item.needsRefill)
    .reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
  const totalItemsNeedingRefill = processedInventoryData.filter(item => item.needsRefill).length;

  // Chart data
  const urgencyDistribution = [
    { name: 'Critical', value: criticalItems, fill: '#ef4444' },
    { name: 'Warning', value: warningItems, fill: '#f59e0b' },
    { name: 'Normal', value: processedInventoryData.length - criticalItems - warningItems, fill: '#10b981' }
  ];

  const topShortages = filteredData
    .filter(item => item.needsRefill)
    .slice(0, 10)
    .map(item => ({
      name: item.material_name.substring(0, 20) + '...',
      shortage: item.shortage,
      cost: item.estimatedCost || 0
    }));

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'default';
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'Critical';
      case 'warning': return 'Warning';
      default: return 'Normal';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1.5">
        <h1 className="text-3xl font-bold">Inventory Refill Analysis</h1>
        <p className="text-muted-foreground">
          Monitor stock levels and identify materials that need replenishment
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalItems}</div>
            <p className="text-xs text-muted-foreground">
              Immediate attention required
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warning Items</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{warningItems}</div>
            <p className="text-xs text-muted-foreground">
              Need refill soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refill Cost</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRefillCost)}</div>
            <p className="text-xs text-muted-foreground">
              Estimated cost to refill
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Needing Refill</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItemsNeedingRefill}</div>
            <p className="text-xs text-muted-foreground">
              Out of {processedInventoryData.length} tracked
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
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="needs_refill">Needs Refill</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgency">Urgency</SelectItem>
                <SelectItem value="shortage">Shortage</SelectItem>
                <SelectItem value="stock_ratio">Stock Ratio</SelectItem>
                <SelectItem value="material_name">Name</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stock Level Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {urgencyDistribution.some(item => item.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={urgencyDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {urgencyDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No stock level data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Shortages</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {topShortages.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topShortages}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => [value.toFixed(2), 'Shortage']} />
                  <Bar dataKey="shortage" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No shortage data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Refill Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Material</th>
                  <th className="text-left p-2">Color</th>
                  <th className="text-right p-2">Current</th>
                  <th className="text-right p-2">Min Level</th>
                  <th className="text-right p-2">Stock %</th>
                  <th className="text-right p-2">Shortage</th>
                  <th className="text-right p-2">Est. Cost</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{item.material_name}</td>
                    <td className="p-2">{item.color || '-'}</td>
                    <td className="p-2 text-right font-mono">{item.quantity.toFixed(2)} {item.unit}</td>
                    <td className="p-2 text-right font-mono">{item.min_stock_level?.toFixed(2)} {item.unit}</td>
                    <td className="p-2 text-right">
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={Math.min(100, item.stockRatio * 100)} 
                          className="w-16 h-2"
                        />
                        <span className="text-xs font-mono">{(item.stockRatio * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="p-2 text-right font-mono">
                      {item.shortage > 0 ? `${item.shortage.toFixed(2)} ${item.unit}` : '-'}
                    </td>
                    <td className="p-2 text-right font-mono">
                      {item.estimatedCost ? formatCurrency(item.estimatedCost) : '-'}
                    </td>
                    <td className="p-2">
                      <Badge variant={getUrgencyColor(item.urgency)}>
                        {getUrgencyText(item.urgency)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No items found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
