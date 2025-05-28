import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockTransaction, TransactionLog } from "@/types/inventory";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowDownRight, ArrowUpRight, RefreshCcw, History, Info, FileText, Database, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { showToast } from "@/components/ui/enhanced-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

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
  const [localLoading, setLocalLoading] = useState<boolean>(isLoading);
  const [hoveredTransaction, setHoveredTransaction] = useState<string | null>(null);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy, h:mm a");
    } catch (e) {
      return dateString;
    }
  };

  // Get label and styling for transaction type
  const getTransactionTypeLabel = (type: string) => {
    const typeLower = type?.toLowerCase();
    
    if (typeLower?.includes('purchase') || typeLower?.includes('increase')) {
      return { label: "Addition", variant: "default", icon: ArrowUpRight, color: "bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400" };
    }
    else if (typeLower?.includes('order') || typeLower?.includes('consumption')) {
      return { label: "Consumption", variant: "destructive", icon: ArrowDownRight, color: "bg-red-100 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400" };
    }
    else if (typeLower?.includes('sale')) {
      return { label: "Sale", variant: "secondary", icon: ArrowDownRight, color: "bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-400" };
    }
    else if (typeLower?.includes('adjustment')) {
      if (typeLower.includes('decrease')) {
        return { label: "Decrease", variant: "outline", icon: ArrowDownRight, color: "bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400" };
      } else {
        return { label: "Adjustment", variant: "outline", icon: null, color: "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400" };
      }
    }
    return { label: type || "Unknown", variant: "outline", icon: null, color: "bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-800/30 dark:border-gray-700 dark:text-gray-400" };
  };
  
  // Get reference information for display
  const getReferenceInfo = (transaction: TransactionLog) => {
    const { reference_type, reference_number, reference_id, metadata } = transaction;
    
    if (reference_type?.toLowerCase().includes('order')) {
      const orderNumber = reference_number || metadata?.order_number;
      const componentType = metadata?.component_type;
      
      return {
        label: orderNumber ? `Order #${orderNumber}` : 'Order',
        detail: componentType ? `for ${componentType}` : '',
        icon: Package
      };
    }
    
    if (reference_type?.toLowerCase().includes('purchase')) {
      return {
        label: reference_number ? `Purchase #${reference_number}` : 'Purchase',
        detail: metadata?.company_name ? `from ${metadata.company_name}` : '',
        icon: ArrowUpRight
      };
    }
    
    if (reference_type?.toLowerCase().includes('adjustment')) {
      return {
        label: 'Adjustment',
        detail: metadata?.update_source || '',
        icon: Database
      };
    }
    
    return {
      label: reference_type || 'Unknown',
      detail: reference_number ? `#${reference_number}` : '',
      icon: Info
    };
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
    } catch (error: any) {
      console.error("Error in local transaction refresh:", error);
      showToast({
        title: "Error refreshing transactions",
        description: error.message,
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

  const isEmpty = !transactions.length && !transactionLogs.length;
  const totalRecords = transactions.length + transactionLogs.length;

  // Show empty state if no transactions
  if (isEmpty) {
    return (
      <Card className="mt-6 border-border/60 overflow-hidden slide-up" style={{animationDelay: '0.1s'}}>
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
    <Card className="mt-4 border-border/60 overflow-hidden slide-up" style={{animationDelay: '0.15s'}}>
      <CardHeader className="flex flex-row items-center justify-between bg-muted/30 dark:bg-muted/10 border-b border-border/40">
        <CardTitle className="flex items-center gap-2 text-primary">
          <History className="h-5 w-5" />
          <span>Transaction History</span>
          <Badge variant="outline" className="ml-2 bg-primary/10 dark:bg-primary/20 border-primary/20 dark:border-primary/30 text-primary hover:bg-primary/15">
            {totalRecords} record{totalRecords !== 1 ? 's' : ''}
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
        </div>
        
        <div className="space-y-3">
              {/* Deduplicate transactions to avoid showing the same transaction with different labels */}
              {(() => {
                // Enable this for deep debugging
                const DEBUG = true;
                
                if (DEBUG) {
                  console.log('===== TRANSACTION DEDUPLICATION DEBUG =====');
                  console.log(`Starting with ${transactionLogs.length} transaction logs`);
                  console.log('All transaction logs:', transactionLogs);
                }
                
                // First, group transactions by their numerical characteristics AND time proximity
                const groupedByQuantity: { [key: string]: TransactionLog[] } = {};
                
                // Sort by transaction date to process in chronological order
                const chronologicalLogs = [...transactionLogs].sort((a, b) => 
                  new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
                );
                
                // Create groups of transactions with same numerical values and close timestamps
                chronologicalLogs.forEach(log => {
                  let foundGroup = false;
                  const logTime = new Date(log.transaction_date).getTime();
                  
                  // Check existing groups for a match based on quantity and time proximity
                  Object.keys(groupedByQuantity).forEach(key => {
                    if (foundGroup) return; // Skip if already found a group
                    
                    const group = groupedByQuantity[key];
                    if (group.length === 0) return;
                    
                    // Check first transaction in the group to see if this log belongs with it
                    const firstLog = group[0];
                    const firstTime = new Date(firstLog.transaction_date).getTime();
                    
                    // If quantities match exactly and time is within 1 minute, add to this group
                    if (Math.abs(firstLog.quantity - log.quantity) < 0.01 &&
                        Math.abs(firstLog.previous_quantity - log.previous_quantity) < 0.01 &&
                        Math.abs(firstLog.new_quantity - log.new_quantity) < 0.01 &&
                        Math.abs(logTime - firstTime) < 60000) { // 1 minute
                      
                      groupedByQuantity[key].push(log);
                      foundGroup = true;
                    }
                  });
                  
                  // If no matching group found, create a new one
                  if (!foundGroup) {
                    const key = `${log.previous_quantity}-${log.new_quantity}-${log.quantity}-${logTime}`;
                    groupedByQuantity[key] = [log];
                  }
                });
                
                if (DEBUG) {
                  console.log('Grouped transactions by numerical values:');
                  Object.keys(groupedByQuantity).forEach(key => {
                    console.log(`Group ${key}:`, groupedByQuantity[key]);
                  });
                }
                
                // Process each group to eliminate duplicates
                const deduplicatedLogs: TransactionLog[] = [];
                
                Object.values(groupedByQuantity).forEach(group => {
                  if (group.length === 1) {
                    // If only one transaction in the group, keep it
                    deduplicatedLogs.push(group[0]);
                    if (DEBUG) console.log(`Single transaction in group - keeping:`, group[0]);
                    return;
                  }
                  
                  // Check for purchase + manual entry duplicate pattern
                  const hasPurchase = group.some(log => 
                    log.transaction_type.toLowerCase().includes('purchase'));
                  const hasManual = group.some(log => 
                    log.transaction_type.toLowerCase().includes('manual') || 
                    log.transaction_type.toLowerCase().includes('adjustment'));
                  
                  if (hasPurchase && hasManual) {
                    // Keep only purchase transactions from this group
                    const purchases = group.filter(log => 
                      log.transaction_type.toLowerCase().includes('purchase'));
                    
                    if (DEBUG) {
                      console.log('Found purchase + manual entry group:');
                      console.log('- All logs in group:', group);
                      console.log('- Keeping only purchases:', purchases);
                    }
                    
                    deduplicatedLogs.push(...purchases);
                  } else {
                    // Otherwise keep the most recent transaction from the group
                    const sortedGroup = [...group].sort(
                      (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
                    );
                    
                    if (DEBUG) {
                      console.log('Other duplicate group - keeping most recent:');
                      console.log('- All logs in group:', group);
                      console.log('- Keeping:', sortedGroup[0]);
                    }
                    
                    deduplicatedLogs.push(sortedGroup[0]);
                  }
                });
                
                // Sort by transaction date (newest first)
                const finalSortedLogs = deduplicatedLogs.sort(
                  (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
                );
                
                if (DEBUG) {
                  console.log(`Deduplication complete. Reduced from ${transactionLogs.length} to ${finalSortedLogs.length} logs`);
                  console.log('Final deduplicated logs:', finalSortedLogs);
                  console.log('===== END TRANSACTION DEDUPLICATION DEBUG =====');
                }
                
                return finalSortedLogs;
              })().map((log) => {
              const typeInfo = getTransactionTypeLabel(log.transaction_type);
              const { icon: Icon } = typeInfo;
              const isRecent = new Date(log.transaction_date) > new Date(Date.now() - 3600000 * 24);
              const isNegative = log.quantity < 0;
              const referenceInfo = getReferenceInfo(log);
              
              return (
                <div 
                  key={log.id} 
                  className={`border rounded-md p-0 overflow-hidden ${hoveredTransaction === log.id ? 'border-primary' : 'border-border'}`}
                  onMouseEnter={() => setHoveredTransaction(log.id)}
                  onMouseLeave={() => setHoveredTransaction(null)}
                >
                  {/* Header with transaction type */}
                  <div className={`py-1.5 px-3 ${typeInfo.color}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 font-medium">
                        {Icon && <Icon className="h-3.5 w-3.5" />}
                        <span>{typeInfo.label}</span>
                      </div>
                      <span className="text-xs">{formatDate(log.transaction_date)}</span>
                    </div>
                  </div>
                  
                  {/* Main content */}
                  <div className="p-3">
                    {/* Stock changes */}
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium">
                        <span className="text-muted-foreground">Opening:</span>{" "}
                        <span>{log.previous_quantity.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-sm font-semibold ${isNegative ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
                          {isNegative ? '' : '+'}{log.quantity.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-sm font-medium">
                        <span className="text-muted-foreground">Closing:</span>{" "}
                        <span>{log.new_quantity.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    {/* Reference information */}
                    {log.reference_id && (
                      <div className="flex items-center gap-1 text-sm">
                        {referenceInfo.icon && <referenceInfo.icon className="h-3.5 w-3.5 text-muted-foreground" />}
                        <span>{referenceInfo.label}</span>
                        {referenceInfo.detail && (
                          <span className="text-muted-foreground">{referenceInfo.detail}</span>
                        )}
                      </div>
                    )}
                    
                    {/* Notes if available */}
                    {log.notes && (
                      <div className="mt-1 text-sm text-muted-foreground italic">
                        "{log.notes}"
                      </div>
                    )}
                  </div>
                  
                  {/* Additional information on hover */}
                  {hoveredTransaction === log.id && log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="border-t border-border p-2 bg-muted/30 text-xs">
                      <div className="grid grid-cols-2 gap-1">
                        {Object.entries(log.metadata).filter(([key]) => 
                          !['material_name', 'unit'].includes(key) && 
                          typeof key === 'string' && 
                          key.trim() !== ''
                        ).map(([key, value], index) => (
                          <React.Fragment key={index}>
                            <span className="text-muted-foreground">{key.replace(/_/g, ' ')}:</span>
                            <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            
            {transactionLogs.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                No transaction logs found for this material
              </div>
            )}
          </div>
      </CardContent>
    </Card>
  );
};
