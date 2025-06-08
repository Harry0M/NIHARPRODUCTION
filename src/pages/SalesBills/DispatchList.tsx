import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, FileText, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import PaginationControls from "@/components/ui/pagination-controls";
import { showToast } from "@/components/ui/enhanced-toast";
import { fetchCompletedDispatches } from "@/services/salesBillService";
import { DispatchWithOrderDetails } from "@/types/salesBill";

export default function DispatchList() {
  const navigate = useNavigate();
  const [dispatches, setDispatches] = useState<DispatchWithOrderDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch dispatches on component mount and when search/pagination changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, totalCount } = await fetchCompletedDispatches(page, pageSize, searchTerm);
        setDispatches(data);
        setTotalCount(totalCount);
      } catch (error: any) {
        showToast({
          title: "Error fetching dispatches",
          description: error.message,
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

  // Navigate to sales bill creation page with the selected dispatch
  const handleCreateSalesBill = (dispatch: DispatchWithOrderDetails) => {
    navigate(`/sales-bills/new/${dispatch.id}`);
  };

  // Total dispatch quantity calculation
  const calculateTotalQuantity = (dispatch: DispatchWithOrderDetails) => {
    return dispatch.dispatch_batches.reduce((total, batch) => total + batch.quantity, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Sales Bill</h1>
          <p className="text-muted-foreground">Select a completed dispatch to create a sales bill</p>
        </div>
        <Button variant="ghost" onClick={() => navigate("/sales-bills")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sales Bills
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Completed Dispatches
          </CardTitle>
          <CardDescription>All dispatches that have been completed and ready for billing</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-6 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by order number or company..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          {/* Dispatches Table */}
          {loading ? (
            <div className="py-8 text-center">Loading dispatches...</div>
          ) : dispatches.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                No completed dispatches found.
                {searchTerm && " Try a different search term."}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Dispatch Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dispatches.map((dispatch) => (                      <TableRow key={dispatch.id}>
                        <TableCell className="font-medium">
                          {dispatch.orders?.order_number || "N/A"}
                        </TableCell>
                        <TableCell>{dispatch.orders?.company_name || "N/A"}</TableCell>
                        <TableCell>
                          {dispatch.catalog_name || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {calculateTotalQuantity(dispatch)} pcs
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(dispatch.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleCreateSalesBill(dispatch)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Create Bill
                          </Button>
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
