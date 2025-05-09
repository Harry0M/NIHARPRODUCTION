
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  ArrowLeft, Search, FileText, ExternalLink, 
  ArrowDownCircle, ArrowUpCircle, ChevronDown, Info 
} from "lucide-react";
import { LoadingSpinner } from "@/components/production/LoadingSpinner";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Types for transaction data
interface TransactionHistoryItem {
  id: string;
  material_id: string;
  material_name: string;
  transaction_type: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  transaction_date: string;
  unit: string;
  reference_type: string | null;
  reference_id: string | null;
  reference_number: string | null;
  notes: string | null;
  metadata: any;
}

// Filter type
interface TransactionFilters {
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
  materialId: string | null;
  transactionType: string | null;
  referenceType: string | null;
  searchQuery: string;
}

const TransactionHistory = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 15;
  
  // Filter state
  const [filters, setFilters] = useState<TransactionFilters>({
    dateRange: { startDate: null, endDate: null },
    materialId: null,
    transactionType: null,
    referenceType: null,
    searchQuery: "",
  });
  
  // Fetch all materials for dropdown
  const { data: materials } = useQuery({
    queryKey: ['materials-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("id, material_name");
        
      if (error) throw error;
      return data || [];
    }
  });
  
  // Fetch transaction history with filters
  const { data: transactionData, isLoading } = useQuery({
    queryKey: ['transaction-history', filters, page],
    queryFn: async () => {
      // Start with base query
      let query = supabase
        .from("inventory_transaction_log")
        .select(`
          *,
          inventory!inventory_transaction_log_material_id_fkey (
            material_name, unit
          )
        `, { count: 'exact' });
      
      // Apply filters
      if (filters.materialId && filters.materialId !== 'all') {
        query = query.eq('material_id', filters.materialId);
      }
      
      if (filters.transactionType && filters.transactionType !== 'all') {
        query = query.eq('transaction_type', filters.transactionType);
      }
      
      if (filters.referenceType) {
        query = query.eq('reference_type', filters.referenceType);
      }
      
      if (filters.dateRange.startDate) {
        query = query.gte('transaction_date', filters.dateRange.startDate.toISOString());
      }
      
      if (filters.dateRange.endDate) {
        query = query.lte('transaction_date', filters.dateRange.endDate.toISOString());
      }
      
      if (filters.searchQuery) {
        query = query.or(
          `notes.ilike.%${filters.searchQuery}%,reference_number.ilike.%${filters.searchQuery}%`
        );
      }
      
      // Add pagination
      query = query
        .order('transaction_date', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      // Process the results to include material name
      const processedData = data.map(item => ({
        ...item,
        material_name: item.inventory?.material_name || "Unknown Material",
        unit: item.inventory?.unit || ""
      }));
      
      return {
        transactions: processedData,
        totalCount: count || 0,
        pageCount: Math.ceil((count || 0) / pageSize)
      };
    }
  });
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
      dateRange: { startDate: null, endDate: null },
      materialId: null,
      transactionType: null,
      referenceType: null,
      searchQuery: "",
    });
    setPage(1);
  };
  
  // Update a single filter
  const updateFilter = (key: keyof TransactionFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };
  
  // Get transaction type badge color
  const getTransactionTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'consumption':
      case 'order':
      case 'usage':
        return 'destructive';
      case 'purchase':
      case 'addition':
      case 'refill':
        return 'green';
      case 'adjustment':
        return 'yellow';
      default:
        return 'secondary';
    }
  };
  
  // Get reference type display text
  const getReferenceTypeDisplay = (type: string | null) => {
    if (!type) return "Manual Entry";
    
    switch (type) {
      case 'Order':
        return "Order";
      case 'Purchase':
        return "Purchase";
      case 'Adjustment':
        return "Inventory Adjustment";
      default:
        return type;
    }
  };
  
  // Navigate to reference
  const navigateToReference = (type: string | null, id: string | null) => {
    if (!type || !id) return;
    
    switch (type) {
      case 'Order':
        navigate(`/orders/${id}`);
        break;
      case 'Purchase':
        navigate(`/purchases/${id}`);
        break;
      default:
        // Do nothing for unknown reference types
    }
  };
  
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1.5">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/analysis')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Material Transaction History</h1>
        </div>
        <p className="text-muted-foreground">
          View detailed history of all material transactions, including usage in orders
        </p>
      </div>
      
      {/* Filters Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Filters</span>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search notes, order #..."
                  className="pl-8"
                  value={filters.searchQuery}
                  onChange={(e) => updateFilter('searchQuery', e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label>Date Range</Label>
              <DatePickerWithRange 
                date={{
                  from: filters.dateRange.startDate,
                  to: filters.dateRange.endDate
                }}
                onChange={(range) => {
                  updateFilter('dateRange', {
                    startDate: range.from,
                    endDate: range.to
                  });
                }}
              />
            </div>
            
            <div>
              <Label htmlFor="material">Material</Label>
              <Select 
                value={filters.materialId || "all"} 
                onValueChange={(value) => updateFilter('materialId', value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Materials" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Materials</SelectItem>
                  {materials?.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.material_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="transactionType">Transaction Type</Label>
              <Select 
                value={filters.transactionType || "all"} 
                onValueChange={(value) => updateFilter('transactionType', value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="consumption">Consumption</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Transaction History
          </CardTitle>
          <CardDescription>
            Showing {transactionData?.transactions.length || 0} of {transactionData?.totalCount || 0} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Transaction Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="hidden md:table-cell">Previous Qty</TableHead>
                  <TableHead className="hidden md:table-cell">New Qty</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="hidden md:table-cell">Notes</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionData?.transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  transactionData?.transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {format(new Date(transaction.transaction_date), "MMM d, yyyy")}
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(transaction.transaction_date), "h:mm a")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.material_name}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getTransactionTypeColor(transaction.transaction_type) as any}
                          className="capitalize"
                        >
                          {transaction.transaction_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <div className="flex items-center justify-end space-x-1">
                          {transaction.quantity < 0 ? (
                            <ArrowDownCircle className="h-4 w-4 text-destructive" />
                          ) : (
                            <ArrowUpCircle className="h-4 w-4 text-green-500" />
                          )}
                          <span>
                            {Math.abs(transaction.quantity)} {transaction.unit}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {transaction.previous_quantity} {transaction.unit}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {transaction.new_quantity} {transaction.unit}
                      </TableCell>
                      <TableCell>
                        {transaction.reference_id ? (
                          <Button
                            variant="link"
                            className="p-0 h-auto text-left flex items-center text-sm"
                            onClick={() => navigateToReference(transaction.reference_type, transaction.reference_id)}
                          >
                            <span>{getReferenceTypeDisplay(transaction.reference_type)}</span>
                            <span className="ml-1">{transaction.reference_number}</span>
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {getReferenceTypeDisplay(transaction.reference_type)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                        {transaction.notes || "-"}
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Info className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="w-[300px]">
                              <div className="space-y-2">
                                <div className="font-semibold">Transaction Details</div>
                                <div className="grid grid-cols-2 gap-1 text-xs">
                                  <span className="text-muted-foreground">ID:</span>
                                  <span>{transaction.id}</span>
                                  
                                  <span className="text-muted-foreground">Material ID:</span>
                                  <span>{transaction.material_id}</span>
                                  
                                  <span className="text-muted-foreground">Transaction Date:</span>
                                  <span>{format(new Date(transaction.transaction_date), "PPpp")}</span>
                                  
                                  <span className="text-muted-foreground">Quantity Change:</span>
                                  <span>
                                    {transaction.previous_quantity} → {transaction.new_quantity} {transaction.unit}
                                  </span>
                                  
                                  {transaction.notes && (
                                    <>
                                      <span className="text-muted-foreground">Notes:</span>
                                      <span className="truncate">{transaction.notes}</span>
                                    </>
                                  )}
                                  
                                  {transaction.reference_id && (
                                    <>
                                      <span className="text-muted-foreground">Reference:</span>
                                      <span>
                                        {transaction.reference_type} {transaction.reference_number}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {transactionData && transactionData.pageCount > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {[...Array(transactionData.pageCount)].map((_, i) => {
                    // Show first, last, and a few around current page
                    const pageNum = i + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === transactionData.pageCount ||
                      (pageNum >= page - 1 && pageNum <= page + 1)
                    ) {
                      return (
                        <PaginationItem key={i}>
                          <PaginationLink
                            onClick={() => setPage(pageNum)}
                            isActive={page === pageNum}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    
                    // Add ellipsis but only once between ranges
                    if (
                      (pageNum === 2 && page > 3) ||
                      (pageNum === transactionData.pageCount - 1 && page < transactionData.pageCount - 2)
                    ) {
                      return (
                        <PaginationItem key={i}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    
                    return null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setPage(p => Math.min(transactionData.pageCount, p + 1))}
                      className={page >= transactionData.pageCount ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
      
    </div>
  );
};

export default TransactionHistory;
