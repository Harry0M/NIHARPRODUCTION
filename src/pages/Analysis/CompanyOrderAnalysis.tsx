import { useCompanyOrderCount } from "@/hooks/companies/useCompanyOrderCount";
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
import { AlertCircle, Users, Package, TrendingUp, ArrowUpDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";

const CompanyOrderAnalysis = () => {
  const { orderCounts, loading, error } = useCompanyOrderCount();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: string } | null>(null);

  const filteredAndSortedCounts = useMemo(() => {
    let filteredData = orderCounts.filter((company) =>
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
  }, [orderCounts, filter, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  const totalCompanies = orderCounts.length;
  const totalOrders = orderCounts.reduce((sum, company) => sum + company.totalOrders, 0);
  const companyWithMostOrders = orderCounts.reduce((max, company) => (max.totalOrders > company.totalOrders ? max : company), orderCounts[0] || { name: 'N/A', totalOrders: 0 });
  
  const top5Companies = [...orderCounts].sort((a, b) => b.totalOrders - a.totalOrders).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Company-wise Order Analysis</h1>
        <p className="text-muted-foreground">
          Analyze order distribution and find top-performing companies.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
            <CardTitle className="text-sm font-medium">Top Company</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyWithMostOrders.name}</div>
            <p className="text-xs text-muted-foreground">
              {companyWithMostOrders.totalOrders} orders
            </p>
          </CardContent>
        </Card>
      </div>

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
          <CardTitle>Order Counts per Company</CardTitle>
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
                  <Button variant="ghost" onClick={() => requestSort('asCompany')}>
                    Orders as Primary Company <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort('asSalesAccount')}>
                    Orders as Sales Account <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => requestSort('totalOrders')}>
                    Total Orders <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedCounts.map((company) => (
                <TableRow
                  key={company.id}
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => navigate(`/companies/${company.id}/orders`)}
                >
                  <TableCell>{company.name}</TableCell>
                  <TableCell>{company.asCompany}</TableCell>
                  <TableCell>{company.asSalesAccount}</TableCell>
                  <TableCell>{company.totalOrders}</TableCell>
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