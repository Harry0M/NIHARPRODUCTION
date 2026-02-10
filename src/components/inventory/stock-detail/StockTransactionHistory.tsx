import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockTransaction, TransactionLog } from "@/types/inventory";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowDownRight, ArrowUpRight, RefreshCcw, History, Info, FileText, Database, Package, ArrowDownCircle, ArrowUpCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { showToast } from "@/components/ui/enhanced-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { TransactionHistoryDeleteDialog } from "@/components/dialogs/TransactionHistoryDeleteDialog";

interface StockTransactionHistoryProps {
  transactions?: StockTransaction[];
  transactionLogs?: TransactionLog[];
  onRefresh?: () => void;
  isLoading?: boolean;
  materialId?: string;
}

export const StockTransactionHistory = ({
  transactions = [],
  transactionLogs = [],
  onRefresh,
  isLoading = false,
  materialId
}: StockTransactionHistoryProps) => {
  const navigate = useNavigate();
  const [localLoading, setLocalLoading] = useState<boolean>(isLoading);
  const [hoveredTransaction, setHoveredTransaction] = useState<string | null>(null);

  // Transaction selection and deletion state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(true); // Enable selection by default
  const [filterType, setFilterType] = useState<'all' | 'inward' | 'outward'>('all');

  // Deduplicate and filter transactions
  const filteredTransactions = React.useMemo(() => {
    // Enable debugging
    const DEBUG = false;

    // Sort by transaction date to process in chronological order
    const chronologicalTransactions = [...transactionLogs].sort((a, b) =>
      new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );

    // First pass: filter out decrease transactions that represent excess consumption
    let processedTransactions = [...chronologicalTransactions];
    const transactionsToRemove = new Set<string>();

    // For each material, find and remove excess consumption decrease entries
    const materialGroups = new Map<string, typeof transactionLogs>();
    chronologicalTransactions.forEach(tx => {
      const materialId = tx.material_id;
      if (!materialGroups.has(materialId)) {
        materialGroups.set(materialId, []);
      }
      materialGroups.get(materialId)!.push(tx);
    });

    // Process each material group to identify excess consumption patterns
    materialGroups.forEach((transactions, materialId) => {
      // Look for patterns where decrease transactions represent excess consumption  
      for (let i = transactions.length - 1; i >= 0; i--) {
        const tx = transactions[i];

        // Look for decrease transactions that bring quantity to 0 and match previous quantity exactly
        if (tx.transaction_type.toLowerCase().includes('decrease') &&
          tx.new_quantity === 0 &&
          Math.abs(tx.previous_quantity - Math.abs(tx.quantity)) < 0.01) {

          // Mark this transaction for removal
          transactionsToRemove.add(tx.id);
        }
      }
    });

    // Apply the filtering
    processedTransactions = processedTransactions.filter(tx => !transactionsToRemove.has(tx.id));

    // Group potential duplicates by numerical values and time proximity
    const groupedByQuantity: { [key: string]: typeof transactionLogs } = {};

    // Create groups of transactions with same numerical values and close timestamps
    processedTransactions.forEach(transaction => {
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

    // Process each group to eliminate duplicates
    const deduplicatedTransactions: typeof transactionLogs = [];

    Object.values(groupedByQuantity).forEach(group => {
      if (group.length === 1) {
        // If only one transaction in the group, keep it
        deduplicatedTransactions.push(group[0]);
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
          deduplicatedTransactions.push(...consumptions);
        } else {
          // Keep the most recent transaction from other duplicate groups
          const sortedGroup = [...group].sort(
            (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
          );
          deduplicatedTransactions.push(sortedGroup[0]);
        }
      }
    });

    // Sort by transaction date (newest first)
    const finalSortedTransactions = deduplicatedTransactions.sort(
      (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
    );

    // Apply the user selected filter
    return finalSortedTransactions.filter(tx => {
      if (filterType === 'all') return true;
      if (filterType === 'inward') return tx.quantity >= 0;
      if (filterType === 'outward') return tx.quantity < 0;
      return true;
    });
  }, [transactionLogs, filterType]);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy, h:mm a");
    } catch (e) {
      return dateString;
    }
  };

  // Get transaction type badge color (enhanced from analysis page)
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
    else if (typeLower.includes('adjustment') || typeLower.includes('decrease')) {
      return {
        bg: "bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400",
        label: "Adjustment",
        icon: AlertCircle
      };
    }

    return {
      bg: "bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-800/30 dark:border-gray-700 dark:text-gray-400",
      label: "Unknown",
      icon: Info
    };
  };

  // Get reference type display (from analysis page)
  const getReferenceTypeDisplay = (type: string | null) => {
    if (!type) return "Manual Entry";

    switch (type) {
      case 'Order':
        return "Order";
      case 'JobCard':
        return "Job Card";
      case 'Purchase':
        return "Purchase";
      case 'Adjustment':
        return "Inventory Adjustment";
      default:
        return type;
    }
  };

  // Navigate to reference (from analysis page)
  const navigateToReference = (type: string | null, id: string | null) => {
    if (!type || !id) return;

    switch (type) {
      case 'Order':
      case 'JobCard':
        navigate(`/orders/${id}`);
        break;
      case 'Purchase':
        navigate(`/purchases/${id}`);
        break;
      default:
      // Do nothing for unknown reference types
    }
  };

  // Transaction selection handlers
  const handleSelectTransaction = (transactionId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedTransactionIds(prev => [...prev, transactionId]);
    } else {
      setSelectedTransactionIds(prev => prev.filter(id => id !== transactionId));
    }
  };

  const handleSelectAllTransactions = (isSelected: boolean) => {
    if (isSelected && filteredTransactions.length > 0) {
      setSelectedTransactionIds(filteredTransactions.map(t => t.id));
    } else {
      setSelectedTransactionIds([]);
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      // When disabling selection mode, clear selected transactions
      setSelectedTransactionIds([]);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedTransactionIds.length === 0) return;
    setIsDeleteDialogOpen(true);
  };

  // Handle delete dialog close - refresh data and clear selection
  const handleDeleteDialogClose = (open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open && selectedTransactionIds.length > 0) {
      // When dialog closes after deletion, refresh data and clear selected items
      setSelectedTransactionIds([]);

      // Trigger refresh if available
      if (onRefresh) {
        onRefresh();
      } else {
        handleRefresh();
      }
    }
  };

  // Local refresh function when parent handler not provided
  const handleLocalRefresh = async () => {
    if (!materialId) return;

    setLocalLoading(true);
    try {
      console.log(`Manually refreshing transactions for material ID: ${materialId}`);

      // Fetch standard transactions
      const { data: txData, error: txError } = await supabase
        .from("inventory_transactions")
        .select("*")
        .eq("material_id", materialId)
        .order("created_at", { ascending: false });

      if (txError) {
        console.error("Error fetching transactions:", txError);
        throw txError;
      }

      // Fetch transaction logs
      const { data: logData, error: logError } = await supabase
        .from("inventory_transaction_log")
        .select("*")
        .eq("material_id", materialId)
        .order("transaction_date", { ascending: false });

      if (logError) {
        console.error("Error fetching transaction logs:", logError);
        throw logError;
      }

      console.log(`Fetched ${txData?.length || 0} transactions and ${logData?.length || 0} transaction logs`);

      showToast({
        title: "Transactions refreshed",
        description: `Found ${(txData?.length || 0) + (logData?.length || 0)} transaction records`,
        type: "info"
      });
    } catch (error: unknown) {
      console.error("Error in local transaction refresh:", error);
      showToast({
        title: "Error refreshing transactions",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        type: "error"
      });
    } finally {
      setLocalLoading(false);
    }
  };

  // Choose appropriate refresh function
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else if (materialId) {
      handleLocalRefresh();
    }
  };

  // Calculate time elapsed since transaction
  const getTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (seconds < 60) return 'just now';

      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;

      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;

      const days = Math.floor(hours / 24);
      if (days === 1) return 'yesterday';
      if (days < 7) return `${days}d ago`;

      return formatDate(dateString);
    } catch (e) {
      return 'unknown date';
    }
  };

  // Deduplicate transactions to get an accurate count
  const deduplicateTransactions = () => {
    // Create a map to track unique transactions
    const uniqueTransactions = new Map();

    // Add transactions to the map
    transactions.forEach(tx => {
      const key = tx.id || tx.reference_id || `${tx.created_at}-${tx.quantity}`;
      uniqueTransactions.set(key, tx);
    });

    // Add transaction logs, but avoid duplicates
    transactionLogs.forEach(log => {
      const key = log.id || log.reference_id || `${log.transaction_date}-${log.new_quantity}`;

      // Only add if not already in the map or if we want to prioritize log entry
      if (!uniqueTransactions.has(key)) {
        uniqueTransactions.set(key, log);
      }
    });

    return uniqueTransactions.size;
  };

  const isEmpty = !transactions.length && !transactionLogs.length;
  const totalRecords = deduplicateTransactions();

  // Show empty state if no transactions
  if (isEmpty) {
    return (
      <Card className="mt-6 border-border/60 overflow-hidden slide-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader className="flex flex-row items-center justify-between bg-muted/30 dark:bg-muted/10 border-b border-border/40">
          <CardTitle className="flex items-center gap-2 text-primary">
            <History className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={localLoading || isLoading}
            className="flex items-center gap-1 border-border/60 shadow-sm hover:bg-muted/80 dark:hover:bg-muted/20"
          >
            <RefreshCcw className={`h-4 w-4 ${(localLoading || isLoading) ? 'animate-spin' : ''}`} />
            {(localLoading || isLoading) ? "Refreshing..." : "Refresh Transactions"}
          </Button>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center py-10 space-y-4 bg-muted/10 dark:bg-muted/5 rounded-xl border border-dashed border-border/40 animate-in fade-in duration-300">
            <div className="w-16 h-16 mb-2 rounded-full bg-muted/30 dark:bg-muted/20 flex items-center justify-center">
              <Database className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">No transaction history yet</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              When materials are used in orders or new stock is added, transactions will appear here.
              {(localLoading || isLoading) ? " Checking for latest transactions..." : ""}
            </p>
            {!localLoading && !isLoading && (
              <Button
                variant="outline"
                onClick={handleRefresh}
                className="mt-4 border-border/60 gap-2 shadow-sm hover:bg-muted/80 dark:hover:bg-muted/20"
              >
                <RefreshCcw className="h-4 w-4" />
                Check for New Transactions
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4 border-border/60 overflow-hidden slide-up" style={{ animationDelay: '0.15s' }}>
      <CardHeader className="flex flex-row items-center justify-between bg-muted/30 dark:bg-muted/10 border-b border-border/40">
        <CardTitle className="flex items-center gap-2 text-primary">
          <History className="h-5 w-5" />
          <span>Transaction History</span>
          <Badge variant="outline" className="ml-2 bg-primary/10 dark:bg-primary/20 border-primary/20 dark:border-primary/30 text-primary hover:bg-primary/15">
            Transaction Log
          </Badge>
          {selectedTransactionIds.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {selectedTransactionIds.length} selected
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          {transactionLogs.length > 0 && (
            <>
              <Button
                variant={selectionMode ? "default" : "outline"}
                size="sm"
                onClick={toggleSelectionMode}
                className="border-border/60 shadow-sm hover:bg-muted/80 dark:hover:bg-muted/20"
              >
                {selectionMode ? "Disable Selection" : "Enable Selection"}
              </Button>

              {selectionMode && selectedTransactionIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                  className="shadow-sm"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete ({selectedTransactionIds.length})
                </Button>
              )}
            </>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={localLoading || isLoading}
                  className="border-border/60 shadow-sm hover:bg-muted/80 dark:hover:bg-muted/20"
                >
                  <RefreshCcw className={`h-4 w-4 ${(localLoading || isLoading) ? 'animate-spin' : ''}`} />
                  <span className="sr-only">Refresh</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-background border-border/60 shadow-md">
                <p>Refresh transaction history</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-center mb-3 gap-2">
          <History className="h-4 w-4" />
          <h3 className="text-sm font-medium">Transactions</h3>
          {transactionLogs.length > 0 && (
            <span className="text-xs bg-primary/20 rounded-full px-1.5 py-0.5">
              {transactionLogs.length}
            </span>
          )}

          {selectionMode && transactionLogs.length > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              {/* Filter Controls */}
              <div className="flex items-center gap-1 mr-4 bg-muted/20 p-1 rounded-md">
                <Button
                  variant={filterType === 'all' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                  className="h-7 px-2 text-xs"
                >
                  All
                </Button>
                <Button
                  variant={filterType === 'inward' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterType('inward')}
                  className="h-7 px-2 text-xs text-green-600 hover:text-green-700 dark:text-green-400"
                >
                  Inward
                </Button>
                <Button
                  variant={filterType === 'outward' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterType('outward')}
                  className="h-7 px-2 text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  Outward
                </Button>
              </div>

              <Checkbox
                checked={selectedTransactionIds.length === filteredTransactions.length && filteredTransactions.length > 0}
                onCheckedChange={handleSelectAllTransactions}
                aria-label="Select all transactions"
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {/* Enhanced deduplication logic from analysis page */}
          {filteredTransactions.map((transaction) => {
            const typeInfo = getTransactionTypeColor(transaction.transaction_type);
            const { icon: Icon } = typeInfo;
            const isNegative = transaction.quantity < 0;

            return (
              <div
                key={transaction.id}
                className={`border rounded-lg p-0 overflow-hidden shadow-sm ${hoveredTransaction === transaction.id ? 'border-primary shadow-md' : 'border-border'} ${selectedTransactionIds.includes(transaction.id) ? 'border-primary bg-primary/5' : ''
                  } transition-all duration-200`}
                onMouseEnter={() => setHoveredTransaction(transaction.id)}
                onMouseLeave={() => setHoveredTransaction(null)}
              >
                {/* Header with transaction type */}
                <div className={`py-2 px-4 ${typeInfo.bg}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
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
                      <div className="flex items-center gap-2 font-semibold">
                        {Icon && <Icon className="h-4 w-4" />}
                        <span className="text-sm">{typeInfo.label}</span>
                      </div>
                    </div>
                    <span className="text-xs opacity-80">{formatDate(transaction.transaction_date)}</span>
                  </div>
                </div>

                {/* Main content */}
                <div className="p-4 space-y-3">
                  {/* Material name */}
                  {transaction.metadata?.material_name && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 px-3 py-2 rounded-md border border-blue-200 dark:border-blue-800">
                      <div className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                        {transaction.metadata.material_name}
                      </div>
                    </div>
                  )}

                  {/* Stock changes */}
                  <div className="bg-slate-50 dark:bg-slate-950/30 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Opening:</span>{" "}
                        <span className="font-bold text-orange-600 dark:text-orange-400">{transaction.previous_quantity.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold px-2 py-1 rounded ${isNegative
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
                    <span>Transaction Date: {formatDate(transaction.transaction_date)}</span>
                  </div>

                  {/* Purchase Entry Date - Highlighted for purchases */}
                  {(transaction.metadata as { purchase_date?: string })?.purchase_date && (
                    <div className="bg-purple-50 dark:bg-purple-950/30 px-3 py-2 rounded-md border border-purple-200 dark:border-purple-800">
                      <div className="text-sm">
                        <span className="font-semibold text-purple-700 dark:text-purple-300">Purchase Entry Date:</span>{" "}
                        <span className="font-bold text-purple-800 dark:text-purple-400">
                          {format(new Date((transaction.metadata as { purchase_date: string }).purchase_date), "dd MMM yyyy")}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Order Creation Date - Highlighted for job card transactions */}
                  {transaction.reference_type === "JobCard" && (transaction.metadata as { order_date?: string })?.order_date && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 px-3 py-2 rounded-md border border-blue-200 dark:border-blue-800">
                      <div className="text-sm">
                        <span className="font-semibold text-blue-700 dark:text-blue-300">Order Creation Date:</span>{" "}
                        <span className="font-bold text-blue-800 dark:text-blue-400">
                          {format(new Date((transaction.metadata as { order_date: string }).order_date), "dd MMM yyyy")}
                        </span>
                      </div>
                    </div>
                  )}

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
          }

          {
            transactionLogs.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                No transaction logs found for this material
              </div>
            )
          }
        </div>
      </CardContent>

      {/* Transaction History Delete Dialog */}
      <TransactionHistoryDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogClose}
        selectedTransactionIds={selectedTransactionIds}
      />
    </Card>
  );
};
