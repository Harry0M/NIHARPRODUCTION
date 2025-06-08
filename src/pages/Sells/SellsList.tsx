import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Search, RefreshCw, Calendar, Package, Building } from "lucide-react";
import PaginationControls from "@/components/ui/pagination-controls";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/utils/formatters";
import { Database } from "@/integrations/supabase/types";

type CompletedOrder = Database["public"]["Tables"]["orders"]["Row"] & {
  sales_invoices?: { id: string }[];
  has_sales_invoice?: boolean;
};

interface SellsFilters {
  searchTerm: string;
  dateRange: {
    from: string;
    to: string;
  };
}

const SellsList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [loading, setLoading] = useState(true);  const [filters, setFilters] = useState<SellsFilters>({
    searchTerm: "",
    dateRange: { from: "", to: "" }
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const fetchCompletedOrders = useCallback(async () => {
    setLoading(true);
    try {
      // First get the total count for pagination
      let countQuery = supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed');

      if (filters.dateRange.from) {
        countQuery = countQuery.gte('order_date', filters.dateRange.from);
      }

      if (filters.dateRange.to) {
        countQuery = countQuery.lte('order_date', filters.dateRange.to);
      }

      if (filters.searchTerm) {
        countQuery = countQuery.or(`order_number.ilike.%${filters.searchTerm}%,company_name.ilike.%${filters.searchTerm}%`);
      }

      const { count, error: countError } = await countQuery;

      if (countError) throw countError;

      setTotalCount(count || 0);      // Then fetch the paginated data
      let query = supabase
        .from('orders')
        .select(`
          *,
          sales_invoices(id)
        `)
        .eq('status', 'completed');

      if (filters.dateRange.from) {
        query = query.gte('order_date', filters.dateRange.from);
      }

      if (filters.dateRange.to) {
        query = query.lte('order_date', filters.dateRange.to);
      }

      if (filters.searchTerm) {
        query = query.or(`order_number.ilike.%${filters.searchTerm}%,company_name.ilike.%${filters.searchTerm}%`);
      }

      // Add pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;      const { data, error } = await query
        .order('updated_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      // Process the data to add has_sales_invoice boolean
      const processedData = (data || []).map(order => ({
        ...order,
        has_sales_invoice: order.sales_invoices && order.sales_invoices.length > 0
      }));
      
      setOrders(processedData as CompletedOrder[]);
    } catch (error) {
      toast({
        title: "Error fetching completed orders",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    fetchCompletedOrders();
  }, [fetchCompletedOrders]);

  const handleRefresh = () => {
    fetchCompletedOrders();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  const getQuantityDisplay = (order: CompletedOrder) => {
    return order.quantity || 0;
  };

  const getOrderAmount = (order: CompletedOrder) => {
    // Use calculated_selling_price if available, otherwise calculate from rate * quantity
    if (order.calculated_selling_price) {
      return order.calculated_selling_price;
    }
    if (order.rate && order.quantity) {
      return order.rate * order.quantity;
    }
    return 0;
  };

  const getTotalRevenue = () => {
    return orders.reduce((total, order) => total + getOrderAmount(order), 0);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sells</h1>
            <p className="text-muted-foreground">View completed orders and sales data</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">Completed orders</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(getTotalRevenue())}
            </div>
            <p className="text-xs text-muted-foreground">From current page</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.length > 0 ? formatCurrency(getTotalRevenue() / orders.length) : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">Per order</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="h-6 w-1 rounded-full bg-primary inline-block"></span>
            Completed Orders
          </CardTitle>
          <CardDescription>View and manage completed orders (sales)</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders by number or company..."
                  value={filters.searchTerm}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, searchTerm: e.target.value }));
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="From date"
                  value={filters.dateRange.from}
                  onChange={(e) => {
                    setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, from: e.target.value }
                    }));
                    setPage(1);
                  }}
                  className="w-40"
                />
                <Input
                  type="date"
                  placeholder="To date"
                  value={filters.dateRange.to}
                  onChange={(e) => {
                    setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, to: e.target.value }
                    }));
                    setPage(1);
                  }}
                  className="w-40"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No completed orders found</h3>
              <p className="text-muted-foreground mb-4">
                {filters.searchTerm || filters.dateRange.from || filters.dateRange.to
                  ? "Try adjusting your search criteria"
                  : "No orders have been completed yet"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>                    <TableHead>Order Number</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Delivery Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invoice Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>                  {orders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/sells/create/${order.id}`)}
                    >
                      <TableCell className="font-medium">
                        {order.order_number}
                      </TableCell>
                      <TableCell>{order.company_name}</TableCell>
                      <TableCell>{getQuantityDisplay(order).toLocaleString()}</TableCell>
                      <TableCell>{formatDate(order.order_date)}</TableCell>
                      <TableCell>
                        {order.delivery_date ? formatDate(order.delivery_date) : '-'}
                      </TableCell>                      <TableCell>
                        {formatCurrency(getOrderAmount(order))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Completed
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/sells/create/${order.id}`);
                          }}
                        >
                          Create Invoice
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-6">
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(1);
                }}
                pageSizeOptions={[5, 10, 20, 50]}
                showPageSizeSelector={true}
                totalCount={totalCount}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellsList;
