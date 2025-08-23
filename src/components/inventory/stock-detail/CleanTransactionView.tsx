import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionLog } from "@/types/inventory";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, ArrowDownCircle, History, RefreshCcw, Package, ShoppingCart, Wrench, Edit, AlertCircle, ExternalLink, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { showToast } from "@/components/ui/enhanced-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

// Extended transaction log type to include update information
interface ExtendedTransactionLog extends TransactionLog {
  isUpdated?: boolean;
  originalTransactionDate?: string;
  updateCount?: number;
}

interface CleanTransactionViewProps {
  transactionLogs?: TransactionLog[];
  onRefresh?: () => void;
  isLoading?: boolean;
  materialId?: string;
  currentStock?: number; // Current actual stock quantity
}

export const CleanTransactionView = ({ 
  transactionLogs = [],
  onRefresh,
  isLoading = false,
  materialId,
  currentStock = 0
}: CleanTransactionViewProps) => {
  const [filteredTransactions, setFilteredTransactions] = useState<ExtendedTransactionLog[]>([]);
  const [localLoading, setLocalLoading] = useState<boolean>(isLoading);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [actualCurrentStock, setActualCurrentStock] = useState<number>(currentStock);

  // Reset error state when new data comes in
  useEffect(() => {
    setHasError(false);
    setErrorMessage("");
    setActualCurrentStock(currentStock);
  }, [transactionLogs, materialId, currentStock]);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "Invalid date";
      return format(new Date(dateString), "dd MMM yyyy, h:mm a");
    } catch (e) {
      console.warn("Date formatting error:", e, "for date:", dateString);
      return dateString || "Invalid date";
    }
  };

  // Get transaction type badge color and icon
  const getTransactionTypeDisplay = (transaction: ExtendedTransactionLog) => {
    const type = transaction.transaction_type.toLowerCase();
    const refType = transaction.reference_type?.toLowerCase();
    
    if (type.includes('purchase') || refType === 'purchase') {
      if (transaction.isUpdated) {
        return {
          bg: "bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400",
          label: "Purchase Updated",
          icon: Edit,
          description: `Material purchase updated (${transaction.updateCount || 0} revision${(transaction.updateCount || 0) !== 1 ? 's' : ''})`
        };
      }
      return {
        bg: "bg-green-100 border-green-300 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400",
        label: "Purchase",
        icon: ShoppingCart,
        description: "Material purchased and added to inventory"
      };
    }
    else if (type.includes('consumption') || refType === 'jobcard') {
      return {
        bg: "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400",
        label: "Job Consumption", 
        icon: Wrench,
        description: "Material consumed for job card production"
      };
    }
    
    return {
      bg: "bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-800/30 dark:border-gray-700 dark:text-gray-400",
      label: "Other",
      icon: Package,
      description: "Other transaction type"
    };
  };

  // Filter transactions to show only purchases, valid job consumptions, and manual consumptions
  // Also consolidate purchase updates (reversal + new purchase) into single "updated" entries
  const filterTransactions = async (transactions: TransactionLog[]) => {
    console.log(`🔍 CleanTransactionView: Starting filterTransactions with ${transactions?.length || 0} transactions`);
    
    if (!transactions || transactions.length === 0) {
      console.log("No transactions to filter, setting empty array");
      setFilteredTransactions([]);
      return;
    }

    try {
      console.log(`🔍 CleanTransactionView: Processing ${transactions.length} transactions`);
      
      const filtered: ExtendedTransactionLog[] = [];
      const processedPurchaseIds = new Set<string>();

      // Group transactions by reference_id for purchase consolidation
      const purchaseGroups = new Map<string, TransactionLog[]>();
      const otherTransactions: TransactionLog[] = [];

      for (const transaction of transactions) {
        // Safety checks
        if (!transaction || !transaction.transaction_type) {
          console.warn("Skipping invalid transaction:", transaction);
          continue;
        }

        const type = transaction.transaction_type.toLowerCase();
        const refType = transaction.reference_type?.toLowerCase();
        const notes = transaction.notes?.toLowerCase() || "";

        // Group purchase-related transactions by reference_id
        if (type.includes('purchase') || refType === 'purchase') {
          if (transaction.reference_id) {
            // Group purchases with reference_id for update detection
            if (!purchaseGroups.has(transaction.reference_id)) {
              purchaseGroups.set(transaction.reference_id, []);
            }
            purchaseGroups.get(transaction.reference_id)!.push(transaction);
          } else {
            // For purchases without reference_id, add directly to filtered results
            // These are typically standalone purchases that cannot be grouped
            filtered.push(transaction);
          }
        }
        // Include manual consumption transactions (by type, refType, or notes)
        else if (type.includes('manual') || refType === 'manual' || notes.includes('manual')) {
          otherTransactions.push(transaction);
        }
        // For job consumption transactions, check if job card still exists
        else if ((type.includes('consumption') || refType === 'jobcard') && transaction.reference_id) {
          otherTransactions.push(transaction);
        }
      }

      console.log(`📊 CleanTransactionView: Found ${purchaseGroups.size} purchase groups, ${otherTransactions.length} other transactions, ${filtered.length} standalone purchases`);

      // Process purchase groups to detect updates
      for (const [purchaseId, purchaseTransactions] of purchaseGroups) {
        if (processedPurchaseIds.has(purchaseId)) continue;

        try {
          // Sort by transaction date (oldest first for chronological processing)
          purchaseTransactions.sort((a, b) => {
            try {
              return new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime();
            } catch (error) {
              console.warn("Date sorting error for purchase transactions:", error);
              return 0;
            }
          });

          const reversals = purchaseTransactions.filter(t => t.transaction_type?.toLowerCase().includes('reversal'));
          const purchases = purchaseTransactions.filter(t => !t.transaction_type?.toLowerCase().includes('reversal'));

          console.log(`🔄 Purchase ${purchaseId}: ${reversals.length} reversals, ${purchases.length} purchases`);

          // If we have both reversals and new purchases, this is an update
          if (reversals.length > 0 && purchases.length > 0) {
            // Use the latest purchase transaction as the base, but mark it as updated
            const latestPurchase = purchases[purchases.length - 1];
            const updatedTransaction = {
              ...latestPurchase,
              isUpdated: true,
              originalTransactionDate: purchases[0]?.transaction_date || latestPurchase.transaction_date,
              updateCount: Math.max(0, purchases.length - 1)
            };
            filtered.push(updatedTransaction);
            console.log(`✏️ Consolidated purchase update: ${purchaseId} (${purchases.length} revisions)`);
          } else {
            // No reversals found, include all purchase transactions normally
            filtered.push(...purchases);
            console.log(`➕ Added ${purchases.length} regular purchases for: ${purchaseId}`);
          }

          processedPurchaseIds.add(purchaseId);
        } catch (error) {
          console.error(`Error processing purchase group ${purchaseId}:`, error);
          // Include all transactions from this group as fallback
          filtered.push(...purchaseTransactions.filter(t => !t.transaction_type?.toLowerCase().includes('reversal')));
        }
      }

      // Process other transactions (manual, job consumption)
      // First, collect all unique job card IDs to batch query them
      const jobCardIds = new Set<string>();
      const jobConsumptionTransactions: TransactionLog[] = [];
      
      for (const transaction of otherTransactions) {
        const type = transaction.transaction_type.toLowerCase();
        const refType = transaction.reference_type?.toLowerCase();
        const notes = transaction.notes?.toLowerCase() || "";

        // Include manual consumption transactions immediately
        if (type.includes('manual') || refType === 'manual' || notes.includes('manual')) {
          filtered.push(transaction);
          continue;
        }

        // Collect job consumption transactions for batch processing
        if ((type.includes('consumption') || refType === 'jobcard') && transaction.reference_id) {
          jobConsumptionTransactions.push(transaction);
          jobCardIds.add(transaction.reference_id);
        }
      }

      // Batch query all job cards at once to check which ones exist
      let existingJobCardIds = new Set<string>();
      if (jobCardIds.size > 0) {
        try {
          console.log(`Checking ${jobCardIds.size} unique job cards for existence:`, Array.from(jobCardIds));
          
          const { data: existingJobCards, error: jobCardsError } = await supabase
            .from('job_cards')
            .select('id')
            .in('id', Array.from(jobCardIds));

          if (jobCardsError) {
            console.warn('Error fetching job cards (possibly due to RLS), assuming all job consumption transactions are valid:', jobCardsError);
            // If there's an RLS error, include all job consumption transactions
            filtered.push(...jobConsumptionTransactions);
          } else {
            existingJobCardIds = new Set(existingJobCards?.map(jc => jc.id) || []);
            console.log(`Found ${existingJobCardIds.size} existing job cards out of ${jobCardIds.size} checked`);
            
            // Include only job consumption transactions with existing job cards
            for (const transaction of jobConsumptionTransactions) {
              if (existingJobCardIds.has(transaction.reference_id!)) {
                filtered.push(transaction);
              } else {
                console.log(`Skipping transaction for deleted job card: ${transaction.reference_id}`);
              }
            }
          }
        } catch (error) {
          console.warn('Error checking job cards existence, including all job consumption transactions:', error);
          // If there's any error, include all job consumption transactions
          filtered.push(...jobConsumptionTransactions);
        }
      }

      // Sort by transaction date (newest first)
      try {
        filtered.sort((a, b) => {
          try {
            return new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime();
          } catch (error) {
            console.warn("Date sorting error:", error);
            return 0;
          }
        });
      } catch (error) {
        console.warn("Error sorting transactions:", error);
      }

      console.log(`✅ CleanTransactionView: Final result - ${filtered.length} transactions after filtering and consolidation`);
      
      setFilteredTransactions(filtered);
    } catch (error) {
      console.error("Error filtering transactions:", error);
      // Set empty array instead of crashing
      setFilteredTransactions([]);
      throw error; // Re-throw to be caught by useEffect
    }
  };

  // Filter transactions whenever the input changes
  useEffect(() => {
    const runFilter = async () => {
      try {
        setHasError(false);
        setErrorMessage("");
        await filterTransactions(transactionLogs);
      } catch (error) {
        console.error("❌ Error in filterTransactions useEffect:", error);
        setHasError(true);
        const errorMsg = error instanceof Error ? error.message : "Unknown error occurred while filtering transactions";
        setErrorMessage(errorMsg);
        // Set empty array to prevent crashes
        setFilteredTransactions([]);
        showToast({
          title: "Error filtering transactions",
          description: "Failed to process transaction data. Please try refreshing.",
          type: "error"
        });
      }
    };
    
    runFilter();
  }, [transactionLogs]);

  // Local refresh function when parent handler not provided
  const handleLocalRefresh = async () => {
    if (!materialId) return;
    
    setLocalLoading(true);
    try {
      console.log(`Refreshing clean transaction view for material ID: ${materialId}`);
      
      // Fetch current stock quantity
      const { data: stockData, error: stockError } = await supabase
        .from("inventory")
        .select("quantity")
        .eq("id", materialId)
        .single();
        
      if (stockError) {
        console.error("Error fetching current stock:", stockError);
      } else if (stockData) {
        setActualCurrentStock(stockData.quantity || 0);
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
      
      console.log(`Fetched ${logData?.length || 0} transaction logs for filtering`);
      
      if (logData) {
        await filterTransactions(logData);
      }
      
      showToast({
        title: "Clean transactions refreshed",
        description: `Found ${filteredTransactions.length} purchase and active job consumption transactions`,
        type: "info"
      });
    } catch (error: unknown) {
      console.error("Error in clean transaction refresh:", error);
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
      if (!dateString) return 'unknown date';
      
      const date = new Date(dateString);
      const now = new Date();
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'invalid date';
      }
      
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
      console.warn("Time ago calculation error:", e, "for date:", dateString);
      return 'unknown date';
    }
  };

  const isEmpty = filteredTransactions.length === 0;

  // Calculate running balances for each transaction
  const calculateRunningBalances = () => {
    if (filteredTransactions.length === 0) return [];
    
    // Sort transactions by date (newest first for display, but we need to calculate from oldest)
    const sortedForCalculation = [...filteredTransactions].sort((a, b) => {
      try {
        return new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime();
      } catch (error) {
        console.warn("Date sorting error for balance calculation:", error);
        return 0;
      }
    });
    
    // Calculate running balance by working backwards from current stock
    // Start with current stock and subtract transactions going backwards in time
    let runningBalance = actualCurrentStock;
    const balances = new Map<string, number>();
    
    // Work backwards through transactions to calculate what balance was at each point
    for (let i = sortedForCalculation.length - 1; i >= 0; i--) {
      const transaction = sortedForCalculation[i];
      balances.set(transaction.id, runningBalance);
      runningBalance -= (transaction.quantity || 0);
    }
    
    return balances;
  };

  const runningBalances = calculateRunningBalances();

  // Show error state if there's an error
  if (hasError) {
    return (
      <Card className="mt-6 border-border/60 overflow-hidden slide-up" style={{animationDelay: '0.1s'}}>
        <CardHeader className="flex flex-row items-center justify-between bg-red-50 dark:bg-red-900/10 border-b border-red-200 dark:border-red-800">
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            Error in Clean Transaction View
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={localLoading || isLoading}
            className="flex items-center gap-1 border-red-200 hover:bg-red-50"
          >
            <RefreshCcw className={`h-4 w-4 ${(localLoading || isLoading) ? 'animate-spin' : ''}`} />
            Try Again
          </Button>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="w-16 h-16 mb-2 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-lg font-medium text-red-700 dark:text-red-400">Failed to load transactions</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {errorMessage || "An error occurred while processing the transaction data."}
            </p>
            <Button 
              variant="outline" 
              onClick={handleRefresh} 
              className="mt-4 border-red-200 text-red-700 hover:bg-red-50"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Retry Loading
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show empty state if no filtered transactions
  if (isEmpty) {
    return (
      <Card className="mt-6 border-border/60 overflow-hidden slide-up" style={{animationDelay: '0.1s'}}>
        <CardHeader className="flex flex-row items-center justify-between bg-muted/30 dark:bg-muted/10 border-b border-border/40">
          <CardTitle className="flex items-center gap-2 text-primary">
            <History className="h-5 w-5" />
            Clean Transaction View
            <Badge variant="outline" className="ml-2 bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
              Filtered
            </Badge>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={localLoading || isLoading}
            className="flex items-center gap-1 border-border/60 shadow-sm hover:bg-muted/80 dark:hover:bg-muted/20"
          >
            <RefreshCcw className={`h-4 w-4 ${(localLoading || isLoading) ? 'animate-spin' : ''}`} />
            {(localLoading || isLoading) ? "Refreshing..." : "Refresh"}
          </Button>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center py-10 space-y-4 bg-muted/10 dark:bg-muted/5 rounded-xl border border-dashed border-border/40 animate-in fade-in duration-300">
            <div className="w-16 h-16 mb-2 rounded-full bg-muted/30 dark:bg-muted/20 flex items-center justify-center">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">No clean transactions found</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              This view shows only purchase transactions (with updates consolidated), manual consumption, and job consumption from active (non-deleted) job cards.
              {(localLoading || isLoading) ? " Checking for transactions..." : ""}
            </p>
            {!localLoading && !isLoading && (
              <Button 
                variant="outline" 
                onClick={handleRefresh} 
                className="mt-4 border-border/60 gap-2 shadow-sm hover:bg-muted/80 dark:hover:bg-muted/20"
              >
                <RefreshCcw className="h-4 w-4" />
                Check for Transactions
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4 border-border/60 overflow-hidden slide-up" style={{animationDelay: '0.15s'}}>
      <CardHeader className="flex flex-row items-center justify-between bg-muted/30 dark:bg-muted/10 border-b border-border/40">
        <CardTitle className="flex items-center gap-2 text-primary">
          <History className="h-5 w-5" />
          <span>Clean Transaction View</span>
          <Badge variant="outline" className="ml-2 bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
            Filtered
          </Badge>
          <Badge variant="secondary" className="ml-2">
            {filteredTransactions.length} transactions
          </Badge>
        </CardTitle>
        <div className="flex items-center gap-2">
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
                <p>Refresh clean transaction view</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {/* Closing Balance Section */}
        <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Current Stock</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">Actual inventory quantity</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {actualCurrentStock.toFixed(2)}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Current Stock Quantity
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center mb-3 gap-2">
          <History className="h-4 w-4" />
          <h3 className="text-sm font-medium">Clean Transactions</h3>
          <span className="text-xs bg-primary/20 rounded-full px-1.5 py-0.5">
            {filteredTransactions.length}
          </span>
          <span className="text-xs text-muted-foreground">
            (Purchases with Updates + Active Job Consumption + Manual)
          </span>
        </div>
        
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => {
            // Safety check for transaction data
            if (!transaction || !transaction.id) {
              console.warn("Skipping invalid transaction in render:", transaction);
              return null;
            }

            try {
              const typeDisplay = getTransactionTypeDisplay(transaction);
              const IconComponent = typeDisplay.icon;
              const quantity = Math.abs(transaction.quantity || 0);
              const isIncrease = (transaction.quantity || 0) > 0;
            
              return (
                <div
                  key={transaction.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-card/50 hover:bg-card/80 transition-colors"
                >
                  <div className={`p-2 rounded-full ${typeDisplay.bg} flex-shrink-0`}>
                    <IconComponent className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border ${typeDisplay.bg}`}>
                          {typeDisplay.label}
                        </span>
                        {transaction.reference_number && (
                          <span className="text-xs text-muted-foreground">
                            #{transaction.reference_number}
                          </span>
                        )}
                        {/* Manual consumption indicator */}
                        {(transaction.transaction_type?.toLowerCase().includes('manual') ||
                          transaction.reference_type?.toLowerCase() === 'manual' ||
                          transaction.notes?.toLowerCase().includes('manual')) && (
                          <Badge variant="outline" className="ml-2 bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400">
                            Manual
                          </Badge>
                        )}
                        {/* Purchase update indicator */}
                        {transaction.isUpdated && (
                          <Badge variant="outline" className="ml-2 bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400">
                            <Edit className="h-3 w-3 mr-1" />
                            Updated
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1 ${isIncrease ? 'text-green-600' : 'text-blue-600'}`}>
                          {isIncrease ? (
                            <ArrowUpCircle className="h-4 w-4" />
                          ) : (
                            <ArrowDownCircle className="h-4 w-4" />
                          )}
                          <span className="font-medium">
                            {isIncrease ? '+' : ''}{quantity}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {getTimeAgo(transaction.transaction_date)}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p>{typeDisplay.description}</p>
                      {transaction.isUpdated && transaction.originalTransactionDate && (
                        <p className="text-xs mt-1 text-blue-600 dark:text-blue-400">
                          Originally created: {formatDate(transaction.originalTransactionDate)} | Updated: {formatDate(transaction.transaction_date)}
                        </p>
                      )}
                      {transaction.notes && (
                        <p className="text-xs mt-1 italic">{transaction.notes}</p>
                      )}
                      {/* Manual consumption view button */}
                      {(transaction.transaction_type?.toLowerCase().includes('manual') ||
                        transaction.reference_type?.toLowerCase() === 'manual' ||
                        transaction.notes?.toLowerCase().includes('manual')) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => {
                            // Replace with your manual view logic
                            showToast({
                              title: 'Manual Consumption',
                              description: transaction.notes || 'Manual transaction',
                              type: 'info',
                            });
                          }}
                        >
                          View Manual
                        </Button>
                      )}
                      
                      {/* Job Card link button */}
                      {transaction.reference_type?.toLowerCase() === 'jobcard' && transaction.reference_id && (
                        <Link to={`/production/job-cards/${transaction.reference_id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View Job Card
                          </Button>
                        </Link>
                      )}
                      
                      {/* Purchase link button */}
                      {(transaction.reference_type?.toLowerCase() === 'purchase' || 
                        transaction.transaction_type?.toLowerCase().includes('purchase')) && 
                        transaction.reference_id && (
                        <Link to={`/purchases/${transaction.reference_id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View Purchase
                          </Button>
                        </Link>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <span>Qty Change: {(transaction.quantity || 0) > 0 ? '+' : ''}{(transaction.quantity || 0).toFixed(2)}</span>
                      <span>Balance After: <span className="font-semibold text-blue-600 dark:text-blue-400">{(runningBalances.get(transaction.id) || 0).toFixed(2)}</span></span>
                      <span>Previous: {(transaction.previous_quantity || 0).toFixed(2)}</span>
                      <span>{formatDate(transaction.transaction_date)}</span>
                    </div>
                  </div>
                </div>
              );
            } catch (error) {
              console.error("Error rendering transaction:", transaction.id, error);
              return (
                <div key={transaction.id} className="p-3 text-red-500 text-sm">
                  Error displaying transaction {transaction.id}
                </div>
              );
            }
          }).filter(Boolean)}
        </div>
        
        <div className="mt-4 p-3 rounded-lg bg-muted/20 dark:bg-muted/10 border border-border/40">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>
              This view filters out transactions from deleted job cards and other non-essential entries.
              Showing only purchases (with updates consolidated), manual consumption, and consumption from active job cards.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
