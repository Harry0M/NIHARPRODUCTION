
import React from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/ui/card";

interface Transaction {
  id: string;
  created_at: string;
  inventory_id: string;
  transaction_type: string;
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
}

interface StockTransactionHistoryProps {
  transactions: Transaction[] | undefined;
  isLoading: boolean;
}

export const StockTransactionHistory: React.FC<StockTransactionHistoryProps> = ({
  transactions,
  isLoading
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="w-3/4 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No transactions recorded for this material.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">
                    {transaction.transaction_type === 'receipt' ? 'Received' : 
                     transaction.transaction_type === 'consumption' ? 'Consumed' : 
                     transaction.transaction_type === 'adjustment' ? 'Adjusted' : 'Other'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.notes || 
                      (transaction.reference_type && transaction.reference_id 
                        ? `${transaction.reference_type}: ${transaction.reference_id}` 
                        : 'No reference provided')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(transaction.created_at), "MMM d, yyyy - h:mm a")}
                  </p>
                </div>
                <Badge 
                  className={
                    transaction.quantity > 0 ? "bg-green-100 text-green-800 hover:bg-green-100" : 
                    "bg-red-100 text-red-800 hover:bg-red-100"
                  }
                >
                  {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                </Badge>
              </div>
              <Separator />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
