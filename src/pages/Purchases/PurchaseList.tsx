
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PurchaseList as PurchaseListComponent } from "@/components/purchases/PurchaseList";
import { usePurchases } from "@/hooks/purchases/usePurchases";
import { PurchaseWithItems } from "@/types/purchase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const PurchaseList = () => {
  const navigate = useNavigate();
  const { purchases, isLoading, completePurchase } = usePurchases();
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseWithItems | null>(null);

  const handleNewPurchase = () => {
    navigate('/purchases/new');
  };

  const handleViewDetails = (purchase: PurchaseWithItems) => {
    setSelectedPurchase(purchase);
  };

  const handleComplete = async (purchaseId: string) => {
    await completePurchase(purchaseId);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Purchases</h1>
          <p className="text-muted-foreground">Manage material purchases from suppliers</p>
        </div>
        <Button onClick={handleNewPurchase}>
          <Plus className="h-4 w-4 mr-2" />
          New Purchase
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading purchases...</div>
      ) : (
        <PurchaseListComponent
          purchases={purchases}
          onViewDetails={handleViewDetails}
          onComplete={handleComplete}
          isLoading={isLoading}
        />
      )}

      {selectedPurchase && (
        <Dialog open={!!selectedPurchase} onOpenChange={() => setSelectedPurchase(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Purchase Details - {selectedPurchase.purchase_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Supplier</p>
                  <p className="font-medium">{selectedPurchase.supplier?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{selectedPurchase.status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Purchase Date</p>
                  <p className="font-medium">{selectedPurchase.purchase_date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-medium">₹{selectedPurchase.total_amount.toFixed(2)}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Items Purchased</h3>
                <div className="space-y-3">
                  {selectedPurchase.purchase_items?.map((item, index) => (
                    <div key={item.id} className="p-4 border rounded-lg">
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Material</p>
                          <p className="font-medium">Item {index + 1}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Quantity</p>
                          <p className="font-medium">{item.quantity}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Unit Price</p>
                          <p className="font-medium">₹{item.unit_price.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Line Total</p>
                          <p className="font-medium">₹{item.line_total.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between mb-2">
                  <span>Subtotal:</span>
                  <span>₹{selectedPurchase.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Transport Charge:</span>
                  <span>₹{selectedPurchase.transport_charge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>₹{selectedPurchase.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {selectedPurchase.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedPurchase.notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
