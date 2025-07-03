import { useCompanyOrderCount } from "@/hooks/companies/useCompanyOrderCount";
import { useCompanyProfitAnalysis } from "@/hooks/companies/useCompanyProfitAnalysis";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/production/LoadingSpinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Users, Package, TrendingUp, ArrowUpDown, DollarSign, Target, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CompanyOrderAnalysis = () => {
  const { orderCounts, loading, error } = useCompanyOrderCount();
  const { profitData, loading: profitLoading, error: profitError } = useCompanyProfitAnalysis();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: string } | null>(null);

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Merge order counts with profit data
  const mergedData = useMemo(() => {
    return orderCounts.map(orderCount => {
      const profitInfo = profitData.find(p => p.id === orderCount.id);
      return {
        ...orderCount,
        totalRevenue: profitInfo?.totalRevenue || 0,
        totalCost: profitInfo?.totalCost || 0,
        totalProfit: profitInfo?.totalProfit || 0,
        averageOrderValue: profitInfo?.averageOrderValue || 0,
        averageProfit: profitInfo?.averageProfit || 0,
        profitMargin: profitInfo?.profitMargin || 0,
        mostProfitableOrder: profitInfo?.mostProfitableOrder || null,
        leastProfitableOrder: profitInfo?.leastProfitableOrder || null,
        ordersByMonth: profitInfo?.ordersByMonth || []
      };
    });
  }, [orderCounts, profitData]);

  const filteredAndSortedCounts = useMemo(() => {
    const filteredData = mergedData.filter((company) =>
      company.name.toLowerCase().includes(filter.toLowerCase())
    );

    if (sortConfig !== null) {
      filteredData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredData;
  }, [mergedData, filter, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  if (loading || profitLoading) {
    return <LoadingSpinner />;
  }

  if (error || profitError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error?.message || profitError?.message}</AlertDescription>
      </Alert>
    );
  }

  const totalCompanies = orderCounts.length;
  const totalOrders = orderCounts.reduce((sum, company) => sum + company.totalOrders, 0);
  const totalRevenue = profitData.reduce((sum, company) => sum + company.totalRevenue, 0);
  const totalProfit = profitData.reduce((sum, company) => sum + company.totalProfit, 0);
  const overallProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const companyWithMostOrders = orderCounts.reduce((max, company) => (max.totalOrders > company.totalOrders ? max : company), orderCounts[0] || { name: 'N/A', totalOrders: 0 });
  const mostProfitableCompany = profitData.reduce((max, company) => (max.totalProfit > company.totalProfit ? max : company), profitData[0] || { name: 'N/A', totalProfit: 0 });
  
  const top5Companies = [...mergedData].sort((a, b) => b.totalOrders - a.totalOrders).slice(0, 5);
  const top5ProfitableCompanies = [...profitData].sort((a, b) => b.totalProfit - a.totalProfit).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Company-wise Order Analysis</h1>
        <p className="text-muted-foreground">
          Analyze order distribution and find top-performing companies.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompanies}</div>
          </CardContent>
        </Card>
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
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalProfit)}</div>
            <p className="text-xs text-muted-foreground">
              {overallProfitMargin.toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Order Volume</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{companyWithMostOrders.name}</div>
            <p className="text-xs text-muted-foreground">
              {companyWithMostOrders.totalOrders} orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Profitable</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{mostProfitableCompany.name}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(mostProfitableCompany.totalProfit)} profit
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Companies by Order Count</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={top5Companies}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalOrders" fill="#8884d8" name="Total Orders" />
                <Bar dataKey="asCompany" fill="#82ca9d" name="As Main Company" />
                <Bar dataKey="asSalesAccount" fill="#ffc658" name="As Sales Account" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Companies by Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={top5ProfitableCompanies}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => [formatCurrency(Number(value)), 'Amount']} />
                <Legend />
                <Bar dataKey="totalRevenue" fill="#8884d8" name="Revenue" />
                <Bar dataKey="totalProfit" fill="#82ca9d" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">Most Profitable Companies</h4>
              <div className="space-y-1">
                {top5ProfitableCompanies.slice(0, 3).map((company, index) => (
                  <div key={company.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <span className="w-4 h-4 bg-green-500 rounded-full text-white text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      {company.name}
                    </span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(company.totalProfit)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-blue-600">Highest Order Volume</h4>
              <div className="space-y-1">
                {top5Companies.slice(0, 3).map((company, index) => (
                  <div key={company.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <span className="w-4 h-4 bg-blue-500 rounded-full text-white text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      {company.name}
                    </span>
                    <span className="font-medium text-blue-600">
                      {company.totalOrders} orders
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-purple-600">Best Profit Margins</h4>
              <div className="space-y-1">
                {[...profitData].sort((a, b) => b.profitMargin - a.profitMargin).slice(0, 3).map((company, index) => (
                  <div key={company.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <span className="w-4 h-4 bg-purple-500 rounded-full text-white text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      {company.name}
                    </span>
                    <span className="font-medium text-purple-600">
                      {company.profitMargin.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company Analysis & Profit Insights</CardTitle>
          <Input
            placeholder="Filter companies..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm mt-2"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort('name')}>
                    Company Name <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort('totalOrders')}>
                    Total Orders <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort('totalRevenue')}>
                    Total Revenue <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort('totalProfit')}>
                    Total Profit <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort('profitMargin')}>
                    Profit Margin <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort('averageOrderValue')}>
                    Avg Order Value <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Most Profitable Order</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedCounts.map((company) => (
                <TableRow
                  key={company.id}
                  className="cursor-pointer hover:bg-muted"
                >
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{company.totalOrders}</span>
                      <span className="text-xs text-muted-foreground">
                        Main: {company.asCompany} | Sales: {company.asSalesAccount}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{formatCurrency(company.totalRevenue)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${company.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(company.totalProfit)}
                      </span>
                      {company.totalProfit >= 0 ? (
                        <Badge className="bg-green-100 text-green-800">Profitable</Badge>
                      ) : (
                        <Badge variant="destructive">Loss</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${company.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {company.profitMargin.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{formatCurrency(company.averageOrderValue)}</span>
                  </TableCell>
                  <TableCell>
                    {company.mostProfitableOrder ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{company.mostProfitableOrder.orderNumber}</span>
                        <span className="text-xs text-green-600">
                          {formatCurrency(company.mostProfitableOrder.profit)} ({company.mostProfitableOrder.profitMargin.toFixed(1)}%)
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No orders</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/companies/${company.id}/orders`)}
                    >
                      View Orders
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyOrderAnalysis; 