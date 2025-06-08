import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, Package, Users, DollarSign, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { LoadingSpinner } from "@/components/production/LoadingSpinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addMonths, subMonths, format, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface MaterialAnalysis {
  material_id: string;
  material_name: string;
  total_quantity: number;
  total_value: number;
  purchase_count: number;
  average_price: number;
  last_purchase_date: string;
}

interface SupplierAnalysis {
  supplier_id: string;
  supplier_name: string;
  total_purchases: number;
  total_value: number;
  purchase_count: number;
  average_order_value: number;
  last_purchase_date: string;
}

interface ReceivedAnalysis {
  material_id: string;
  material_name: string;
  unit_quantity: number;
  actual_meter: number;
  difference: number;
  difference_value: number;
  purchase_id: string;
  purchase_number: string;
  supplier_name: string;
  purchase_date: string;
}

interface MonthlyPurchaseData {
  month: string;
  total_value: number;
  purchase_count: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const PurchaseAnalysis = () => {
  const [activeTab, setActiveTab] = useState("materials");
  const [timeRange, setTimeRange] = useState("12"); // months
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subMonths(new Date(), 12),
    to: new Date()
  });

  // Fetch material analysis data
  const { data: materialAnalysis, isLoading: materialLoading } = useQuery({
    queryKey: ['material-analysis', timeRange],
    queryFn: async () => {
      const cutoffDate = subMonths(new Date(), parseInt(timeRange));
      
      const { data, error } = await supabase
        .from('purchase_items')
        .select(`
          material_id,
          quantity,
          unit_price,
          created_at,
          material:inventory (
            material_name
          ),
          purchase:purchases (
            purchase_date
          )
        `)
        .gte('purchase.purchase_date', cutoffDate.toISOString())
        .eq('purchase.status', 'completed');

      if (error) throw error;

      // Process data to get material analysis
      const materialMap = new Map<string, MaterialAnalysis>();
      
      data.forEach((item: any) => {
        const materialId = item.material_id;
        const quantity = item.quantity;
        const value = quantity * item.unit_price;

        if (!materialMap.has(materialId)) {
          materialMap.set(materialId, {
            material_id: materialId,
            material_name: item.material.material_name,
            total_quantity: 0,
            total_value: 0,
            purchase_count: 0,
            average_price: 0,
            last_purchase_date: item.purchase.purchase_date
          });
        }

        const material = materialMap.get(materialId)!;
        material.total_quantity += quantity;
        material.total_value += value;
        material.purchase_count += 1;
        material.average_price = material.total_value / material.total_quantity;
        material.last_purchase_date = item.purchase.purchase_date;
      });

      return Array.from(materialMap.values())
        .sort((a, b) => b.total_value - a.total_value);
    }
  });

  // Fetch supplier analysis data
  const { data: supplierAnalysis, isLoading: supplierLoading } = useQuery({
    queryKey: ['supplier-analysis', timeRange],
    queryFn: async () => {
      const cutoffDate = subMonths(new Date(), parseInt(timeRange));
      
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          id,
          supplier_id,
          total_amount,
          purchase_date,
          suppliers (
            name
          )
        `)
        .gte('purchase_date', cutoffDate.toISOString())
        .eq('status', 'completed');

      if (error) throw error;

      // Process data to get supplier analysis
      const supplierMap = new Map<string, SupplierAnalysis>();
      
      data.forEach((purchase: any) => {
        const supplierId = purchase.supplier_id;
        const value = purchase.total_amount;

        if (!supplierMap.has(supplierId)) {
          supplierMap.set(supplierId, {
            supplier_id: supplierId,
            supplier_name: purchase.suppliers.name,
            total_purchases: 0,
            total_value: 0,
            purchase_count: 0,
            average_order_value: 0,
            last_purchase_date: purchase.purchase_date
          });
        }

        const supplier = supplierMap.get(supplierId)!;
        supplier.total_purchases += value;
        supplier.total_value += value;
        supplier.purchase_count += 1;
        supplier.average_order_value = supplier.total_value / supplier.purchase_count;
        supplier.last_purchase_date = purchase.purchase_date;
      });

      return Array.from(supplierMap.values())
        .sort((a, b) => b.total_value - a.total_value);
    }
  });

  // Fetch received analysis data
  const { data: receivedAnalysis, isLoading: receivedLoading } = useQuery({
    queryKey: ['received-analysis', timeRange],
    queryFn: async () => {
      const cutoffDate = subMonths(new Date(), parseInt(timeRange));
      
      const { data, error } = await supabase
        .from('purchase_items')
        .select(`
          id,
          material_id,
          quantity,
          actual_meter,
          unit_price,
          purchase_id,
          material:inventory (
            material_name
          ),
          purchase:purchases (
            purchase_number,
            purchase_date,
            supplier:suppliers (
              name
            )
          )
        `)
        .gte('purchase.purchase_date', cutoffDate.toISOString())
        .eq('purchase.status', 'completed');

      if (error) throw error;

      return data.map((item: any) => ({
        material_id: item.material_id,
        material_name: item.material.material_name,
        unit_quantity: item.quantity,
        actual_meter: item.actual_meter,
        difference: item.actual_meter - item.quantity,
        difference_value: (item.actual_meter - item.quantity) * item.unit_price,
        purchase_id: item.purchase_id,
        purchase_number: item.purchase.purchase_number,
        supplier_name: item.purchase.supplier.name,
        purchase_date: item.purchase.purchase_date
      })).sort((a: ReceivedAnalysis, b: ReceivedAnalysis) => 
        Math.abs(b.difference_value) - Math.abs(a.difference_value)
      );
    }
  });

  // Fetch monthly purchase data for trends
  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['monthly-purchase-data', timeRange],
    queryFn: async () => {
      const cutoffDate = subMonths(new Date(), parseInt(timeRange));
      
      const { data, error } = await supabase
        .from('purchases')
        .select('total_amount, purchase_date')
        .gte('purchase_date', cutoffDate.toISOString())
        .eq('status', 'completed');

      if (error) throw error;

      // Group by month
      const monthlyMap = new Map<string, MonthlyPurchaseData>();
      
      data.forEach((purchase: any) => {
        const month = format(parseISO(purchase.purchase_date), 'MMM yyyy');
        
        if (!monthlyMap.has(month)) {
          monthlyMap.set(month, {
            month,
            total_value: 0,
            purchase_count: 0
          });
        }

        const monthData = monthlyMap.get(month)!;
        monthData.total_value += purchase.total_amount;
        monthData.purchase_count += 1;
      });

      return Array.from(monthlyMap.values())
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
    }
  });

  if (materialLoading || supplierLoading || receivedLoading || monthlyLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Purchase Analysis</h1>
          <p className="text-muted-foreground">Analyze purchase patterns and supplier performance</p>
        </div>
        <div className="flex gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
              <SelectItem value="24">Last 24 months</SelectItem>
            </SelectContent>
          </Select>
          <DatePickerWithRange
            date={dateRange}
            onChange={(range) => setDateRange(range)}
          />
        </div>
      </div>

      {/* Monthly Trends Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Monthly Purchase Trends</CardTitle>
          <CardDescription>Track purchase value and count over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="total_value"
                  name="Total Value"
                  stroke="#8884d8"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="purchase_count"
                  name="Purchase Count"
                  stroke="#82ca9d"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="materials">Material Analysis</TabsTrigger>
          <TabsTrigger value="suppliers">Supplier Analysis</TabsTrigger>
          <TabsTrigger value="received">Received Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="materials">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Material Purchase Trends</CardTitle>
                <CardDescription>Track material purchase values over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={materialAnalysis?.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="material_name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="total_value"
                        name="Total Value"
                        stroke="#8884d8"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="average_price"
                        name="Average Price"
                        stroke="#82ca9d"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Material Purchase Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Total Quantity</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Avg. Price</TableHead>
                      <TableHead>Purchase Count</TableHead>
                      <TableHead>Last Purchase</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materialAnalysis?.map((material) => (
                      <TableRow key={material.material_id}>
                        <TableCell>{material.material_name}</TableCell>
                        <TableCell>{material.total_quantity}</TableCell>
                        <TableCell>{formatCurrency(material.total_value)}</TableCell>
                        <TableCell>{formatCurrency(material.average_price)}</TableCell>
                        <TableCell>{material.purchase_count}</TableCell>
                        <TableCell>{format(parseISO(material.last_purchase_date), 'MMM d, yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="suppliers">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Performance Trends</CardTitle>
                <CardDescription>Track supplier performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={supplierAnalysis?.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="supplier_name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="total_value"
                        name="Total Value"
                        stroke="#8884d8"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="average_order_value"
                        name="Avg. Order Value"
                        stroke="#82ca9d"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Supplier Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Avg. Order Value</TableHead>
                      <TableHead>Purchase Count</TableHead>
                      <TableHead>Last Purchase</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplierAnalysis?.map((supplier) => (
                      <TableRow key={supplier.supplier_id}>
                        <TableCell>{supplier.supplier_name}</TableCell>
                        <TableCell>{formatCurrency(supplier.total_value)}</TableCell>
                        <TableCell>{formatCurrency(supplier.average_order_value)}</TableCell>
                        <TableCell>{supplier.purchase_count}</TableCell>
                        <TableCell>{format(parseISO(supplier.last_purchase_date), 'MMM d, yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="received">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Received Analysis Trends</CardTitle>
                <CardDescription>Track ordered vs received quantities over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={receivedAnalysis?.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="material_name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="unit_quantity"
                        name="Ordered Quantity"
                        stroke="#8884d8"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="actual_meter"
                        name="Received Quantity"
                        stroke="#82ca9d"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detailed Received Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Purchase #</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Ordered Qty</TableHead>
                      <TableHead>Received Qty</TableHead>
                      <TableHead>Difference</TableHead>
                      <TableHead>Value Impact</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receivedAnalysis?.map((item) => (
                      <TableRow key={`${item.purchase_id}-${item.material_id}`}>
                        <TableCell>{item.material_name}</TableCell>
                        <TableCell>{item.purchase_number}</TableCell>
                        <TableCell>{item.supplier_name}</TableCell>
                        <TableCell>{item.unit_quantity}</TableCell>
                        <TableCell>{item.actual_meter}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {item.difference > 0 ? (
                              <ArrowUp className="text-green-500 mr-1" />
                            ) : item.difference < 0 ? (
                              <ArrowDown className="text-red-500 mr-1" />
                            ) : null}
                            {item.difference}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {item.difference_value > 0 ? (
                              <TrendingUp className="text-green-500 mr-1" />
                            ) : item.difference_value < 0 ? (
                              <TrendingDown className="text-red-500 mr-1" />
                            ) : null}
                            {formatCurrency(item.difference_value)}
                          </div>
                        </TableCell>
                        <TableCell>{format(parseISO(item.purchase_date), 'MMM d, yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PurchaseAnalysis;
