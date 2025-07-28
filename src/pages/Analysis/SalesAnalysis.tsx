import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, TrendingUp, TrendingDown, DollarSign, Package, Users, BarChart3, FileText, Download, Eye, ArrowLeft, ExternalLink } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { formatCurrency } from "@/utils/formatters";
import type { DateRange as ReactDayPickerDateRange } from "react-day-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SalesInvoice {
  id: string;
  invoice_number: string;
  company_name: string;
  product_name: string;
  quantity: number;
  rate: number;
  subtotal: number;
  gst_percentage: number;
  gst_amount: number;
  transport_included: boolean;
  transport_charge: number;
  other_expenses: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
  notes?: string;
  orders?: {
    id: string;
    order_number: string;
    order_date: string;
    delivery_date?: string;
    status: string;
  };
}

interface SalesMetrics {
  totalRevenue: number;
  totalInvoices: number;
  averageOrderValue: number;
  totalQuantitySold: number;
  growthRate: number;
  topCompanies: Array<{ company: string; revenue: number; invoices: number }>;
  monthlyTrends: Array<{ month: string; revenue: number; invoices: number; quantity: number }>;
  productPerformance: Array<{ product: string; revenue: number; quantity: number; avgRate: number }>;
  gstBreakdown: Array<{ rate: string; amount: number; count: number }>;
  revenueBreakdown: Array<{ type: string; amount: number; percentage: number }>;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const SalesAnalysis = () => {
  const navigate = useNavigate();
  const [salesData, setSalesData] = useState<SalesInvoice[]>([]);
  const [metrics, setMetrics] = useState<SalesMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [companyInvoices, setCompanyInvoices] = useState<SalesInvoice[]>([]);
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [dateRange, setDateRange] = useState<ReactDayPickerDateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1),
    to: new Date()
  });

  const fetchSalesData = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('sales_invoices')
        .select(`
          *,
          orders (
            id,
            order_number,
            order_date,
            delivery_date,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (dateRange.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      setSalesData(data || []);
      calculateMetrics(data || []);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      toast({
        title: "Error fetching sales data",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to]);

  const calculateMetrics = (data: SalesInvoice[]) => {
    if (!data.length) {
      setMetrics(null);
      return;
    }

    // Basic metrics
    const totalRevenue = data.reduce((sum, invoice) => sum + invoice.total_amount, 0);
    const totalInvoices = data.length;
    const averageOrderValue = totalRevenue / totalInvoices;
    const totalQuantitySold = data.reduce((sum, invoice) => sum + invoice.quantity, 0);

    // Growth rate calculation (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const last30Days = data.filter(inv => new Date(inv.created_at) >= thirtyDaysAgo);
    const previous30Days = data.filter(inv => 
      new Date(inv.created_at) >= sixtyDaysAgo && 
      new Date(inv.created_at) < thirtyDaysAgo
    );

    const last30Revenue = last30Days.reduce((sum, inv) => sum + inv.total_amount, 0);
    const previous30Revenue = previous30Days.reduce((sum, inv) => sum + inv.total_amount, 0);
    const growthRate = previous30Revenue ? ((last30Revenue - previous30Revenue) / previous30Revenue) * 100 : 0;

    // Top companies
    const companyStats = data.reduce((acc, invoice) => {
      if (!acc[invoice.company_name]) {
        acc[invoice.company_name] = { revenue: 0, invoices: 0 };
      }
      acc[invoice.company_name].revenue += invoice.total_amount;
      acc[invoice.company_name].invoices += 1;
      return acc;
    }, {} as Record<string, { revenue: number; invoices: number }>);

    const topCompanies = Object.entries(companyStats)
      .map(([company, stats]) => ({ company, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Monthly trends
    const monthlyStats = data.reduce((acc, invoice) => {
      const month = new Date(invoice.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      if (!acc[month]) {
        acc[month] = { revenue: 0, invoices: 0, quantity: 0 };
      }
      acc[month].revenue += invoice.total_amount;
      acc[month].invoices += 1;
      acc[month].quantity += invoice.quantity;
      return acc;
    }, {} as Record<string, { revenue: number; invoices: number; quantity: number }>);

    const monthlyTrends = Object.entries(monthlyStats)
      .map(([month, stats]) => ({ month, ...stats }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // Product performance
    const productStats = data.reduce((acc, invoice) => {
      if (!acc[invoice.product_name]) {
        acc[invoice.product_name] = { revenue: 0, quantity: 0, totalRate: 0, count: 0 };
      }
      acc[invoice.product_name].revenue += invoice.total_amount;
      acc[invoice.product_name].quantity += invoice.quantity;
      acc[invoice.product_name].totalRate += invoice.rate;
      acc[invoice.product_name].count += 1;
      return acc;
    }, {} as Record<string, { revenue: number; quantity: number; totalRate: number; count: number }>);

    const productPerformance = Object.entries(productStats)
      .map(([product, stats]) => ({
        product,
        revenue: stats.revenue,
        quantity: stats.quantity,
        avgRate: stats.totalRate / stats.count
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // GST breakdown
    const gstStats = data.reduce((acc, invoice) => {
      const rate = invoice.gst_percentage.toString() + '%';
      if (!acc[rate]) {
        acc[rate] = { amount: 0, count: 0 };
      }
      acc[rate].amount += invoice.gst_amount;
      acc[rate].count += 1;
      return acc;
    }, {} as Record<string, { amount: number; count: number }>);

    const gstBreakdown = Object.entries(gstStats)
      .map(([rate, stats]) => ({ rate, ...stats }))
      .sort((a, b) => b.amount - a.amount);

    // Revenue breakdown
    const totalSubtotal = data.reduce((sum, inv) => sum + inv.subtotal, 0);
    const totalGST = data.reduce((sum, inv) => sum + inv.gst_amount, 0);
    const totalTransport = data.reduce((sum, inv) => sum + inv.transport_charge, 0);
    const totalOtherExpenses = data.reduce((sum, inv) => sum + inv.other_expenses, 0);

    const revenueBreakdown = [
      { type: 'Base Amount', amount: totalSubtotal, percentage: (totalSubtotal / totalRevenue) * 100 },
      { type: 'GST', amount: totalGST, percentage: (totalGST / totalRevenue) * 100 },
      { type: 'Transport', amount: totalTransport, percentage: (totalTransport / totalRevenue) * 100 },
      { type: 'Other Expenses', amount: totalOtherExpenses, percentage: (totalOtherExpenses / totalRevenue) * 100 }
    ].filter(item => item.amount > 0);

    setMetrics({
      totalRevenue,
      totalInvoices,
      averageOrderValue,
      totalQuantitySold,
      growthRate,
      topCompanies,
      monthlyTrends,
      productPerformance,
      gstBreakdown,
      revenueBreakdown
    });
  };

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  const exportSalesData = () => {
    if (!salesData.length) return;

    const csvData = salesData.map(invoice => ({
      Invoice_Number: invoice.invoice_number,
      Date: new Date(invoice.created_at).toLocaleDateString(),
      Company: invoice.company_name,
      Product: invoice.product_name,
      Quantity: invoice.quantity,
      Rate: invoice.rate,
      Subtotal: invoice.subtotal,
      GST_Percentage: invoice.gst_percentage,
      GST_Amount: invoice.gst_amount,
      Transport_Charge: invoice.transport_charge,
      Other_Expenses: invoice.other_expenses,
      Total_Amount: invoice.total_amount,
      Order_Number: invoice.orders?.order_number || '',
    }));

    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleViewCompanyInvoices = (companyName: string) => {
    const invoices = salesData.filter(invoice => invoice.company_name === companyName);
    setCompanyInvoices(invoices);
    setSelectedCompany(companyName);
    setShowCompanyDialog(true);
  };

  const handleViewInvoiceDetail = (invoiceId: string) => {
    navigate(`/sells/invoice/${invoiceId}`);
  };

  const exportCompanyInvoices = () => {
    if (!companyInvoices.length) return;

    const csvData = companyInvoices.map(invoice => ({
      Invoice_Number: invoice.invoice_number,
      Date: new Date(invoice.created_at).toLocaleDateString(),
      Product: invoice.product_name,
      Quantity: invoice.quantity,
      Rate: invoice.rate,
      Subtotal: invoice.subtotal,
      GST_Amount: invoice.gst_amount,
      Transport_Charge: invoice.transport_charge,
      Other_Expenses: invoice.other_expenses,
      Total_Amount: invoice.total_amount,
      Order_Number: invoice.orders?.order_number || '',
      Notes: invoice.notes || '',
    }));

    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCompany}-invoices-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales Analysis</h1>
            <p className="text-muted-foreground">
              Analyze your sales performance and invoice data
            </p>
          </div>
          <div className="flex items-center gap-4">
            <DatePickerWithRange
              date={dateRange}
              onChange={(date) => setDateRange(date || { from: undefined, to: undefined })}
            />
            <Button onClick={fetchSalesData} size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Sales Data Found</h3>
            <p className="text-muted-foreground text-center">
              No sales invoices found for the selected date range. Try adjusting your filters or create some invoices first.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Analysis</h1>
          <p className="text-muted-foreground">
            Comprehensive analysis of your sales performance and invoice data
          </p>
        </div>
        <div className="flex items-center gap-4">
          <DatePickerWithRange
            date={dateRange}
            onChange={(date) => setDateRange(date || { from: undefined, to: undefined })}
          />
          <Button onClick={exportSalesData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={fetchSalesData} size="sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {metrics.growthRate > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={metrics.growthRate > 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(metrics.growthRate).toFixed(1)}%
              </span>
              <span className="ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalInvoices.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Invoices processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">
              Per invoice average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Units Sold</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalQuantitySold.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total quantity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Composition of total revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Pie
                  data={metrics.revenueBreakdown}
                  dataKey="amount"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ type, percentage }) => `${type}: ${percentage.toFixed(1)}%`}
                >
                  {metrics.revenueBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Companies */}
        <Card>
          <CardHeader>
            <CardTitle>Top Companies by Revenue</CardTitle>
            <CardDescription>Best performing clients</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.topCompanies.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="company" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="revenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top Companies Detail</CardTitle>
            <CardDescription>Detailed breakdown of top performing companies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.topCompanies.slice(0, 10).map((company, index) => (
                <div key={company.company} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{company.company}</p>
                      <p className="text-sm text-muted-foreground">{company.invoices} invoices</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(company.revenue)}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(company.revenue / company.invoices)} avg
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewCompanyInvoices(company.company)}
                      className="ml-2"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* GST Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>GST Analysis</CardTitle>
            <CardDescription>Tax collection breakdown by rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.gstBreakdown.map((gst, index) => (
                <div key={gst.rate} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{gst.rate}</Badge>
                    <div>
                      <p className="font-medium">GST Rate {gst.rate}</p>
                      <p className="text-sm text-muted-foreground">{gst.count} invoices</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(gst.amount)}</p>
                    <p className="text-sm text-muted-foreground">Total collected</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales Invoices</CardTitle>
          <CardDescription>Latest invoice transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {salesData.slice(0, 10).map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">{invoice.company_name}</p>
                    <p className="text-sm text-muted-foreground">{invoice.product_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(invoice.total_amount)}</p>
                  <p className="text-sm text-muted-foreground">
                    {invoice.quantity} units @ {formatCurrency(invoice.rate)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Company Invoices Dialog */}
      <Dialog open={showCompanyDialog} onOpenChange={setShowCompanyDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCompanyDialog(false)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <DialogTitle>Invoices for {selectedCompany}</DialogTitle>
                <DialogDescription>
                  Viewing {companyInvoices.length} invoices for {selectedCompany}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Total Revenue: {formatCurrency(companyInvoices.reduce((sum, inv) => sum + inv.total_amount, 0))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={exportCompanyInvoices}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Company Data
              </Button>
            </div>
            
            <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>GST</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companyInvoices.map((invoice) => (
                    <TableRow key={`${invoice.invoice_number}-${invoice.product_name}`}>
                      <TableCell className="font-medium">
                        <button
                          onClick={() => handleViewInvoiceDetail(invoice.id)}
                          className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                          {invoice.invoice_number}
                        </button>
                      </TableCell>
                      <TableCell>{new Date(invoice.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{invoice.product_name}</TableCell>
                      <TableCell>{invoice.quantity}</TableCell>
                      <TableCell>{formatCurrency(invoice.rate)}</TableCell>
                      <TableCell>{formatCurrency(invoice.gst_amount || 0)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(invoice.total_amount)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewInvoiceDetail(invoice.id)}
                          className="h-7 px-2"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesAnalysis;
