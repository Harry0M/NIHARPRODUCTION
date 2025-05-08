
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockTransaction } from "@/types/inventory";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

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
          <p className="text-muted-foreground text-center py-6">No transaction history available</p>
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
        return { label: "Purchase", variant: "default" };
      case "sale":
        return { label: "Sale", variant: "secondary" };
      case "order":
        return { label: "Order Usage", variant: "destructive" };
      case "adjustment":
        return { label: "Adjustment", variant: "outline" };
      default:
        return { label: type || "Unknown", variant: "outline" };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => {
            const typeInfo = getTransactionTypeLabel(transaction.transaction_type);
            const isNegative = transaction.quantity < 0;
            
            return (
              <div 
                key={transaction.id} 
                className="border rounded-md p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
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
                  <span className={`font-semibold ${isNegative ? 'text-red-500' : 'text-green-500'}`}>
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
