
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useInventoryAnalytics } from "@/hooks/analysis/useInventoryAnalytics";
import { formatCurrency, calculateRefillUrgency } from "@/utils/analysisUtils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Search, 
  AlertCircle, 
  ShoppingCart, 
  TrendingDown, 
  BarChart as BarChartIcon,
  CheckCircle,
  RefreshCcw
} from "lucide-react";
import { LoadingSpinner } from "@/components/production/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const RefillAnalysis = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { refillNeedsData, inventoryValueData, isLoading } = useInventoryAnalytics();
  
  // Combine refill needs with all inventory data for complete analysis
  const combinedData = inventoryValueData?.map(item => {
    const needsRefill = refillNeedsData?.find(r => r.id === item.id);
    const urgency = calculateRefillUrgency(
      item.quantity,
      item.reorder_level,
      item.min_stock_level
    );
    
    return {
      ...item,
      needsRefill: !!needsRefill,
      urgency
    };
  });
  
  // Filter data based on search and status
  const filteredData = combinedData
    ?.filter(item => {
      // Apply search filter
      const matchesSearch = !searchQuery || 
        item.material_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Apply status filter
      let matchesStatus = true;
      if (statusFilter === "critical") {
        matchesStatus = item.urgency === "critical";
      } else if (statusFilter === "warning") {
        matchesStatus = item.urgency === "warning";
      } else if (statusFilter === "normal") {
        matchesStatus = item.urgency === "normal";
      }
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by urgency (critical first, then warning, then normal)
      const urgencyOrder: Record<string, number> = { critical: 0, warning: 1, normal: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
  
  // Count materials by status
  const criticalCount = combinedData?.filter(item => item.urgency === "critical").length || 0;
  const warningCount = combinedData?.filter(item => item.urgency === "warning").length || 0;
  const normalCount = combinedData?.filter(item => item.urgency === "normal").length || 0;
  
  // Calculate how much money needed to refill all critical and warning items
  const estimatedRefillCost = combinedData
    ?.filter(item => item.urgency === "critical" || item.urgency === "warning")
    .reduce((total, item) => {
      const reorderLevel = item.reorder_level || 0;
      const currentQuantity = item.quantity || 0;
      const deficitQuantity = Math.max(0, reorderLevel - currentQuantity);
      const unitCost = item.purchase_rate || 0;
      return total + (deficitQuantity * unitCost);
    }, 0) || 0;
  
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
          <h1 className="text-2xl font-bold">Inventory Refill Analysis</h1>
        </div>
        <p className="text-muted-foreground">
          Analyze which materials need replenishment and track inventory levels
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
            <div className="w-full md:w-[200px]">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold">{criticalCount}</div>
              <Badge variant="destructive" className="ml-2">Urgent Refill</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Materials below minimum stock level
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Warning Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold">{warningCount}</div>
              <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                Order Soon
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Materials below reorder level
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Healthy Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold">{normalCount}</div>
              <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
                Good
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Materials with adequate stock
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Est. Refill Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(estimatedRefillCost)}</div>
            <p className="text-xs text-muted-foreground">
              Cost to restock all low items
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Material Refill Requirements</CardTitle>
          <CardDescription>Detailed analysis of inventory levels and refill needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="py-2 px-4 text-left font-medium">Material</th>
                  <th className="py-2 px-4 text-left font-medium">Current Stock</th>
                  <th className="py-2 px-4 text-left font-medium">Unit</th>
                  <th className="py-2 px-4 text-center font-medium">Reorder Level</th>
                  <th className="py-2 px-4 text-center font-medium">Min Stock</th>
                  <th className="py-2 px-4 text-right font-medium">Status</th>
                  <th className="py-2 px-4 text-right font-medium">Stock Level</th>
                </tr>
              </thead>
              <tbody>
                {filteredData && filteredData.length > 0 ? (
                  filteredData.map((item) => {
                    const stockLevel = item.reorder_level 
                      ? (item.quantity / item.reorder_level) * 100
                      : 100;
                    
                    // Determine status badge styling
                    let badgeClass = "";
                    let statusLabel = "";
                    if (item.urgency === "critical") {
                      badgeClass = "bg-red-100 text-red-800";
                      statusLabel = "Critical";
                    } else if (item.urgency === "warning") {
                      badgeClass = "bg-yellow-100 text-yellow-800";
                      statusLabel = "Reorder";
                    } else {
                      badgeClass = "bg-green-100 text-green-800";
                      statusLabel = "Good";
                    }
                    
                    return (
                      <tr key={item.id} className="border-b">
                        <td className="py-2 px-4 text-left font-medium">{item.material_name}</td>
                        <td className="py-2 px-4 text-left">
                          {item.quantity.toFixed(2)}
                          {item.urgency === "critical" && (
                            <AlertCircle className="inline h-4 w-4 ml-1 text-destructive" />
                          )}
                        </td>
                        <td className="py-2 px-4 text-left">{item.unit}</td>
                        <td className="py-2 px-4 text-center">
                          {item.reorder_level?.toFixed(2) || 'Not set'}
                        </td>
                        <td className="py-2 px-4 text-center">
                          {item.min_stock_level?.toFixed(2) || 'Not set'}
                        </td>
                        <td className="py-2 px-4 text-right">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${badgeClass}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-right">
                          <div className="w-full flex items-center gap-2">
                            <Progress 
                              value={Math.min(100, stockLevel)} 
                              className={`h-2 ${
                                item.urgency === "critical" ? "bg-red-100" : 
                                item.urgency === "warning" ? "bg-yellow-100" : "bg-green-100"
                              }`} 
                            />
                            <span className="text-xs w-12 text-right">
                              {stockLevel.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-muted-foreground">
                      No materials found matching the current filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Action Card */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Recommended Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {criticalCount > 0 && (
              <div className="flex items-start space-x-4">
                <AlertCircle className="h-6 w-6 text-destructive mt-0.5" />
                <div>
                  <h4 className="font-medium">Critical Inventory Alert</h4>
                  <p className="text-sm text-muted-foreground">
                    {criticalCount} material(s) are below minimum stock levels. 
                    Urgent restocking required to avoid production delays.
                  </p>
                  <Button className="mt-2" size="sm">
                    Create Purchase Orders
                  </Button>
                </div>
              </div>
            )}
            
            {warningCount > 0 && (
              <div className="flex items-start space-x-4">
                <RefreshCcw className="h-6 w-6 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Reorder Recommendation</h4>
                  <p className="text-sm text-muted-foreground">
                    {warningCount} material(s) have fallen below their reorder levels. 
                    Consider placing orders soon to maintain optimal inventory levels.
                  </p>
                  <Button variant="outline" className="mt-2" size="sm">
                    View Reorder List
                  </Button>
                </div>
              </div>
            )}
            
            {criticalCount === 0 && warningCount === 0 && (
              <div className="flex items-start space-x-4">
                <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">All Inventory Levels Healthy</h4>
                  <p className="text-sm text-muted-foreground">
                    All materials are currently at adequate stock levels. 
                    No immediate reordering is required.
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-start space-x-4">
              <BarChartIcon className="h-6 w-6 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium">Optimize Inventory</h4>
                <p className="text-sm text-muted-foreground">
                  Review material usage patterns to adjust reorder points and minimize excess inventory.
                  This can help reduce holding costs while maintaining production readiness.
                </p>
                <Button variant="outline" className="mt-2" size="sm" onClick={() => navigate('/analysis/materials')}>
                  View Consumption Patterns
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RefillAnalysis;
