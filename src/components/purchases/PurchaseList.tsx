
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PurchaseWithItems } from "@/types/purchase";
import { format } from "date-fns";
import { Eye, CheckCircle, Package, Truck } from "lucide-react";

interface PurchaseListProps {
  purchases: PurchaseWithItems[];
  onViewDetails: (purchase: PurchaseWithItems) => void;
  onComplete: (purchaseId: string) => void;
  isLoading?: boolean;
}

export const PurchaseList = ({ purchases, onViewDetails, onComplete, isLoading = false }: PurchaseListProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pending</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (purchases.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No purchases found</p>
          <p className="text-muted-foreground">Create your first purchase to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {purchases.map((purchase) => (
        <Card key={purchase.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <CardTitle className="text-lg">{purchase.purchase_number}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {purchase.supplier?.name || 'Unknown Supplier'}
                  </p>
                </div>
                {getStatusBadge(purchase.status)}
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => onViewDetails(purchase)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                {purchase.status === 'pending' && (
                  <Button 
                    size="sm" 
                    onClick={() => onComplete(purchase.id)}
                    disabled={isLoading}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Purchase Date</p>
                <p className="font-medium">{format(new Date(purchase.purchase_date), 'dd MMM yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Items</p>
                <p className="font-medium">{purchase.purchase_items?.length || 0} items</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transport</p>
                <p className="font-medium">₹{purchase.transport_charge.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="font-medium text-lg">₹{purchase.total_amount.toFixed(2)}</p>
              </div>
            </div>
            {purchase.notes && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm">{purchase.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
