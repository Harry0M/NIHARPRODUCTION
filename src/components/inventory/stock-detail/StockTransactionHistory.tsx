import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockTransaction, TransactionLog } from "@/types/inventory";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowDownRight, ArrowUpRight, RefreshCcw, History, Info, FileText, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { showToast } from "@/components/ui/enhanced-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
  const [activeTab, setActiveTab] = useState<string>("transactions");

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
      return { label: "Addition", variant: "default", icon: ArrowUpRight };
    }
    else if (typeLower?.includes('order') || typeLower?.includes('consumption')) {
      return { label: "Consumption", variant: "destructive", icon: ArrowDownRight };
    }
    else if (typeLower?.includes('sale')) {
      return { label: "Sale", variant: "secondary", icon: ArrowDownRight };
    }
    else if (typeLower?.includes('adjustment')) {
      if (typeLower.includes('decrease')) {
        return { label: "Decrease", variant: "outline", icon: ArrowDownRight };
      } else {
        return { label: "Adjustment", variant: "outline", icon: null };
      }
    }
    return { label: type || "Unknown", variant: "outline", icon: null };
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
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={localLoading || isLoading}
            className="flex items-center gap-1"
          >
            <RefreshCcw className={`h-4 w-4 ${(localLoading || isLoading) ? 'animate-spin' : ''}`} />
            {(localLoading || isLoading) ? "Refreshing..." : "Refresh Transactions"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 space-y-2">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground text-center">No transaction history found</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              When materials are used in orders or new stock is added, transactions will appear here.
              {(localLoading || isLoading) ? " Checking for latest transactions..." : ""}
            </p>
            {!localLoading && !isLoading && (
              <Button 
                variant="default" 
                onClick={handleRefresh} 
                className="mt-4"
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Check for New Transactions
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between bg-muted/20">
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          <span>Transaction History</span>
          <Badge variant="outline" className="ml-2">
            {totalRecords} {totalRecords === 1 ? 'transaction' : 'transactions'}
          </Badge>
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={localLoading || isLoading}
          className="flex items-center gap-1"
        >
          <RefreshCcw className={`h-4 w-4 ${(localLoading || isLoading) ? 'animate-spin' : ''}`} />
          {(localLoading || isLoading) ? "Refreshing..." : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs defaultValue="transactions" value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="transactions" className="flex items-center gap-1">
              <History className="h-4 w-4" />
              Transactions
              {transactions.length > 0 && (
                <span className="ml-1 text-xs bg-primary/20 rounded-full px-1.5 py-0.5">
                  {transactions.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-1">
              <Database className="h-4 w-4" />
              Detailed Logs
              {transactionLogs.length > 0 && (
                <span className="ml-1 text-xs bg-primary/20 rounded-full px-1.5 py-0.5">
                  {transactionLogs.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="transactions" className="space-y-4 mt-2">
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {transactions.map((transaction) => {
                const typeInfo = getTransactionTypeLabel(transaction.transaction_type);
                const isNegative = transaction.quantity < 0;
                const Icon = typeInfo.icon;
                const isRecent = new Date(transaction.created_at).getTime() > Date.now() - 1000 * 60 * 10; // Within last 10 minutes
                
                return (
                  <div 
                    key={transaction.id} 
                    className={`border rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/50 transition-colors
                      ${isRecent ? 'border-primary bg-primary/5' : ''}`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={typeInfo.variant as any} className={`px-2 py-1 ${isRecent ? 'animate-pulse' : ''}`}>
                          {Icon && <Icon className="h-3.5 w-3.5 mr-1" />}
                          {typeInfo.label}
                        </Badge>
                        <span className="text-sm font-medium flex items-center gap-1">
                          {isRecent && (
                            <span className="relative flex h-2 w-2 mr-1">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                          )}
                          {formatDate(transaction.created_at)}
                          <span className="text-xs text-muted-foreground ml-1">
                            ({getTimeAgo(transaction.created_at)})
                          </span>
                        </span>
                      </div>
                      
                      {transaction.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{transaction.notes}</p>
                      )}
                      
                      {transaction.reference_number && (
                        <div className="flex flex-col gap-1 mt-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center text-sm text-muted-foreground gap-2">
                                  <FileText className="h-3.5 w-3.5" />
                                  <span>
                                    {transaction.reference_type || 'Reference'} #{transaction.reference_number}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Reference information</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          {transaction.updated_at && transaction.updated_at !== transaction.created_at && (
                            <div className="text-xs text-muted-foreground">
                              Last modified: {formatDate(transaction.updated_at)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-lg font-semibold flex items-center ${isNegative ? 'text-red-500' : 'text-green-500'}`}>
                        {Icon && <Icon className="h-5 w-5 mr-1" />}
                        {isNegative ? '' : '+'}{transaction.quantity.toFixed(2)}
                      </span>
                      
                      {transaction.unit && (
                        <span className="text-sm text-muted-foreground">
                          {transaction.unit}
                        </span>
                      )}
                      
                      {transaction.unit_price && (
                        <span className="text-sm text-muted-foreground">
                          @ ₹{transaction.unit_price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {transactions.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  No transactions found for this material
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="logs" className="space-y-4 mt-2">
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {transactionLogs.map((log) => {
                const typeInfo = getTransactionTypeLabel(log.transaction_type);
                const isNegative = log.quantity < 0;
                const Icon = typeInfo.icon;
                const isRecent = new Date(log.transaction_date).getTime() > Date.now() - 1000 * 60 * 10; // Within last 10 minutes
                
                return (
                  <div 
                    key={log.id} 
                    className={`border rounded-md p-4 flex flex-col gap-3 hover:bg-muted/50 transition-colors
                      ${isRecent ? 'border-primary bg-primary/5' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge variant={typeInfo.variant as any} className={`px-2 py-1 ${isRecent ? 'animate-pulse' : ''}`}>
                          {Icon && <Icon className="h-3.5 w-3.5 mr-1" />}
                          {typeInfo.label}
                        </Badge>
                        <span className="text-sm font-medium flex items-center gap-1">
                          {isRecent && (
                            <span className="relative flex h-2 w-2 mr-1">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                          )}
                          {formatDate(log.transaction_date)}
                          <span className="text-xs text-muted-foreground ml-1">
                            ({getTimeAgo(log.transaction_date)})
                          </span>
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-lg font-semibold flex items-center ${isNegative ? 'text-red-500' : 'text-green-500'}`}>
                          {Icon && <Icon className="h-5 w-5 mr-1" />}
                          {isNegative ? '' : '+'}{log.quantity.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm border-t border-muted pt-3">
                      <div>
                        <p className="text-muted-foreground">Previous quantity</p>
                        <p className="font-medium">{log.previous_quantity.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">New quantity</p>
                        <p className="font-medium">{log.new_quantity.toFixed(2)}</p>
                      </div>
                      
                      {log.notes && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Notes</p>
                          <p className="font-medium">{log.notes}</p>
                        </div>
                      )}
                      
                      {log.reference_id && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Reference</p>
                          <p className="font-medium">{log.reference_type} #{log.reference_number || log.reference_id}</p>
                        </div>
                      )}
                      
                      {log.metadata && (
                        <div className="col-span-2 bg-muted/30 p-2 rounded-md mt-1">
                          <p className="text-muted-foreground text-xs mb-1">Additional information</p>
                          <div className="text-xs">
                            {Object.entries(log.metadata || {}).map(([key, value]) => (
                              <div key={key} className="grid grid-cols-2">
                                <span className="font-medium">{key}:</span>
                                <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {transactionLogs.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  No detailed transaction logs found for this material
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
