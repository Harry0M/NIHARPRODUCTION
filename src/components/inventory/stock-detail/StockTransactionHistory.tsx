
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockTransaction } from "@/types/inventory";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowDownRight, ArrowUpRight } from "lucide-react";

interface StockTransactionHistoryProps {
  transactions: StockTransaction[];
}

export const StockTransactionHistory = ({ transactions }: StockTransactionHistoryProps) => {
  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 space-y-2">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground text-center">No transaction history found</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              When materials are used in orders or new stock is added, transactions will appear here.
            </p>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History ({transactions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => {
            const typeInfo = getTransactionTypeLabel(transaction.transaction_type);
            const isNegative = transaction.quantity < 0;
            const Icon = typeInfo.icon;
            
            return (
              <div 
                key={transaction.id} 
                className="border rounded-md p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={typeInfo.variant as any}>{typeInfo.label}</Badge>
                    <span className="text-sm font-medium">
                      {formatDate(transaction.created_at)}
                    </span>
                  </div>
                  
                  {transaction.notes && (
                    <p className="text-sm text-muted-foreground mt-1">{transaction.notes}</p>
                  )}
                  
                  {transaction.reference_number && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Ref: {transaction.reference_type || 'Order'} #{transaction.reference_number}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`font-semibold flex items-center ${isNegative ? 'text-red-500' : 'text-green-500'}`}>
                    {Icon && <Icon className="h-4 w-4 mr-1" />}
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
