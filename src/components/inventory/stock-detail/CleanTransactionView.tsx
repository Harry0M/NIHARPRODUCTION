import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionLog } from "@/types/inventory";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, ArrowDownCircle, History, RefreshCcw, Package, ShoppingCart, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { showToast } from "@/components/ui/enhanced-toast";
import { supabase } from "@/integrations/supabase/client";

interface CleanTransactionViewProps {
  transactionLogs?: TransactionLog[];
  onRefresh?: () => void;
  isLoading?: boolean;
  materialId?: string;
}

export const CleanTransactionView = ({ 
  transactionLogs = [],
  onRefresh,
  isLoading = false,
  materialId
}: CleanTransactionViewProps) => {
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionLog[]>([]);
  const [localLoading, setLocalLoading] = useState<boolean>(isLoading);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy, h:mm a");
    } catch (e) {
      return dateString;
    }
  };

  // Get transaction type badge color and icon
  const getTransactionTypeDisplay = (transaction: TransactionLog) => {
    const type = transaction.transaction_type.toLowerCase();
    const refType = transaction.reference_type?.toLowerCase();
    
    if (type.includes('purchase') || refType === 'purchase') {
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
  const filterTransactions = async (transactions: TransactionLog[]) => {
    if (transactions.length === 0) {
      setFilteredTransactions([]);
      return;
    }

    try {
      const filtered: TransactionLog[] = [];

      for (const transaction of transactions) {
        const type = transaction.transaction_type.toLowerCase();
        const refType = transaction.reference_type?.toLowerCase();
        const notes = transaction.notes?.toLowerCase() || "";

        // Include all purchase transactions
        if (type.includes('purchase') || refType === 'purchase') {
          filtered.push(transaction);
          continue;
        }

        // Include manual consumption transactions (by type, refType, or notes)
        if (type.includes('manual') || refType === 'manual' || notes.includes('manual')) {
          filtered.push(transaction);
          continue;
        }

        // For job consumption transactions, check if job card still exists
        if ((type.includes('consumption') || refType === 'jobcard') && transaction.reference_id) {
          try {
            const { data: jobCard, error } = await supabase
              .from('job_cards')
              .select('id')
              .eq('id', transaction.reference_id)
              .single();

            // If job card exists (not deleted), include the transaction
            if (!error && jobCard) {
              filtered.push(transaction);
            }
            // If job card doesn't exist (deleted), skip this transaction
          } catch (error) {
            // If there's an error checking the job card, skip this transaction
            console.warn(`Error checking job card ${transaction.reference_id}:`, error);
          }
        }
      }

      // Sort by transaction date (newest first)
      filtered.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());

      setFilteredTransactions(filtered);
    } catch (error) {
      console.error("Error filtering transactions:", error);
      setFilteredTransactions([]);
    }
  };

  // Filter transactions whenever the input changes
  useEffect(() => {
    filterTransactions(transactionLogs);
  }, [transactionLogs]);

  // Local refresh function when parent handler not provided
  const handleLocalRefresh = async () => {
    if (!materialId) return;
    
    setLocalLoading(true);
    try {
      console.log(`Refreshing clean transaction view for material ID: ${materialId}`);
      
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

  const isEmpty = filteredTransactions.length === 0;

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
              This view shows only purchase transactions and job consumption from active (non-deleted) job cards.
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
        <div className="flex items-center mb-3 gap-2">
          <History className="h-4 w-4" />
          <h3 className="text-sm font-medium">Clean Transactions</h3>
          <span className="text-xs bg-primary/20 rounded-full px-1.5 py-0.5">
            {filteredTransactions.length}
          </span>
          <span className="text-xs text-muted-foreground">
            (Purchases + Active Job Consumption)
          </span>
        </div>
        
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => {
            const typeDisplay = getTransactionTypeDisplay(transaction);
            const IconComponent = typeDisplay.icon;
            const quantity = Math.abs(transaction.quantity);
            const isIncrease = transaction.quantity > 0;
            
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
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <span>New Qty: {transaction.new_quantity}</span>
                    <span>Previous: {transaction.previous_quantity}</span>
                    <span>{formatDate(transaction.transaction_date)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 rounded-lg bg-muted/20 dark:bg-muted/10 border border-border/40">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>
              This view filters out transactions from deleted job cards and other non-essential entries.
              Showing only purchases and consumption from active job cards.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
