import React, { useState } from "react";
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
  ArrowDownCircle, ArrowUpCircle, ChevronDown, Info, Trash2 
} from "lucide-react";
import { LoadingSpinner } from "@/components/production/LoadingSpinner";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { TransactionHistoryDeleteDialog } from "@/components/dialogs/TransactionHistoryDeleteDialog";

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
  notes: string | null;  metadata: Record<string, unknown>;
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  
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
  const updateFilter = (key: keyof TransactionFilters, value: string | Date | null | { startDate: Date | null; endDate: Date | null }) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };
  
  // Get transaction type badge color
  const getTransactionTypeColor = (type: string) => {
    const typeLower = type.toLowerCase();
    
    if (typeLower.includes('purchase') || typeLower.includes('increase')) {
      return {
        bg: "bg-green-100 border-green-300 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400",
        label: "Addition",
        icon: ArrowUpCircle
      };
    }
    else if (typeLower.includes('order') || typeLower.includes('consumption')) {
      return {
        bg: "bg-red-100 border-red-300 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400",
        label: "Consumption",
        icon: ArrowDownCircle
      };
    }
    else if (typeLower.includes('sale')) {
      return {
        bg: "bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400",
        label: "Sale",
        icon: ArrowDownCircle
      };
    }
    else if (typeLower.includes('adjustment')) {
      if (typeLower.includes('decrease')) {
        return {
          bg: "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400",
          label: "Decrease",
          icon: ArrowDownCircle
        };
      }
      return {
        bg: "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400",
        label: "Adjustment",
        icon: Info
      };
    }
    
    return {
      bg: "bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-800/30 dark:border-gray-700 dark:text-gray-400",
      label: "Unknown",
      icon: Info
    };
  };
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

  // Selection handler functions
  const handleSelectTransaction = (transactionId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedTransactionIds(prev => [...prev, transactionId]);
    } else {
      setSelectedTransactionIds(prev => prev.filter(id => id !== transactionId));
    }
  };

  const handleSelectAllTransactions = (isSelected: boolean) => {
    if (isSelected && transactionData?.transactions) {
      setSelectedTransactionIds(transactionData.transactions.map(t => t.id));
    } else {
      setSelectedTransactionIds([]);
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (!selectionMode) {
      setSelectedTransactionIds([]);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedTransactionIds.length === 0) return;
    setIsDeleteDialogOpen(true);
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/analysis')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Material Transaction History</h1>
          </div>          <div className="flex items-center space-x-2">
            <Button 
              variant={selectionMode ? "default" : "outline"} 
              size="sm"
              onClick={toggleSelectionMode}
            >
              <Checkbox className="h-4 w-4 mr-2" />
              {selectionMode ? "Exit Selection" : "Select Mode"}
            </Button>
            
            {selectionMode && selectedTransactionIds.length > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDeleteSelected}
                className="text-destructive hover:text-destructive border-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedTransactionIds.length})
              </Button>
            )}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-destructive hover:text-destructive border-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear History
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete transaction history records (inventory will not be affected)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
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
      <Card>        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Transaction History
              </CardTitle>
              <CardDescription>
                Showing {transactionData?.transactions.length || 0} of {transactionData?.totalCount || 0} transactions
              </CardDescription>
            </div>
            {selectionMode && transactionData?.transactions && transactionData.transactions.length > 0 && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedTransactionIds.length === transactionData.transactions.length}
                  onCheckedChange={handleSelectAllTransactions}
                  aria-label="Select all transactions"
                />
                <span className="text-sm text-muted-foreground">Select All</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {transactionData?.transactions.length === 0 ? (
              <div className="border rounded-md h-24 flex items-center justify-center text-muted-foreground">
                No transactions found
              </div>
            ) : (
              // Enhanced deduplication to avoid showing duplicate transactions with different labels
              ((() => {
                const DEBUG = false; // Set to true to enable console debugging
                
                if (DEBUG) {
                  console.log('===== TRANSACTION HISTORY DEDUPLICATION =====');
                  console.log(`Starting with ${transactionData?.transactions.length} transactions`);
                }
                
                // First, group transactions by their numerical characteristics AND time proximity
                const groupedByQuantity: { [key: string]: typeof transactionData.transactions } = {};
                
                // Sort by transaction date to process in chronological order
                const chronologicalTransactions = [...transactionData!.transactions].sort((a, b) => 
                  new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
                );
                
                // Simple approach: Filter out all "Decrease" transactions with closing stock of 0
                // These are typically the automatic adjustments when a consumption exceeds available stock
                const filteredTransactions = chronologicalTransactions.filter(tx => 
                  !(tx.transaction_type.toLowerCase().includes('decrease') && 
                    tx.new_quantity === 0 && 
                    Math.abs(tx.previous_quantity - Math.abs(tx.quantity)) < 0.01) // Available exactly matches the decrease amount
                );
                
                if (DEBUG) {
                  const removedCount = chronologicalTransactions.length - filteredTransactions.length;
                  if (removedCount > 0) {
                    console.log(`Filtered out ${removedCount} decrease transactions that represent excess consumption`);
                    
                    const removedTransactions = chronologicalTransactions.filter(tx => 
                      tx.transaction_type.toLowerCase().includes('decrease') && 
                      tx.new_quantity === 0 && 
                      Math.abs(tx.previous_quantity - Math.abs(tx.quantity)) < 0.01
                    );
                    console.log('Removed transactions:', removedTransactions);
                  }
                }
                
                // Create groups of transactions with same numerical values and close timestamps
                // (using the pre-filtered list without the duplicate decrease transactions)
                filteredTransactions.forEach(transaction => {
                  let foundGroup = false;
                  const transactionTime = new Date(transaction.transaction_date).getTime();
                  
                  // Check existing groups for a match based on quantity and time proximity
                  Object.keys(groupedByQuantity).forEach(key => {
                    if (foundGroup) return; // Skip if already found a group
                    
                    const group = groupedByQuantity[key];
                    if (group.length === 0) return;
                    
                    // Check first transaction in group to see if this transaction belongs with it
                    const firstTransaction = group[0];
                    const firstTime = new Date(firstTransaction.transaction_date).getTime();
                    
                    // If quantities match exactly and time is within 1 minute, add to this group
                    if (Math.abs(firstTransaction.quantity - transaction.quantity) < 0.01 &&
                        Math.abs(firstTransaction.previous_quantity - transaction.previous_quantity) < 0.01 &&
                        Math.abs(firstTransaction.new_quantity - transaction.new_quantity) < 0.01 &&
                        Math.abs(transactionTime - firstTime) < 60000) { // 1 minute
                      
                      groupedByQuantity[key].push(transaction);
                      foundGroup = true;
                    }
                  });
                  
                  // If no matching group found, create a new one
                  if (!foundGroup) {
                    const key = `${transaction.previous_quantity}-${transaction.new_quantity}-${transaction.quantity}-${transactionTime}`;
                    groupedByQuantity[key] = [transaction];
                  }
                });
                
                if (DEBUG) {
                  console.log('Grouped transactions by numerical values:');
                  Object.keys(groupedByQuantity).forEach(key => {
                    console.log(`Group ${key}:`, groupedByQuantity[key]);
                  });
                }
                
                // Process each group to eliminate duplicates
                const deduplicatedTransactions: typeof transactionData.transactions = [];
                
                Object.values(groupedByQuantity).forEach(group => {
                  if (group.length === 1) {
                    // If only one transaction in the group, keep it
                    deduplicatedTransactions.push(group[0]);
                    if (DEBUG) console.log(`Single transaction in group - keeping:`, group[0]);
                    return;
                  }
                  
                  // Check for purchase + manual entry duplicate pattern
                  const hasPurchase = group.some(transaction => 
                    transaction.transaction_type.toLowerCase().includes('purchase'));
                  const hasManual = group.some(transaction => 
                    !transaction.reference_type || 
                    transaction.transaction_type.toLowerCase().includes('manual') || 
                    transaction.transaction_type.toLowerCase().includes('adjustment'));
                  
                  if (hasPurchase && hasManual) {
                    // Keep only purchase transactions from this group
                    const purchases = group.filter(transaction => 
                      transaction.transaction_type.toLowerCase().includes('purchase'));
                    
                    if (DEBUG) {
                      console.log('Found purchase + manual entry group:');
                      console.log('- All transactions in group:', group);
                      console.log('- Keeping only purchases:', purchases);
                    }
                    
                    deduplicatedTransactions.push(...purchases);
                  } else {
                    // Check for consumption + decrease duplicate pattern
                    const hasConsumption = group.some(transaction => 
                      transaction.transaction_type.toLowerCase().includes('consumption'));
                    const hasDecrease = group.some(transaction => 
                      transaction.transaction_type.toLowerCase().includes('decrease'));
                    
                    if (hasConsumption && hasDecrease) {
                      // Keep only consumption transactions
                      const consumptions = group.filter(transaction => 
                        transaction.transaction_type.toLowerCase().includes('consumption'));
                      
                      if (DEBUG) {
                        console.log('Found consumption + decrease group:');
                        console.log('- All transactions in group:', group);
                        console.log('- Keeping only consumptions:', consumptions);
                      }
                      
                      deduplicatedTransactions.push(...consumptions);
                    } 
                    // Check if we have a consumption that exceeds available stock
                    // This will result in a separate 'decrease' transaction but with different quantities
                    else if (group.length > 1 && 
                             (hasConsumption || hasDecrease) &&
                             group.some(t => t.new_quantity === 0)) {
                      // In cases where we consumed more than what's available,
                      // keep only the consumption transaction that shows the full amount
                      const consumptionTransactions = group.filter(transaction => 
                        transaction.transaction_type.toLowerCase().includes('consumption'));
                      
                      if (consumptionTransactions.length > 0) {
                        // Prefer keeping consumption transactions when available
                        if (DEBUG) {
                          console.log('Found over-consumption pattern:');
                          console.log('- All transactions in group:', group);
                          console.log('- Keeping consumptions only:', consumptionTransactions);
                        }
                        deduplicatedTransactions.push(...consumptionTransactions);
                      } else {
                        // Otherwise, find the transaction with the largest quantity (to show the full consumption amount)
                        const sortedByQuantity = [...group].sort(
                          (a, b) => Math.abs(b.quantity) - Math.abs(a.quantity)
                        );
                        
                        if (DEBUG) {
                          console.log('Found excess consumption with no consumption label:');
                          console.log('- All transactions in group:', group);
                          console.log('- Keeping largest quantity transaction:', sortedByQuantity[0]);
                        }
                        
                        deduplicatedTransactions.push(sortedByQuantity[0]);
                      }
                    } else {
                      // Otherwise keep the most recent transaction from the group
                      const sortedGroup = [...group].sort(
                        (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
                      );
                      
                      if (DEBUG) {
                        console.log('Other duplicate group - keeping most recent:');
                        console.log('- All transactions in group:', group);
                        console.log('- Keeping:', sortedGroup[0]);
                      }
                      
                      deduplicatedTransactions.push(sortedGroup[0]);
                    }
                  }
                });
                
                // Sort by transaction date (newest first)
                const finalTransactions = deduplicatedTransactions.sort(
                  (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
                );
                
                if (DEBUG) {
                  console.log(`Deduplication complete. Reduced from ${transactionData?.transactions.length} to ${finalTransactions.length} transactions`);
                  console.log('===== END TRANSACTION HISTORY DEDUPLICATION =====');
                }
                
                return finalTransactions;
              })()).map((transaction) => {
                const typeInfo = getTransactionTypeColor(transaction.transaction_type);
                const { icon: Icon } = typeInfo;
                const isNegative = transaction.quantity < 0;
                  return (
                  <div 
                    key={transaction.id} 
                    className={`border rounded-md p-0 overflow-hidden hover:border-primary transition-colors ${
                      selectedTransactionIds.includes(transaction.id) ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    {/* Header with transaction type & date */}
                    <div className={`py-1.5 px-3 ${typeInfo.bg || 'bg-gray-100'}`}>
                      <div className="flex justify-between items-center">
                        {selectionMode && (
                          <Checkbox
                            checked={selectedTransactionIds.includes(transaction.id)}
                            onCheckedChange={(checked) => 
                              handleSelectTransaction(transaction.id, !!checked)
                            }
                            aria-label={`Select transaction ${transaction.id}`}
                            className="h-4 w-4"
                          />
                        )}
                        <div className="flex items-center gap-1 font-medium">
                          {typeInfo.label === "Addition" && <ArrowUpCircle className="h-3.5 w-3.5" />}
                          {typeInfo.label === "Consumption" && <ArrowDownCircle className="h-3.5 w-3.5" />}
                          {typeInfo.label === "Adjustment" && <Info className="h-3.5 w-3.5" />}
                          {typeInfo.label === "Sale" && <ArrowDownCircle className="h-3.5 w-3.5" />}
                          {(typeInfo.label === "Unknown" || !typeInfo.label) && <Info className="h-3.5 w-3.5" />}
                          <span>{typeInfo.label || transaction.transaction_type}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      {/* Material name */}
                      <div className="bg-blue-50 dark:bg-blue-950/30 px-3 py-2 rounded-md border border-blue-200 dark:border-blue-800">
                        <div className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                          {transaction.material_name}
                        </div>
                      </div>

                      {/* Stock changes */}
                      <div className="bg-slate-50 dark:bg-slate-950/30 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800">
                        <div className="flex justify-between items-center">
                          <div className="text-sm">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Opening:</span>{" "}
                            <span className="font-bold text-orange-600 dark:text-orange-400">{transaction.previous_quantity.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold px-2 py-1 rounded ${
                              isNegative 
                                ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30' 
                                : 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30'
                            }`}>
                              {isNegative ? '' : '+'}{transaction.quantity.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Closing:</span>{" "}
                            <span className="font-bold text-green-600 dark:text-green-400">{transaction.new_quantity.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Transaction date */}
                      <div className="text-sm text-muted-foreground">
                        <span>Transaction Date: {format(new Date(transaction.transaction_date), "dd MMM yyyy, h:mm a")}</span>
                      </div>

                      {/* Reference information */}
                      {transaction.reference_type && (
                        <div className="bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-md border border-green-200 dark:border-green-800">
                          <div className="flex items-center justify-between">
                            <div className="text-sm">
                              <span className="font-semibold text-green-700 dark:text-green-300">
                                {getReferenceTypeDisplay(transaction.reference_type)}:
                              </span>{" "}
                              <span className="font-bold text-green-800 dark:text-green-400">
                                {transaction.reference_number}
                              </span>
                            </div>
                            <button
                              onClick={() => navigateToReference(transaction.reference_type, transaction.reference_id)}
                              className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-md transition-colors"
                            >
                              View {getReferenceTypeDisplay(transaction.reference_type)}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Notes if available */}
                      {transaction.notes && (
                        <div className="bg-gray-50 dark:bg-gray-950/30 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800">
                          <div className="text-sm text-gray-700 dark:text-gray-300 italic">
                            💬 "{transaction.notes}"
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
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
            </div>          )}
        </CardContent>
      </Card>
        {/* Transaction History Delete Dialog */}
      <TransactionHistoryDeleteDialog 
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        selectedTransactionIds={selectedTransactionIds}
      />
      
    </div>
  );
};

export default TransactionHistory;
