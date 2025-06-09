import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, AlertTriangle, FileCheck, FileClock, FileX, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatters";
import { showToast } from "@/components/ui/enhanced-toast";
import { completePurchaseWithActualMeter, reversePurchaseCompletion } from "@/utils/purchaseInventoryUtils";
import { usePurchaseDeletion } from "@/hooks/use-purchase-deletion";
import { DeletePurchaseDialog } from "@/components/purchases/list/DeletePurchaseDialog";

interface InventoryItem {
  id: string;
  material_name: string;
  color?: string;
  gsm?: string;
  unit: string;
  alternate_unit: string;
  conversion_rate: number;
}

interface PurchaseItem {
  id: string;
  material_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  gst_percentage: number;
  gst_amount: number;
  material: InventoryItem;
  actual_meter: number;
  alt_quantity: number;
  alt_unit_price: number;
  true_unit_price?: number;
  transport_share?: number;
  true_line_total?: number;
}

interface Purchase {
  id: string;
  purchase_number: string;
  purchase_date: string;
  supplier_id: string;
  total_amount: number;
  status: string;
  transport_charge: number;
  subtotal: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  notes: string;
  invoice_number?: string;
  suppliers: {
    id: string;
    name: string;
    contact_person: string;
    phone: string;
    address: string;
    gst: string | null;
  };
  purchase_items: PurchaseItem[];
}

const PurchaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState<Purchase | null>(null);

  // Purchase deletion hook
  const {
    purchaseToDelete,
    deleteDialogOpen,
    deleteLoading,
    handleDeleteClick,
    handleDeletePurchase,
    cancelDelete,
    setDeleteDialogOpen
  } = usePurchaseDeletion(() => {
    // Navigate back to purchases list after deletion
    navigate("/purchases");
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['purchase', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          suppliers (*),
          purchase_items (
            id,
            material_id,
            quantity,
            unit_price,
            line_total,
            gst_percentage,
            gst_amount,
            alt_quantity,
            alt_unit_price,
            material:inventory (
              id,
              material_name,
              color,
              unit,
              alternate_unit,
              conversion_rate
            ),
            actual_meter
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as unknown as Purchase;
    },
    enabled: !!id,
  });
  
  const [purchaseItemsWithTransport, setPurchaseItemsWithTransport] = useState<PurchaseItem[]>([]);
  const [perKgTransportRate, setPerKgTransportRate] = useState<number>(0);

  useEffect(() => {
    if (data) {
      setPurchase(data);
      // Only set the data for display - no calculations or modifications
      setPurchaseItemsWithTransport(data.purchase_items || []);
    }
  }, [data]);
  
  // Helper function to sleep for a given number of milliseconds
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Helper function to get current inventory quantity
  const getCurrentInventoryQuantity = async (materialId: string) => {
    const { data, error } = await supabase
      .from("inventory")
      .select("quantity, material_name")
      .eq("id", materialId)
      .single();
      
    if (error) {
      console.error(`Error fetching inventory for ${materialId}:`, error);
      return null;
    }
    
    return data;
  };
  
  const handleStatusChange = async (newStatus: string) => {
    if (!id || !purchase) return;
    
    try {
      console.log(`======= START STATUS CHANGE TO ${newStatus} =======`);
      console.log(`Purchase ID: ${id}`);
      
      // Check inventory quantities BEFORE any changes
      console.log("BEFORE STATUS CHANGE - Current inventory quantities:");
      for (const item of purchase.purchase_items) {
        const inventoryBefore = await getCurrentInventoryQuantity(item.material_id);
        if (inventoryBefore) {
          console.log(`${inventoryBefore.material_name}: ${inventoryBefore.quantity} (Material ID: ${item.material_id})`);
        }
      }
      
      // Handle status change logic using our TypeScript utility functions
      if (newStatus === "completed" && purchase.status !== "completed") {
        console.log("INFO: Purchase being marked as completed - using TypeScript inventory logic");
        
        // Use our TypeScript utility function instead of database triggers
        const result = await completePurchaseWithActualMeter({
          id: purchase.id,
          purchase_number: purchase.purchase_number,
          transport_charge: purchase.transport_charge,
          purchase_items: purchase.purchase_items.map(item => ({
            id: item.id,
            material_id: item.material_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            line_total: item.line_total,
            actual_meter: item.actual_meter || 0,
            material: {
              id: item.material.id,
              material_name: item.material.material_name,
              conversion_rate: item.material.conversion_rate,
              unit: item.material.unit
            }
          }))
        });
        
        if (!result.success) {
          throw new Error(result.error || "Failed to complete purchase inventory updates");
        }
        
        console.log("INFO: Successfully completed inventory updates using actual_meter logic");
        
        // Update the purchase status after successful inventory updates
        const { error } = await supabase
          .from('purchases')
          .update({ status: newStatus })
          .eq('id', id);
        
        if (error) {
          // If status update fails, we should ideally reverse the inventory changes
          console.error("Status update failed, inventory may be inconsistent:", error);
          throw error;
        }
        
      } else if (purchase.status === "completed" && newStatus !== "completed") {
        console.log("INFO: Purchase status changing from completed - reversing inventory changes");
        
        // Use our TypeScript utility function to reverse inventory changes
        const result = await reversePurchaseCompletion({
          id: purchase.id,
          purchase_number: purchase.purchase_number,
          purchase_items: purchase.purchase_items.map(item => ({
            id: item.id,
            material_id: item.material_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            line_total: item.line_total,
            actual_meter: item.actual_meter || 0,
            material: {
              id: item.material.id,
              material_name: item.material.material_name,
              conversion_rate: item.material.conversion_rate,
              unit: item.material.unit
            }
          }))
        });
        
        if (!result.success) {
          throw new Error(result.error || "Failed to reverse purchase inventory changes");
        }
        
        console.log("INFO: Successfully reversed inventory changes");
        
        // Update the purchase status after successful inventory reversal
        const { error } = await supabase
          .from('purchases')
          .update({ status: newStatus })
          .eq('id', id);
        
        if (error) {
          console.error("Status update failed after inventory reversal:", error);
          throw error;
        }
        
      } else {
        // For other status changes (like pending to cancelled), just update the status
        const { error } = await supabase
          .from('purchases')
          .update({ status: newStatus })
          .eq('id', id);
        
        if (error) {
          throw error;
        }
      }
      
      // Final check of inventory quantities
      console.log("AFTER STATUS CHANGE - Final inventory quantities:");
      for (const item of purchase.purchase_items) {
        const finalInventory = await getCurrentInventoryQuantity(item.material_id);
        if (finalInventory) {
          console.log(`${finalInventory.material_name}: ${finalInventory.quantity} (Material ID: ${item.material_id})`);
        }
      }
      
      // Check final transaction logs
      const { data: finalLogs, error: finalLogError } = await supabase
        .from("inventory_transaction_log")
        .select("id, material_id, quantity, reference_id, reference_type, notes, transaction_date")
        .eq("reference_id", id)
        .order('transaction_date', { ascending: false });
        
      if (finalLogError) {
        console.error("Error checking final transaction logs:", finalLogError);
      } else {
        console.log("FINAL TRANSACTION LOGS:", finalLogs);
        console.log(`Total transaction logs found: ${finalLogs?.length || 0}`);
      }
      
      console.log("======= END OF STATUS CHANGE =======\n");
      
      showToast({
        title: "Status Updated",
        description: `Purchase status changed to ${newStatus}`,
        type: "success"
      });
      
      refetch();
    } catch (error: unknown) {
      console.error("Error updating purchase status:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update purchase status";
      showToast({
        title: "Error",
        description: errorMessage,
        type: "error"
      });
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]">
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Loading...
          </span>
        </div>
      </div>
    );
  }
  
  if (error || !purchase) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center p-6">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">Purchase Not Found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              The requested purchase could not be found or an error occurred.
            </p>
            <Button
              onClick={() => window.location.href = "/purchases"}
              className="mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Purchases
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => window.location.href = "/purchases"}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Purchases
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          
          {purchase.status === "pending" && (
            <>
              <Button
                variant="outline"
                className="text-red-500 hover:text-red-600"
                onClick={() => handleStatusChange("cancelled")}
              >
                Cancel Purchase
              </Button>
              <Button 
                onClick={() => handleStatusChange("completed")}
              >
                Mark as Completed
              </Button>
            </>
          )}
          
          {purchase.status === "cancelled" && (
            <Button
              variant="outline"
              onClick={() => handleStatusChange("pending")}
            >
              Reactivate Purchase
            </Button>
          )}
          
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive/80"
            onClick={() => handleDeleteClick(purchase.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Purchase
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold">
                Purchase {purchase.purchase_number}
                {purchase.invoice_number && ` (Invoice: ${purchase.invoice_number})`}
              </CardTitle>
              <CardDescription>
                Purchase created on{" "}
                {new Date(purchase.created_at).toLocaleDateString()} at{" "}
                {new Date(purchase.created_at).toLocaleTimeString()}
              </CardDescription>
            </div>
            <Badge className={getStatusBadgeClass(purchase.status)}>
              {purchase.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Supplier Information</h3>
                <p className="text-lg font-medium">{purchase.suppliers.name}</p>
                {purchase.suppliers.contact_person && (
                  <p>{purchase.suppliers.contact_person}</p>
                )}
                {purchase.suppliers.phone && (
                  <p>{purchase.suppliers.phone}</p>
                )}
                {purchase.suppliers.gst && (
                  <p className="text-sm text-muted-foreground">GST: {purchase.suppliers.gst}</p>
                )}
                {purchase.suppliers.address && (
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {purchase.suppliers.address}
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Purchase Details</h3>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Date</p>
                    <p>{new Date(purchase.purchase_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Number</p>
                    <p>{purchase.purchase_number}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-medium mb-4">Purchase Items</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Alt. Quantity</TableHead>
                    <TableHead>Alt. Unit</TableHead>
                    <TableHead>Main Quantity</TableHead>
                    <TableHead>Main Unit</TableHead>
                    <TableHead>Actual Meter</TableHead>
                    <TableHead className="text-right">
                      <div>Alt. Unit Price</div>
                      <div className="text-xs text-muted-foreground">(Per alt unit)</div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div>Unit Price</div>
                      <div className="text-xs text-muted-foreground">(Per main unit)</div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div>GST</div>
                      <div className="text-xs text-muted-foreground">(%)</div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div>GST Amount</div>
                      <div className="text-xs text-muted-foreground">(Calculated)</div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div>Transport Share</div>
                      <div className="text-xs text-muted-foreground">(Per item)</div>
                    </TableHead>
                    <TableHead className="text-right">Line Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchase.purchase_items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.material.material_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.material.color && `Color: ${item.material.color}`}
                          {item.material.gsm && ` GSM: ${item.material.gsm}`}
                        </div>
                      </TableCell>
                      <TableCell>
                        {(item.quantity * (item.material.conversion_rate || 1)).toFixed(2)}
                      </TableCell>
                      <TableCell>{item.material.alternate_unit}</TableCell>
                      <TableCell>{item.quantity.toFixed(2)}</TableCell>
                      <TableCell>{item.material.unit}</TableCell>
                      <TableCell>{item.actual_meter || 0}</TableCell>
                      <TableCell className="text-right">
                        <div>
                          {formatCurrency(item.alt_unit_price || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">per {item.material.alternate_unit}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          {formatCurrency(item.unit_price || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">per {item.material.unit}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.gst_percentage}%
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.gst_amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.transport_share || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.line_total || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {purchase.notes && (
                <div className="rounded-md border p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
                  <p className="whitespace-pre-line">{purchase.notes}</p>
                </div>
              )}
            </div>
            
            <div>
              <div className="rounded-md border p-4 space-y-2">
                {purchase.invoice_number && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Invoice Number:</span>
                    <span>{purchase.invoice_number}</span>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(purchase.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Transport Charge:</span>
                  <div className="text-right">
                    <div>{formatCurrency(purchase.transport_charge)}</div>
                  </div>
                </div>
                <div className="flex justify-between py-2 text-lg">
                  <span className="font-bold">Total Amount:</span>
                  <span className="font-bold">{formatCurrency(purchase.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <DeletePurchaseDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeletePurchase}
        isLoading={deleteLoading}
        purchaseNumber={purchase.purchase_number}
        status={purchase.status}
      />
    </div>
  );
};

export default PurchaseDetail;
