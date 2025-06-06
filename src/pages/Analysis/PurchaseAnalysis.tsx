import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { 
  Bar, 
  BarChart, 
  Line, 
  LineChart, 
  Pie, 
  PieChart, 
  Cell, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  Area,
  AreaChart
} from "recharts";
import { LoadingSpinner } from "@/components/production/LoadingSpinner";
import { 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign, 
  Truck, 
  Users, 
  Calendar,
  FileText,
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatQuantity } from "@/utils/analysisUtils";
import { addDays, subDays, format } from "date-fns";
import { DateRange } from "react-day-picker";

interface PurchaseData {
  id: string;
  purchase_number: string;
  purchase_date: string;
  supplier_name: string;
  subtotal: number;
  transport_charge: number;
  total_amount: number;
  status: string;
  gst_amount: number;
  item_count: number;
}

interface PurchaseTrendData {
  date: string;
  total_amount: number;
  purchase_count: number;
  avg_amount: number;
}

interface SupplierPerformanceData {
  supplier_id: string;
  supplier_name: string;
  total_purchases: number;
  total_amount: number;
  avg_amount: number;
  purchase_count: number;
  total_transport: number;
  total_gst: number;
}

interface MaterialPurchaseData {
  material_id: string;
  material_name: string;
  total_quantity: number;
  total_amount: number;
  avg_price: number;
  purchase_count: number;
  last_purchase_date: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const PurchaseAnalysis = () => {  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  
  // Data states
  const [purchaseData, setPurchaseData] = useState<PurchaseData[]>([]);
  const [trendData, setTrendData] = useState<PurchaseTrendData[]>([]);
  const [supplierData, setSupplierData] = useState<SupplierPerformanceData[]>([]);
  const [materialData, setMaterialData] = useState<MaterialPurchaseData[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);

  // Summary metrics
  const [metrics, setMetrics] = useState({
    totalPurchases: 0,
    totalAmount: 0,
    totalTransport: 0,
    totalGST: 0,
    avgPurchaseValue: 0,
    activeSuppliers: 0
  });  const fetchPurchaseData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!dateRange.from || !dateRange.to) return;
      
      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');// Base query for purchases with supplier filter
      let purchaseQuery = supabase
        .from('purchases')
        .select(`
          *,
          suppliers!inner(id, name),
          purchase_items(
            id,
            quantity,
            unit_price,
            line_total,
            inventory(id, material_name)
          )
        `)
        .gte('purchase_date', fromDate)
        .lte('purchase_date', toDate)
        .order('purchase_date', { ascending: false });

      if (selectedSupplier !== "all") {
        purchaseQuery = purchaseQuery.eq('supplier_id', selectedSupplier);
      }

      const { data: purchases, error } = await purchaseQuery;

      if (error) throw error;      // Process purchase data
      const processedPurchases: PurchaseData[] = purchases?.map(purchase => ({
        id: purchase.id,
        purchase_number: purchase.purchase_number,
        purchase_date: purchase.purchase_date,
        supplier_name: purchase.suppliers.name,
        subtotal: purchase.subtotal || 0,
        transport_charge: purchase.transport_charge || 0,
        total_amount: purchase.total_amount || 0,
        status: purchase.status,
        gst_amount: 0, // GST calculation can be added later if needed
        item_count: purchase.purchase_items?.length || 0
      })) || [];

      setPurchaseData(processedPurchases);

      // Calculate metrics
      const totalAmount = processedPurchases.reduce((sum, p) => sum + p.total_amount, 0);
      const totalTransport = processedPurchases.reduce((sum, p) => sum + p.transport_charge, 0);
      const totalGST = processedPurchases.reduce((sum, p) => sum + p.gst_amount, 0);
      const uniqueSuppliers = new Set(processedPurchases.map(p => p.supplier_name)).size;

      setMetrics({
        totalPurchases: processedPurchases.length,
        totalAmount,
        totalTransport,
        totalGST,
        avgPurchaseValue: processedPurchases.length > 0 ? totalAmount / processedPurchases.length : 0,
        activeSuppliers: uniqueSuppliers
      });

      // Generate trend data
      const trendMap = new Map<string, { total: number; count: number }>();
      processedPurchases.forEach(purchase => {
        const date = purchase.purchase_date;
        const existing = trendMap.get(date) || { total: 0, count: 0 };
        trendMap.set(date, {
          total: existing.total + purchase.total_amount,
          count: existing.count + 1
        });
      });

      const trends: PurchaseTrendData[] = Array.from(trendMap.entries())
        .map(([date, data]) => ({
          date,
          total_amount: data.total,
          purchase_count: data.count,
          avg_amount: data.total / data.count
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setTrendData(trends);

      // Generate supplier performance data
      const supplierMap = new Map<string, {
        name: string;
        total: number;
        count: number;
        transport: number;
        gst: number;
      }>();

      processedPurchases.forEach(purchase => {
        const existing = supplierMap.get(purchase.supplier_name) || {
          name: purchase.supplier_name,
          total: 0,
          count: 0,
          transport: 0,
          gst: 0
        };
        
        supplierMap.set(purchase.supplier_name, {
          name: purchase.supplier_name,
          total: existing.total + purchase.total_amount,
          count: existing.count + 1,
          transport: existing.transport + purchase.transport_charge,
          gst: existing.gst + purchase.gst_amount
        });
      });

      const supplierPerf: SupplierPerformanceData[] = Array.from(supplierMap.entries())
        .map(([name, data]) => ({
          supplier_id: name,
          supplier_name: data.name,
          total_purchases: data.count,
          total_amount: data.total,
          avg_amount: data.total / data.count,
          purchase_count: data.count,
          total_transport: data.transport,
          total_gst: data.gst
        }))
        .sort((a, b) => b.total_amount - a.total_amount);

      setSupplierData(supplierPerf);      // Generate material purchase data
      const materialMap = new Map<string, {
        name: string;
        quantity: number;
        amount: number;
        count: number;
        lastDate: string;
      }>();

      purchases?.forEach(purchase => {
        purchase.purchase_items?.forEach(item => {
          if (item.inventory) {            const existing = materialMap.get(item.inventory.id) || {
              name: item.inventory.material_name,
              quantity: 0,
              amount: 0,
              count: 0,
              lastDate: purchase.purchase_date
            };

            materialMap.set(item.inventory.id, {
              name: item.inventory.material_name,
              quantity: existing.quantity + item.quantity,
              amount: existing.amount + item.line_total,
              count: existing.count + 1,
              lastDate: existing.lastDate > purchase.purchase_date ? existing.lastDate : purchase.purchase_date
            });
          }
        });
      });

      const materialPerf: MaterialPurchaseData[] = Array.from(materialMap.entries())
        .map(([id, data]) => ({
          material_id: id,
          material_name: data.name,
          total_quantity: data.quantity,
          total_amount: data.amount,
          avg_price: data.amount / data.quantity,
          purchase_count: data.count,
          last_purchase_date: data.lastDate
        }))
        .sort((a, b) => b.total_amount - a.total_amount);

      setMaterialData(materialPerf);    } catch (error) {
      console.error('Error fetching purchase data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, selectedSupplier]);

  const fetchSuppliers = async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select('id, name')
      .order('name');

    if (!error && data) {
      setSuppliers(data);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);
  useEffect(() => {
    fetchPurchaseData();
  }, [fetchPurchaseData]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Purchase Analysis</h1>
          <p className="text-muted-foreground">
            Comprehensive analysis of purchase trends, supplier performance, and material costs
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Date Range</label>            <DatePickerWithRange
              date={dateRange}
              onChange={(range) => range && range.from && range.to && setDateRange(range as DateRange)}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Supplier</label>
            <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={fetchPurchaseData} variant="outline">
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalPurchases}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalAmount)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Purchase Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.avgPurchaseValue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transport Costs</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalTransport)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total GST</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalGST)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeSuppliers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Purchase Trends</TabsTrigger>
          <TabsTrigger value="suppliers">Supplier Performance</TabsTrigger>
          <TabsTrigger value="materials">Material Analysis</TabsTrigger>
          <TabsTrigger value="costs">Cost Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Purchase Amount Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                      />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <ChartTooltip 
                        labelFormatter={(value) => format(new Date(value as string), 'MMM dd, yyyy')}
                        formatter={(value, name) => [
                          name === 'total_amount' ? formatCurrency(value as number) : value,
                          name === 'total_amount' ? 'Total Amount' : 'Purchase Count'
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="total_amount" 
                        stroke="#0088FE" 
                        fill="#0088FE" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Purchase Count Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData}>
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                      />
                      <YAxis />
                      <ChartTooltip 
                        labelFormatter={(value) => format(new Date(value as string), 'MMM dd, yyyy')}
                      />
                      <Bar dataKey="purchase_count" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Suppliers by Purchase Value</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={supplierData.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="total_amount"
                        nameKey="supplier_name"
                      >
                        {supplierData.slice(0, 6).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Supplier Performance Table</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Supplier</th>
                        <th className="text-right p-2">Orders</th>
                        <th className="text-right p-2">Total Amount</th>
                        <th className="text-right p-2">Avg Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierData.slice(0, 8).map((supplier, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">{supplier.supplier_name}</td>
                          <td className="text-right p-2">{supplier.purchase_count}</td>
                          <td className="text-right p-2">{formatCurrency(supplier.total_amount)}</td>
                          <td className="text-right p-2">{formatCurrency(supplier.avg_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Materials by Purchase Value</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={materialData.slice(0, 8)} layout="horizontal">
                      <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                      <YAxis type="category" dataKey="material_name" width={120} />
                      <ChartTooltip formatter={(value) => formatCurrency(value as number)} />
                      <Bar dataKey="total_amount" fill="#FFBB28" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Material Purchase Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Material</th>
                        <th className="text-right p-2">Quantity</th>
                        <th className="text-right p-2">Value</th>
                        <th className="text-right p-2">Avg Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materialData.slice(0, 8).map((material, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">{material.material_name}</td>
                          <td className="text-right p-2">{formatQuantity(material.total_quantity, "units")}</td>
                          <td className="text-right p-2">{formatCurrency(material.total_amount)}</td>
                          <td className="text-right p-2">{formatCurrency(material.avg_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Material Cost', value: metrics.totalAmount - metrics.totalTransport - metrics.totalGST },
                          { name: 'Transport', value: metrics.totalTransport },
                          { name: 'GST', value: metrics.totalGST }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                      >
                        {[0, 1, 2].map((index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                      </Pie>
                      <ChartTooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transport Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Transport as % of Total</span>
                    <span className="font-bold">
                      {((metrics.totalTransport / metrics.totalAmount) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-1">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(metrics.totalTransport / metrics.totalAmount) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Transport per Order</span>
                    <span className="font-bold">
                      {formatCurrency(metrics.totalPurchases > 0 ? metrics.totalTransport / metrics.totalPurchases : 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>GST Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">GST as % of Total</span>
                    <span className="font-bold">
                      {((metrics.totalGST / metrics.totalAmount) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-1">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(metrics.totalGST / metrics.totalAmount) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg GST per Order</span>
                    <span className="font-bold">
                      {formatCurrency(metrics.totalPurchases > 0 ? metrics.totalGST / metrics.totalPurchases : 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PurchaseAnalysis;
