import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  Plus, 
  Search, 
  FileCheck, 
  Clock, 
  BanknoteIcon, 
  XCircle 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import PaginationControls from "@/components/ui/pagination-controls";
import { showToast } from "@/components/ui/enhanced-toast";
import { fetchSalesBills } from "@/services/salesBillService";
import type { SalesBill } from "@/types/salesBill";

export default function SalesBillList() {
  const navigate = useNavigate();
  const [bills, setBills] = useState<SalesBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch sales bills on component mount and when search/pagination changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, totalCount } = await fetchSalesBills(page, pageSize, searchTerm);
        setBills(data);
        setTotalCount(totalCount);      } catch (error) {
        showToast({
          title: "Error fetching sales bills",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          type: "error"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, pageSize, searchTerm]);

  // Handle search input
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "draft":
        return "secondary";
      case "sent":
        return "default";
      case "paid":
        return "success";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Get payment status badge variant
  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "partial":
        return "default";
      case "paid":
        return "success";
      case "overdue":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <FileText className="h-4 w-4 mr-1" />;
      case "sent":
        return <FileCheck className="h-4 w-4 mr-1" />;
      case "paid":
        return <BanknoteIcon className="h-4 w-4 mr-1" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 mr-1" />;
      default:
        return <Clock className="h-4 w-4 mr-1" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Bills</h1>
          <p className="text-muted-foreground">Manage your sales bills</p>
        </div>
        <Button onClick={() => navigate("/sales-bills/select-dispatch")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Sales Bill
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Sales Bills
          </CardTitle>
          <CardDescription>View and manage all your sales bills</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-6 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by bill number, company or product..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          {/* Sales Bills Table */}
          {loading ? (
            <div className="py-8 text-center">Loading sales bills...</div>
          ) : bills.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                No sales bills found.
                {searchTerm && " Try a different search term."}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill #</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bills.map((bill) => (
                      <TableRow 
                        key={bill.id}
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => navigate(`/sales-bills/${bill.id}`)}
                      >
                        <TableCell className="font-medium">{bill.bill_number}</TableCell>
                        <TableCell>{bill.company_name}</TableCell>
                        <TableCell>{bill.catalog_name}</TableCell>
                        <TableCell>₹{bill.total_amount.toFixed(2)}</TableCell>
                        <TableCell>{new Date(bill.bill_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(bill.status)} className="flex w-fit items-center">
                            {getStatusIcon(bill.status)}
                            {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPaymentStatusBadgeVariant(bill.payment_status)}>
                            {bill.payment_status.charAt(0).toUpperCase() + bill.payment_status.slice(1)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {totalCount > 0 && (
                <div className="mt-6">
                  <PaginationControls
                    currentPage={page}
                    totalPages={Math.ceil(totalCount / pageSize)}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={(size) => {
                      setPageSize(size);
                      setPage(1); // Reset to first page when changing page size
                    }}
                    pageSizeOptions={[10, 20, 50]}
                    showPageSizeSelector={true}
                    totalCount={totalCount}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
