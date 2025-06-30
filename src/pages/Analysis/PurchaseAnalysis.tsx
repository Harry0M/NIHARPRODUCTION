import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/utils/formatters";
import { LoadingSpinner } from "@/components/production/LoadingSpinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subMonths, format, parseISO } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Package, ShoppingCart, TrendingUp } from "lucide-react";

interface MaterialPurchaseInfo {
  material_id: string;
  material_name: string;
  total_quantity: number;
  total_value: number;
  purchase_count: number;
}

interface MonthlyPurchaseData {
  month: string;
  total_value: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const PurchaseAnalysis = () => {
  const [timeRange, setTimeRange] = useState("12"); // months
  const [sortOrder, setSortOrder] = useState<'most' | 'least'>('most');

  const { data: purchaseData, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ['purchase-summary', timeRange],
    queryFn: async () => {
      const cutoffDate = subMonths(new Date(), parseFloat(timeRange));
      
      const { data, error } = await supabase
        .from('purchase_items')
        .select(`
          material_id,
          quantity,
          unit_price,
          inventory (
            material_name
          ),
          purchases (
            purchase_date,
            status
          )
        `)
        .gte('purchases.purchase_date', cutoffDate.toISOString())
        .eq('purchases.status', 'completed');

      if (error) throw error;

      const materialMap = new Map<string, MaterialPurchaseInfo>();
      
      data.forEach((item: any) => {
        if (!item.material_id || !item.inventory) return;

        const { material_id, quantity, unit_price } = item;
        const value = quantity * unit_price;

        if (!materialMap.has(material_id)) {
          materialMap.set(material_id, {
            material_id,
            material_name: item.inventory.material_name,
            total_quantity: 0,
            total_value: 0,
            purchase_count: 0
          });
        }

        const material = materialMap.get(material_id)!;
        material.total_quantity += quantity;
        material.total_value += value;
        material.purchase_count += 1;
      });

      return Array.from(materialMap.values());
    }
  });

  const { data: monthlyData, isLoading: isLoadingMonthly } = useQuery({
    queryKey: ['monthly-purchase-summary', timeRange],
    queryFn: async () => {
      const cutoffDate = subMonths(new Date(), parseFloat(timeRange));
      const { data, error } = await supabase
        .from('purchases')
        .select('purchase_date, total_amount')
        .gte('purchase_date', cutoffDate.toISOString())
        .eq('status', 'completed');

      if (error) throw error;

      const monthlyMap = new Map<string, number>();
      data.forEach(p => {
        const month = format(parseISO(p.purchase_date), 'yyyy-MM');
        const currentTotal = monthlyMap.get(month) || 0;
        monthlyMap.set(month, currentTotal + p.total_amount);
      });
      
      return Array.from(monthlyMap.entries())
        .map(([month, total_value]) => ({ month, total_value }))
        .sort((a, b) => a.month.localeCompare(b.month));
    }
  });

  const sortedData = React.useMemo(() => {
    if (!purchaseData) return [];
    if (sortOrder === 'most') {
      return [...purchaseData].sort((a, b) => b.total_quantity - a.total_quantity);
    }
    return [...purchaseData].sort((a, b) => a.total_quantity - b.total_quantity);
  }, [purchaseData, sortOrder]);

  const summaryStats = useMemo(() => {
    if (!purchaseData) {
      return { totalValue: 0, totalQuantity: 0, uniqueMaterials: 0 };
    }
    const totalValue = purchaseData.reduce((sum, item) => sum + item.total_value, 0);
    const totalQuantity = purchaseData.reduce((sum, item) => sum + item.total_quantity, 0);
    const uniqueMaterials = purchaseData.length;
    return { totalValue, totalQuantity, uniqueMaterials };
  }, [purchaseData]);

  const barChartData = useMemo(() => {
    if (!purchaseData) return [];
    return [...purchaseData]
      .sort((a, b) => b.total_value - a.total_value)
      .slice(0, 10)
      .map(item => ({
        name: item.material_name,
        value: item.total_value
      }));
  }, [purchaseData]);

  const pieChartData = useMemo(() => {
    if (!purchaseData) return [];
    const sortedByValue = [...purchaseData].sort((a, b) => b.total_value - a.total_value);
    const top5 = sortedByValue.slice(0, 5);
    const otherValue = sortedByValue.slice(5).reduce((acc, item) => acc + item.total_value, 0);
    
    const chartData = top5.map(item => ({ name: item.material_name, value: item.total_value }));
    if (otherValue > 0) {
      chartData.push({ name: 'Others', value: otherValue });
    }
    return chartData;
  }, [purchaseData]);

  const isLoading = isLoadingMaterials || isLoadingMonthly;

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
  }

  return (
    <div className="container mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Purchase Analysis</h1>
        <p className="text-muted-foreground">Analysis of most and least purchased materials.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchase Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalValue)}</div>
            <p className="text-xs text-muted-foreground">in the last {timeRange} months</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quantity Purchased</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summaryStats.totalQuantity)}</div>
            <p className="text-xs text-muted-foreground">across all materials</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Materials Purchased</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.uniqueMaterials}</div>
            <p className="text-xs text-muted-foreground">distinct material types</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchase Trend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Monthly Analysis</div>
            <p className="text-xs text-muted-foreground">last {timeRange} months trend</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Purchase Trend</CardTitle>
            <CardDescription>Total purchase value over the last {timeRange} months.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="total_value" name="Total Value" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Materials by Purchase Value</CardTitle>
            <CardDescription>Distribution of purchase value among top materials.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{sortOrder === 'most' ? 'Most Purchased Materials' : 'Least Purchased Materials'}</CardTitle>
                <CardDescription>
                  Showing materials sorted by quantity purchased in the last {timeRange} months.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'most' | 'least')}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="most">Most Purchased</SelectItem>
                    <SelectItem value="least">Least Purchased</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0.25">Last 7 days</SelectItem>
                        <SelectItem value="1">Last 30 days</SelectItem>
                        <SelectItem value="3">Last 3 months</SelectItem>
                        <SelectItem value="6">Last 6 months</SelectItem>
                        <SelectItem value="12">Last 12 months</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material Name</TableHead>
                  <TableHead className="text-right">Total Quantity</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead className="text-right">Purchase Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((material) => (
                  <TableRow key={material.material_id}>
                    <TableCell>{material.material_name}</TableCell>
                    <TableCell className="text-right">{material.total_quantity.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(material.total_value)}</TableCell>
                    <TableCell className="text-right">{material.purchase_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PurchaseAnalysis;
