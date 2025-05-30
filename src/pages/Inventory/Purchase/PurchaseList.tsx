import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/utils/formatters";

interface Purchase {
  id: string;
  purchase_number: string;
  purchase_date: string;
  supplier_id: string;
  total_amount: number;
  status: string;
  suppliers: {
    name: string;
  };
  purchase_items: {
    id: string;
    material_id: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }[];
}

const PurchaseList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Main purchases query with pagination
  const { data: purchasesData, isLoading, refetch } = useQuery({
    queryKey: ['purchases', page, pageSize, searchTerm],
    queryFn: async () => {
      // First get the total count for pagination
      const countQuery = supabase
        .from('purchases')
        .select('id', { count: 'exact', head: true });
      
      if (searchTerm) {
        countQuery.or(
          `purchase_number.ilike.%${searchTerm}%,suppliers.name.ilike.%${searchTerm}%`
        ).not('id', 'is', null);
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) {
        console.error("Error fetching purchases count:", countError);
        throw countError;
      }
      
      setTotalCount(count || 0);
      
      // Then fetch the paginated data
      let query = supabase
        .from('purchases')
        .select('*, suppliers(name), purchase_items(id, material_id, quantity, unit_price, line_total)');
      
      if (searchTerm) {
        query = query.or(
          `purchase_number.ilike.%${searchTerm}%,suppliers.name.ilike.%${searchTerm}%`
        );
      }
      
      // Add pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query
        .order('purchase_date', { ascending: false })
        .range(from, to);
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching purchases:", error);
        throw error;
      }
      
      return data as Purchase[];
    },
    keepPreviousData: true,
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const renderPaginationLinks = () => {
    const totalPages = Math.ceil(totalCount / pageSize);
    const links = [];

    // Previous button
    links.push(
      <PaginationItem key="prev">
        <PaginationPrevious
          onClick={() => page > 1 && handlePageChange(page - 1)}
          className={page === 1 ? "pointer-events-none opacity-50" : ""}
        />
      </PaginationItem>
    );

    // Calculate which page links to show
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    // First page
    if (startPage > 1) {
      links.push(
        <PaginationItem key={1}>
          <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
        </PaginationItem>
      );
      
      if (startPage > 2) {
        links.push(
          <PaginationItem key="ellipsis1">...</PaginationItem>
        );
      }
    }

    // Page links
    for (let i = startPage; i <= endPage; i++) {
      links.push(
        <PaginationItem key={i}>
          <PaginationLink 
            onClick={() => handlePageChange(i)}
            isActive={page === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        links.push(
          <PaginationItem key="ellipsis2">...</PaginationItem>
        );
      }
      
      links.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Next button
    links.push(
      <PaginationItem key="next">
        <PaginationNext
          onClick={() => page < totalPages && handlePageChange(page + 1)}
          className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
        />
      </PaginationItem>
    );

    return links;
  };

  const goToDetail = (id: string) => {
    navigate(`/inventory/purchases/${id}`);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-bold">Purchases</CardTitle>
            <CardDescription>
              Manage purchase entries for inventory stock items
            </CardDescription>
          </div>
          <Button 
            onClick={() => navigate("/inventory/purchases/new")} 
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            New Purchase
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search purchases..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="my-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                Loading...
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Loading purchases...</p>
          </div>
        ) : purchasesData && purchasesData.length > 0 ? (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Purchase #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchasesData.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">
                        {purchase.purchase_number}
                      </TableCell>
                      <TableCell>
                        {new Date(purchase.purchase_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{purchase.suppliers?.name || "N/A"}</TableCell>
                      <TableCell>{purchase.purchase_items?.length || 0}</TableCell>
                      <TableCell>{formatCurrency(purchase.total_amount)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClass(purchase.status)}>
                          {purchase.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => goToDetail(purchase.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalCount > pageSize && (
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    {renderPaginationLinks()}
                  </PaginationContent>
                </Pagination>
                <div className="mt-2 flex justify-end">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Items per page:</span>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) => {
                        setPageSize(Number(value));
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={pageSize.toString()} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="my-16 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-muted p-3">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No purchases found</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              {searchTerm
                ? `No purchases matching "${searchTerm}" were found. Try a different search term.`
                : "You haven't created any purchases yet. Click 'New Purchase' to get started."}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => navigate("/inventory/purchases/new")}
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Purchase
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PurchaseList;
