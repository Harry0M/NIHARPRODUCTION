
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockTransaction } from "@/types/inventory";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowDownRight, ArrowUpRight, RefreshCcw, History, Info, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StockTransactionHistoryProps {
  transactions: StockTransaction[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const StockTransactionHistory = ({ 
  transactions,
  onRefresh,
  isLoading = false
}: StockTransactionHistoryProps) => {
  if (!transactions || transactions.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Transaction History
          </CardTitle>
          {onRefresh && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh} 
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? "Refreshing..." : "Refresh Transactions"}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 space-y-2">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground text-center">No transaction history found</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              When materials are used in orders or new stock is added, transactions will appear here.
              {isLoading ? " Checking for latest transactions..." : ""}
            </p>
            {onRefresh && !isLoading && (
              <Button 
                variant="default" 
                onClick={onRefresh} 
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

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy, h:mm a");
    } catch (e) {
      return dateString;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type?.toLowerCase()) {
      case "purchase":
        return { label: "Purchase", variant: "default", icon: ArrowUpRight };
      case "sale":
        return { label: "Sale", variant: "secondary", icon: ArrowDownRight };
      case "order":
        return { label: "Order Usage", variant: "destructive", icon: ArrowDownRight };
      case "adjustment":
        return { label: "Adjustment", variant: "outline", icon: null };
      default:
        return { label: type || "Unknown", variant: "outline", icon: null };
    }
  };

  const renderTransactionDetail = (transaction: StockTransaction) => {
    // Display more details based on transaction type
    if (transaction.transaction_type.toLowerCase() === 'order') {
      return (
        <div className="flex flex-col gap-1 mt-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-sm text-muted-foreground gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  <span>
                    {transaction.reference_type || 'Order'} #{transaction.reference_number}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Material used in this order</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {transaction.updated_at && (
            <div className="text-xs text-muted-foreground">
              Last modified: {formatDate(transaction.updated_at)}
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };

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

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between bg-muted/20">
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          <span>Transaction History</span>
          <Badge variant="outline" className="ml-2">
            {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}
          </Badge>
        </CardTitle>
        {onRefresh && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh} 
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4">
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
                  
                  {renderTransactionDetail(transaction)}
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-lg font-semibold flex items-center ${isNegative ? 'text-red-500' : 'text-green-500'}`}>
                    {Icon && <Icon className="h-5 w-5 mr-1" />}
                    {isNegative ? '' : '+'}{transaction.quantity.toFixed(2)}
                  </span>
                  
                  {transaction.unit_price && (
                    <span className="text-sm text-muted-foreground">
                      @ ₹{transaction.unit_price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
