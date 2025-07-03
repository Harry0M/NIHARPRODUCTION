
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, TrendingUp, DollarSign, Package, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export const CompanyOrders = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<'date' | 'profit' | 'margin' | 'quantity'>('date');

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Helper function to format currency with decimals
  const formatCurrencyDecimals = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Updated query to fetch company info for display
  const { data: company } = useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Updated query to fetch all orders for this company (both as main company and sales account)
  const { data: orders, isLoading } = useQuery({
    queryKey: ['companyOrders', id],
    queryFn: async () => {
      // Get orders where company is either the main company or sales account
      const { data: allOrders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_components(*)
        `)
        .or(`company_id.eq.${id},sales_account_id.eq.${id}`)
        .order('order_date', { ascending: false });
      
      if (error) {
        toast({
          title: "Error fetching orders",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }
      
      return allOrders || [];
    },
    enabled: !!id,
  });

  // Process orders with financial calculations
  const processedOrders = orders?.map(order => {
    const orderQuantity = Number(order.order_quantity) || Number(order.quantity) || 1;
    const totalQuantity = Number(order.quantity) || orderQuantity;
    
    // Financial data
    const totalCost = Number(order.total_cost) || 0;
    const sellingPrice = Number(order.calculated_selling_price) || Number(order.rate) || 0;
    const materialCost = Number(order.material_cost) || 0;
    const productionCost = Number(order.production_cost) || 
      (Number(order.cutting_charge) + Number(order.printing_charge) + Number(order.stitching_charge) + Number(order.transport_charge)) || 0;
    
    // Calculate per-piece values based on order quantity (not total quantity)
    const costPerPiece = orderQuantity > 0 ? totalCost / orderQuantity : 0;
    const sellingPricePerPiece = orderQuantity > 0 ? sellingPrice / orderQuantity : 0;
    const materialCostPerPiece = orderQuantity > 0 ? materialCost / orderQuantity : 0;
    const productionCostPerPiece = orderQuantity > 0 ? productionCost / orderQuantity : 0;
    
    // Profit calculations
    const totalProfit = sellingPrice - totalCost;
    const profitPerPiece = sellingPricePerPiece - costPerPiece;
    const profitMargin = sellingPrice > 0 ? (totalProfit / sellingPrice) * 100 : 0;
    
    return {
      ...order,
      orderQuantity,
      totalQuantity,
      totalCost,
      sellingPrice,
      materialCost,
      productionCost,
      costPerPiece,
      sellingPricePerPiece,
      materialCostPerPiece,
      productionCostPerPiece,
      totalProfit,
      profitPerPiece,
      profitMargin
    };
  }) || [];

  // Sort orders based on selected criteria
  const sortedOrders = [...processedOrders].sort((a, b) => {
    switch (sortBy) {
      case 'profit':
        return b.totalProfit - a.totalProfit;
      case 'margin':
        return b.profitMargin - a.profitMargin;
      case 'quantity':
        return b.orderQuantity - a.orderQuantity;
      case 'date':
      default:
        return new Date(b.order_date).getTime() - new Date(a.order_date).getTime();
    }
  });

  // Calculate summary statistics
  const totalOrders = processedOrders.length;
  const totalRevenue = processedOrders.reduce((sum, order) => sum + order.sellingPrice, 0);
  const totalCosts = processedOrders.reduce((sum, order) => sum + order.totalCost, 0);
  const totalProfits = totalRevenue - totalCosts;
  const avgProfitMargin = totalRevenue > 0 ? (totalProfits / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/companies')}
        >
          <ArrowLeft size={16} className="mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">
          {company ? `${company.name} - Orders` : 'Company Orders'}
        </h1>
      </div>

      {!isLoading && processedOrders.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalProfits >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalProfits)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Profit Margin</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${avgProfitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {avgProfitMargin.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Order Details with Financial Analysis</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={sortBy === 'date' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('date')}
              >
                Sort by Date
              </Button>
              <Button
                variant={sortBy === 'profit' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('profit')}
              >
                Sort by Profit
              </Button>
              <Button
                variant={sortBy === 'margin' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('margin')}
              >
                Sort by Margin
              </Button>
              <Button
                variant={sortBy === 'quantity' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('quantity')}
              >
                Sort by Quantity
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : sortedOrders?.length === 0 ? (
            <div className="text-center p-8">
              <p className="text-muted-foreground">No orders found for this company.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Info</TableHead>
                    <TableHead>Quantities</TableHead>
                    <TableHead>Total Costs</TableHead>
                    <TableHead>Per Piece Costs</TableHead>
                    <TableHead>Selling Prices</TableHead>
                    <TableHead>Profit Analysis</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedOrders?.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{order.order_number}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(order.order_date).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.company_id === id ? 'Main Company' : 'Sales Account'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Size: {order.bag_length}" × {order.bag_width}"
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">Order Qty: {order.orderQuantity}</div>
                          <div className="text-sm text-muted-foreground">Total Qty: {order.totalQuantity}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{formatCurrency(order.totalCost)}</div>
                          <div className="text-xs text-muted-foreground">
                            Material: {formatCurrency(order.materialCost)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Production: {formatCurrency(order.productionCost)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{formatCurrencyDecimals(order.costPerPiece)}</div>
                          <div className="text-xs text-muted-foreground">
                            Material: {formatCurrencyDecimals(order.materialCostPerPiece)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Production: {formatCurrencyDecimals(order.productionCostPerPiece)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{formatCurrency(order.sellingPrice)}</div>
                          <div className="text-sm text-muted-foreground">
                            Per piece: {formatCurrencyDecimals(order.sellingPricePerPiece)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className={`font-medium ${order.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(order.totalProfit)}
                          </div>
                          <div className={`text-sm ${order.profitPerPiece >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Per piece: {formatCurrencyDecimals(order.profitPerPiece)}
                          </div>
                          <Badge 
                            variant={order.profitMargin >= 0 ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {order.profitMargin.toFixed(1)}% margin
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          View Details
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
    </div>
  );
};

export default CompanyOrders;
