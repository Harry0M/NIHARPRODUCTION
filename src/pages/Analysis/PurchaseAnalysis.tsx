import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/utils/formatters";
import { LoadingSpinner } from "@/components/production/LoadingSpinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { subMonths, format, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Package, ShoppingCart, TrendingUp, AlertTriangle, TrendingDown, ChevronDown, ChevronUp, ExternalLink, Eye } from "lucide-react";

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

interface WastageAnalysisData {
  material_id: string;
  material_name: string;
  total_main_quantity: number;
  total_actual_meter: number;
  total_wastage: number;
  wastage_percentage: number;
  wastage_value: number;
  purchase_count: number;
}

interface ExcessMaterialData {
  material_id: string;
  material_name: string;
  total_main_quantity: number;
  total_actual_meter: number;
  total_excess: number;
  excess_percentage: number;
  excess_value: number;
  purchase_count: number;
}

interface PurchaseItem {
  material_id: string;
  quantity: number;
  unit_price: number;
  actual_meter?: number;
  inventory: {
    material_name: string;
  };
  purchases: {
    purchase_date: string;
  };
}

interface MaterialPurchaseDetail {
  id: string;
  purchase_date: string;
  quantity: number;
  unit_price: number;
  total_value: number;
  actual_meter?: number;
  supplier_name?: string;
  purchase_number?: string;
  status: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const PurchaseAnalysis = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState("12"); // months
  const [sortOrder, setSortOrder] = useState<'most' | 'least'>('most');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 12),
    to: new Date(),
  });
  const [isWastageExpanded, setIsWastageExpanded] = useState(false);
  const [isExcessExpanded, setIsExcessExpanded] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialPurchaseInfo | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const { data: purchaseData, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ['purchase-summary', timeRange, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('purchase_items')
        .select(`
          material_id,
          quantity,
          unit_price,
          actual_meter,
          inventory (
            material_name
          ),
          purchases (
            purchase_date,
            status
          )
        `);

      if (dateRange?.from && dateRange?.to) {
        query = query.gte('purchases.purchase_date', dateRange.from.toISOString())
                     .lte('purchases.purchase_date', dateRange.to.toISOString());
      } else if (timeRange) {
        const cutoffDate = subMonths(new Date(), parseFloat(timeRange));
        query = query.gte('purchases.purchase_date', cutoffDate.toISOString());
      }

      query = query.eq('purchases.status', 'completed');
      
      const { data, error } = await query;

      if (error) throw error;

      const materialMap = new Map<string, MaterialPurchaseInfo>();
      
      data.forEach((item: PurchaseItem) => {
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
    queryKey: ['monthly-purchase-summary', timeRange, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('purchases')
        .select('purchase_date, total_amount');

      if (dateRange?.from && dateRange?.to) {
        query = query.gte('purchase_date', dateRange.from.toISOString())
                     .lte('purchase_date', dateRange.to.toISOString());
      } else if (timeRange) {
        const cutoffDate = subMonths(new Date(), parseFloat(timeRange));
        query = query.gte('purchase_date', cutoffDate.toISOString());
      }

      query = query.eq('status', 'completed');
      
      const { data, error } = await query;

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

  const { data: wastageData, isLoading: isLoadingWastage } = useQuery({
    queryKey: ['wastage-analysis', timeRange, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('purchase_items')
        .select(`
          material_id,
          quantity,
          unit_price,
          actual_meter,
          inventory (
            material_name
          ),
          purchases (
            purchase_date,
            status
          )
        `);

      if (dateRange?.from && dateRange?.to) {
        query = query.gte('purchases.purchase_date', dateRange.from.toISOString())
                     .lte('purchases.purchase_date', dateRange.to.toISOString());
      } else if (timeRange) {
        const cutoffDate = subMonths(new Date(), parseFloat(timeRange));
        query = query.gte('purchases.purchase_date', cutoffDate.toISOString());
      }

      query = query.eq('purchases.status', 'completed');
      
      const { data, error } = await query;

      if (error) throw error;

      const wastageMap = new Map<string, WastageAnalysisData>();
      
      data.forEach((item: PurchaseItem) => {
        if (!item.material_id || !item.inventory || !item.actual_meter) return;

        const { material_id, quantity, unit_price, actual_meter } = item;
        const mainQuantity = quantity;
        const actualMeter = actual_meter;
        const wastage = Math.max(0, mainQuantity - actualMeter); // Wastage can't be negative
        const wastageValue = wastage * unit_price;

        if (!wastageMap.has(material_id)) {
          wastageMap.set(material_id, {
            material_id,
            material_name: item.inventory.material_name,
            total_main_quantity: 0,
            total_actual_meter: 0,
            total_wastage: 0,
            wastage_percentage: 0,
            wastage_value: 0,
            purchase_count: 0
          });
        }

        const material = wastageMap.get(material_id)!;
        material.total_main_quantity += mainQuantity;
        material.total_actual_meter += actualMeter;
        material.total_wastage += wastage;
        material.wastage_value += wastageValue;
        material.purchase_count += 1;
      });

      // Calculate wastage percentages
      const wastageArray = Array.from(wastageMap.values()).map(material => ({
        ...material,
        wastage_percentage: material.total_main_quantity > 0 
          ? (material.total_wastage / material.total_main_quantity) * 100 
          : 0
      }));

      return wastageArray.filter(w => w.total_wastage > 0); // Only show materials with wastage
    }
  });

  const { data: excessData, isLoading: isLoadingExcess } = useQuery({
    queryKey: ['excess-material-analysis', timeRange, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('purchase_items')
        .select(`
          material_id,
          quantity,
          unit_price,
          actual_meter,
          inventory (
            material_name
          ),
          purchases (
            purchase_date,
            status
          )
        `);

      if (dateRange?.from && dateRange?.to) {
        query = query.gte('purchases.purchase_date', dateRange.from.toISOString())
                     .lte('purchases.purchase_date', dateRange.to.toISOString());
      } else if (timeRange) {
        const cutoffDate = subMonths(new Date(), parseFloat(timeRange));
        query = query.gte('purchases.purchase_date', cutoffDate.toISOString());
      }

      query = query.eq('purchases.status', 'completed');
      
      const { data, error } = await query;

      if (error) throw error;

      const excessMap = new Map<string, ExcessMaterialData>();
      
      data.forEach((item: PurchaseItem) => {
        if (!item.material_id || !item.inventory || !item.actual_meter) return;

        const { material_id, quantity, unit_price, actual_meter } = item;
        const mainQuantity = quantity;
        const actualMeter = actual_meter;
        const excess = Math.max(0, actualMeter - mainQuantity); // Excess when received more than ordered
        const excessValue = excess * unit_price;

        if (!excessMap.has(material_id)) {
          excessMap.set(material_id, {
            material_id,
            material_name: item.inventory.material_name,
            total_main_quantity: 0,
            total_actual_meter: 0,
            total_excess: 0,
            excess_percentage: 0,
            excess_value: 0,
            purchase_count: 0
          });
        }

        const material = excessMap.get(material_id)!;
        material.total_main_quantity += mainQuantity;
        material.total_actual_meter += actualMeter;
        material.total_excess += excess;
        material.excess_value += excessValue;
        material.purchase_count += 1;
      });

      // Calculate excess percentages
      const excessArray = Array.from(excessMap.values()).map(material => ({
        ...material,
        excess_percentage: material.total_main_quantity > 0 
          ? (material.total_excess / material.total_main_quantity) * 100 
          : 0
      }));

      return excessArray.filter(e => e.total_excess > 0); // Only show materials with excess
    }
  });

  const { data: materialPurchaseDetails, isLoading: isLoadingPurchaseDetails } = useQuery({
    queryKey: ['material-purchase-details', selectedMaterial?.material_id, timeRange, dateRange],
    queryFn: async () => {
      if (!selectedMaterial) return [];
      
      let query = supabase
        .from('purchase_items')
        .select(`
          id,
          quantity,
          unit_price,
          actual_meter,
          purchases!inner (
            id,
            purchase_date,
            purchase_number,
            status,
            suppliers (
              name
            )
          )
        `)
        .eq('material_id', selectedMaterial.material_id)
        .eq('purchases.status', 'completed');

      if (dateRange?.from && dateRange?.to) {
        query = query.gte('purchases.purchase_date', dateRange.from.toISOString())
                     .lte('purchases.purchase_date', dateRange.to.toISOString());
      } else if (timeRange) {
        const cutoffDate = subMonths(new Date(), parseFloat(timeRange));
        query = query.gte('purchases.purchase_date', cutoffDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Sort by purchase date in descending order (newest first)
      const sortedData = data.sort((a, b) => 
        new Date(b.purchases.purchase_date).getTime() - new Date(a.purchases.purchase_date).getTime()
      );

      return sortedData.map(item => ({
        id: item.purchases.id,
        purchase_date: item.purchases.purchase_date,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_value: item.quantity * item.unit_price,
        actual_meter: item.actual_meter,
        supplier_name: item.purchases.suppliers?.name || 'Unknown',
        purchase_number: item.purchases.purchase_number,
        status: item.purchases.status
      })) as MaterialPurchaseDetail[];
    },
    enabled: !!selectedMaterial
  });

  const handleViewMaterialPurchases = (material: MaterialPurchaseInfo) => {
    setSelectedMaterial(material);
    setIsPurchaseModalOpen(true);
  };

  const handleViewPurchaseDetail = (purchaseId: string) => {
    navigate(`/purchases/${purchaseId}`);
  };

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

      {/* Wastage Analysis Section */}
      {wastageData && wastageData.length > 0 && (
        <div className="mb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <CardTitle>Material Wastage Analysis</CardTitle>
                </div>
                <button
                  onClick={() => setIsWastageExpanded(!isWastageExpanded)}
                  className="flex items-center gap-1 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm font-medium">
                    {isWastageExpanded ? 'Collapse' : 'Expand'}
                  </span>
                  {isWastageExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>
              <CardDescription>
                Analysis of material wastage based on actual received meters vs ordered quantities.
              </CardDescription>
            </CardHeader>
            {isWastageExpanded && (
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4 mb-4">
                  <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-orange-700">
                        {wastageData.reduce((sum, item) => sum + item.total_wastage, 0).toFixed(2)}
                      </div>
                      <p className="text-xs text-orange-600">Total Wastage (meters)</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-red-700">
                        {formatCurrency(wastageData.reduce((sum, item) => sum + item.wastage_value, 0))}
                      </div>
                      <p className="text-xs text-red-600">Total Wastage Value</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-yellow-700">
                        {wastageData.length}
                      </div>
                      <p className="text-xs text-yellow-600">Materials with Wastage</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-blue-700">
                        {(wastageData.reduce((sum, item) => sum + item.wastage_percentage, 0) / wastageData.length).toFixed(1)}%
                      </div>
                      <p className="text-xs text-blue-600">Average Wastage %</p>
                    </CardContent>
                  </Card>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material Name</TableHead>
                      <TableHead className="text-right">Ordered Qty</TableHead>
                      <TableHead className="text-right">Received Qty</TableHead>
                      <TableHead className="text-right">Wastage</TableHead>
                      <TableHead className="text-right">Wastage %</TableHead>
                      <TableHead className="text-right">Wastage Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wastageData.slice(0, 10).map((material) => (
                      <TableRow key={material.material_id}>
                        <TableCell className="font-medium">{material.material_name}</TableCell>
                        <TableCell className="text-right">{material.total_main_quantity.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{material.total_actual_meter.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-orange-600 font-medium">
                          {material.total_wastage.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-medium ${
                            material.wastage_percentage > 10 ? 'text-red-600' : 
                            material.wastage_percentage > 5 ? 'text-orange-600' : 'text-yellow-600'
                          }`}>
                            {material.wastage_percentage.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-red-600 font-medium">
                          {formatCurrency(material.wastage_value)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>
        </div>
      )}

      {/* Excess Material Analysis Section */}
      {excessData && excessData.length > 0 && (
        <div className="mb-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-green-500" />
                  <CardTitle>Excess Material Analysis</CardTitle>
                </div>
                <button
                  onClick={() => setIsExcessExpanded(!isExcessExpanded)}
                  className="flex items-center gap-1 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm font-medium">
                    {isExcessExpanded ? 'Collapse' : 'Expand'}
                  </span>
                  {isExcessExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>
              <CardDescription>
                Analysis of excess material received - when actual meters exceed ordered quantities.
              </CardDescription>
            </CardHeader>
            {isExcessExpanded && (
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4 mb-4">
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-700">
                        {excessData.reduce((sum, item) => sum + item.total_excess, 0).toFixed(2)}
                      </div>
                      <p className="text-xs text-green-600">Total Excess (meters)</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-emerald-50 border-emerald-200">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-emerald-700">
                        {formatCurrency(excessData.reduce((sum, item) => sum + item.excess_value, 0))}
                      </div>
                      <p className="text-xs text-emerald-600">Total Excess Value</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-teal-50 border-teal-200">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-teal-700">
                        {excessData.length}
                      </div>
                      <p className="text-xs text-teal-600">Materials with Excess</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-cyan-50 border-cyan-200">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-cyan-700">
                        {(excessData.reduce((sum, item) => sum + item.excess_percentage, 0) / excessData.length).toFixed(1)}%
                      </div>
                      <p className="text-xs text-cyan-600">Average Excess %</p>
                    </CardContent>
                  </Card>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material Name</TableHead>
                      <TableHead className="text-right">Ordered Qty</TableHead>
                      <TableHead className="text-right">Received Qty</TableHead>
                      <TableHead className="text-right">Excess</TableHead>
                      <TableHead className="text-right">Excess %</TableHead>
                      <TableHead className="text-right">Excess Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {excessData.slice(0, 10).map((material) => (
                      <TableRow key={material.material_id}>
                        <TableCell className="font-medium">{material.material_name}</TableCell>
                        <TableCell className="text-right">{material.total_main_quantity.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{material.total_actual_meter.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          +{material.total_excess.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-medium ${
                            material.excess_percentage > 20 ? 'text-green-700' : 
                            material.excess_percentage > 10 ? 'text-green-600' : 'text-green-500'
                          }`}>
                            +{material.excess_percentage.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          +{formatCurrency(material.excess_value)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>
        </div>
      )}

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
                <Select value={timeRange} onValueChange={setTimeRange} disabled={!!dateRange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0.25">Last 7 days</SelectItem>
                        <SelectItem value="1">Last 30 days</SelectItem>
                        <SelectItem value="3">Last 3 months</SelectItem>
                        <SelectItem value="6">Last 6 months</SelectItem>
                        <SelectItem value="12">Last 12 months</SelectItem>
                        <SelectItem value="24">Last 2 years</SelectItem>
                        <SelectItem value="36">Last 3 years</SelectItem>
                        <SelectItem value="48">Last 4 years</SelectItem>
                    </SelectContent>
                </Select>
                <DatePickerWithRange
                  date={dateRange}
                  onChange={(range) => {
                    setDateRange(range);
                    if (range) {
                      setTimeRange(""); // Clear dropdown selection
                    } else {
                      setTimeRange("12"); // Reset to default
                    }
                  }}
                />
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((material) => (
                  <TableRow key={material.material_id}>
                    <TableCell>
                      <button
                        onClick={() => handleViewMaterialPurchases(material)}
                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                      >
                        {material.material_name}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">{material.total_quantity.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(material.total_value)}</TableCell>
                    <TableCell className="text-right">{material.purchase_count}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewMaterialPurchases(material)}
                        className="h-8 px-2"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Material Purchase Details Modal */}
      <Dialog open={isPurchaseModalOpen} onOpenChange={setIsPurchaseModalOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Purchase History: {selectedMaterial?.material_name}
            </DialogTitle>
          </DialogHeader>
          
          {isLoadingPurchaseDetails ? (
            <div className="flex justify-center items-center h-32">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="text-xl font-bold text-blue-700">
                      {materialPurchaseDetails?.length || 0}
                    </div>
                    <p className="text-xs text-blue-600">Total Purchases</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-6">
                    <div className="text-xl font-bold text-green-700">
                      {materialPurchaseDetails?.reduce((sum, item) => sum + item.quantity, 0).toFixed(2) || '0.00'}
                    </div>
                    <p className="text-xs text-green-600">Total Quantity</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="pt-6">
                    <div className="text-xl font-bold text-purple-700">
                      {formatCurrency(materialPurchaseDetails?.reduce((sum, item) => sum + item.total_value, 0) || 0)}
                    </div>
                    <p className="text-xs text-purple-600">Total Value</p>
                  </CardContent>
                </Card>
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="pt-6">
                    <div className="text-xl font-bold text-orange-700">
                      {materialPurchaseDetails?.length > 0 
                        ? (materialPurchaseDetails.reduce((sum, item) => sum + item.unit_price, 0) / materialPurchaseDetails.length).toFixed(2)
                        : '0.00'
                      }
                    </div>
                    <p className="text-xs text-orange-600">Avg Unit Price</p>
                  </CardContent>
                </Card>
              </div>

              {/* Purchase Details Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Purchase Date</TableHead>
                      <TableHead>Purchase #</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                      <TableHead className="text-right">Actual Meter</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materialPurchaseDetails?.map((purchase) => {
                      const variance = purchase.actual_meter ? purchase.actual_meter - purchase.quantity : 0;
                      const variancePercent = purchase.quantity > 0 ? ((variance / purchase.quantity) * 100) : 0;
                      
                      return (
                        <TableRow key={purchase.id}>
                          <TableCell className="font-medium">
                            {format(parseISO(purchase.purchase_date), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell>{purchase.purchase_number || 'N/A'}</TableCell>
                          <TableCell>{purchase.supplier_name}</TableCell>
                          <TableCell className="text-right">{purchase.quantity.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(purchase.unit_price)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(purchase.total_value)}</TableCell>
                          <TableCell className="text-right">
                            {purchase.actual_meter ? purchase.actual_meter.toFixed(2) : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            {purchase.actual_meter ? (
                              <span className={`font-medium ${
                                variance > 0 ? 'text-green-600' : variance < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {variance > 0 ? '+' : ''}{variance.toFixed(2)}
                                <br />
                                <span className="text-xs">
                                  ({variance > 0 ? '+' : ''}{variancePercent.toFixed(1)}%)
                                </span>
                              </span>
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={purchase.status === 'completed' ? 'default' : 'secondary'}>
                              {purchase.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewPurchaseDetail(purchase.id)}
                              className="h-7 px-2"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                
                {materialPurchaseDetails?.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No purchases found for this material in the selected time range.
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseAnalysis;
