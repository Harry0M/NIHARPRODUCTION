import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, AlertTriangle, FileCheck, FileClock, FileX } from "lucide-react";
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

interface InventoryItem {
  id: string;
  material_name: string;
  color: string;
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
}

interface Purchase {
  id: string;
  purchase_number: string;
  purchase_date: string;
  supplier_id: string;
  transport_charge: number;
  subtotal: number;
  total_amount: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: string;
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
  purchase_items: {
    id: string;
    material_id: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    gst_percentage: number;
    gst_amount: number;
    material: InventoryItem;
  }[];
}

const PurchaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState<Purchase | null>(null);

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
            material:inventory (
              id,
              material_name,
              color,
              unit,
              alternate_unit,
              conversion_rate
            )
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
  
  const [purchaseItemsWithTransport, setPurchaseItemsWithTransport] = useState<any[]>([]);
  const [perKgTransportRate, setPerKgTransportRate] = useState<number>(0);

  useEffect(() => {
    if (data) {
      setPurchase(data);
      
      // Calculate transport share and true prices
      const items = data.purchase_items || [];
      const totalWeight = items.reduce(
        (sum, item) => sum + (item.quantity * (item.material?.conversion_rate || 1) || 0),
        0
      );
      
      if (totalWeight > 0 && data.transport_charge > 0) {
        const perKgRate = data.transport_charge / totalWeight;
        setPerKgTransportRate(perKgRate);
        
        const itemsWithTransport = items.map(item => {
          const weight = item.quantity * (item.material?.conversion_rate || 1);
          const transportShare = weight * perKgRate;
          const trueUnitPrice = item.unit_price + (transportShare / (item.quantity || 1));
          const trueLineTotal = trueUnitPrice * item.quantity;
          
          return {
            ...item,
            transport_share: transportShare,
            true_unit_price: trueUnitPrice,
            true_line_total: trueLineTotal
          };
        });
        
        setPurchaseItemsWithTransport(itemsWithTransport);
      } else {
        setPurchaseItemsWithTransport(items);
      }
    }
  }, [data]);
  
  // Helper function to sleep for a given number of milliseconds
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Helper function to get current inventory quantity
  const getCurrentInventoryQuantity = async (materialId) => {
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
      
      // Check ALL inventory quantities BEFORE anything happens
      console.log("BEFORE ANY CHANGES - Current inventory quantities:");
      for (const item of purchase.purchase_items) {
        const inventoryBefore = await getCurrentInventoryQuantity(item.material_id);
        if (inventoryBefore) {
          console.log(`${inventoryBefore.material_name}: ${inventoryBefore.quantity} (Material ID: ${item.material_id})`);
        }
      }
      
      // First update the purchase status
      const { error } = await supabase
        .from('purchases')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      // Wait 1 second to see if any triggers/processes update inventory immediately after status change
      console.log("Waiting 1 second to check for automatic inventory updates...");
      await sleep(1000);
      
      // Check inventory quantities AFTER status update but BEFORE our manual update
      console.log("AFTER STATUS UPDATE (before our manual update) - Current inventory quantities:");
      for (const item of purchase.purchase_items) {
        const inventoryAfterStatus = await getCurrentInventoryQuantity(item.material_id);
        if (inventoryAfterStatus) {
          console.log(`${inventoryAfterStatus.material_name}: ${inventoryAfterStatus.quantity} (Material ID: ${item.material_id})`);
        }
      }
      
      // If status is being changed to completed, only update prices with transport adjustments
      // IMPORTANT: The inventory quantities will be updated ONLY by the database trigger
      if (newStatus === "completed") {
        console.log("INFO: Purchase being marked as completed", id);
        console.log("INFO: Inventory quantities will be updated ONLY by database trigger");
        
        // Only update purchase prices with transport charge adjustments
        if (purchase.transport_charge > 0) {
          console.log("INFO: Updating inventory purchase prices with transport charges included");
          console.log("Purchase items:", purchase.purchase_items);
          
          // First get inventory data for conversion rates
          const inventoryData = {};
          for (const item of purchase.purchase_items) {
            const { data: invData } = await supabase
              .from('inventory')
              .select('id, conversion_rate, purchase_price')
              .eq('id', item.material_id)
              .single();
            
            if (invData) {
              inventoryData[item.material_id] = invData;
              console.log(`Got inventory data for ${item.material_id}: Conversion rate: ${invData.conversion_rate}, Current price: ${invData.purchase_price}`);
            }
          }
          
          // Calculate total weight directly using purchase items and inventory data
          let totalWeight = 0;
          for (const item of purchase.purchase_items) {
            const conversionRate = inventoryData[item.material_id]?.conversion_rate || 1;
            const itemWeight = item.quantity * conversionRate;
            totalWeight += itemWeight;
            console.log(`Item ${item.material_id}: Quantity: ${item.quantity}, Conversion: ${conversionRate}, Weight: ${itemWeight}kg`);
          }
          
          console.log(`Total weight: ${totalWeight}kg, Transport charge: ${purchase.transport_charge}`);
          
          if (totalWeight > 0) {
            // Calculate per kg transport rate
            const perKgTransport = purchase.transport_charge / totalWeight;
            console.log(`Per kg transport rate: ${perKgTransport}`);
            
            // Update each inventory item with transport-adjusted price
            for (const item of purchase.purchase_items) {
              const invData = inventoryData[item.material_id];
              if (!invData) continue;
              
              const conversionRate = invData.conversion_rate || 1;
              const itemWeight = item.quantity * conversionRate;
              const transportShare = itemWeight * perKgTransport;
              const trueUnitPrice = item.unit_price + (transportShare / item.quantity);
              
              console.log(`Calculating for ${item.material_id}:`);
              console.log(`- Base unit price: ${item.unit_price}`);
              console.log(`- Item weight: ${itemWeight}kg`);
              console.log(`- Transport share: ${transportShare}`);
              console.log(`- True unit price: ${trueUnitPrice}`);
              
              // Update inventory purchase rate (the correct field used by the system)
              const { error: updateError } = await supabase
                .from('inventory')
                .update({ 
                  purchase_rate: trueUnitPrice,
                  updated_at: new Date().toISOString()
                })
                .eq('id', item.material_id);
              
              if (updateError) {
                console.error(`Error updating inventory price for ${item.material_id}:`, updateError);
              } else {
                console.log(`Successfully updated price for ${item.material_id} to ${trueUnitPrice}`);
              }
            }
          }
        } else {
          console.log("INFO: No transport charge, skipping price adjustment");
        }
      }
      
      // If changing from completed to another status (like pending or cancelled)
      // We should handle reverting the inventory changes here
      else if (purchase.status === "completed") {
        // For now, we'll just show a warning that inventory won't be automatically adjusted
        showToast({
          title: "Inventory Note",
          description: "Inventory quantities won't be automatically adjusted when changing from 'completed' status. Manual adjustment may be needed.",
          type: "warning"
        });
      }
      
      // Final check of inventory quantities and transaction logs
      console.log("\n======= FINAL STATE CHECK AFTER STATUS CHANGE =======");
      
      // Check final inventory quantities
      console.log("FINAL INVENTORY STATE:");
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
    } catch (error: any) {
      console.error("Error updating purchase status:", error);
      showToast({
        title: "Error",
        description: error.message || "Failed to update purchase status",
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
                    <TableHead>
                      <div>Alt. Quantity</div>
                      <div className="text-xs text-muted-foreground">(Alt. Unit)</div>
                    </TableHead>
                    <TableHead>
                      <div>Main Quantity</div>
                      <div className="text-xs text-muted-foreground">(Main Unit)</div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div>Alt. Unit Price</div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div>Base Amount</div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div>GST</div>
                      <div className="text-xs text-muted-foreground">(%)</div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div>GST Amount</div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div>Transport</div>
                      <div className="text-xs text-muted-foreground">(Share)</div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div>True Unit Price</div>
                      <div className="text-xs text-muted-foreground">(With transport)</div>
                    </TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseItemsWithTransport.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.material.material_name}
                        {item.material.color && (
                          <span className="text-muted-foreground"> - {item.material.color}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{(item.quantity * (item.material.conversion_rate || 1)).toFixed(2)}</span>
                          <span className="text-sm text-muted-foreground">{item.material.alternate_unit}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{item.quantity.toFixed(2)}</span>
                          <span className="text-sm text-muted-foreground">{item.material.unit}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency((item.true_unit_price || item.unit_price) * (item.material.conversion_rate || 1))}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.line_total)}
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
                        {formatCurrency(item.true_unit_price || item.unit_price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.true_line_total || item.line_total)}
                        <div className="text-xs text-muted-foreground">
                          Base: {formatCurrency(item.line_total)}
                          {item.gst_amount > 0 && (
                            <>
                              <br />
                              GST: {formatCurrency(item.gst_amount)}
                            </>
                          )}
                          {item.transport_share > 0 && (
                            <>
                              <br />
                              Transport: {formatCurrency(item.transport_share)}
                            </>
                          )}
                        </div>
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
                <div className="flex justify-between py-2">
                  <span className="font-medium">Transport Charge:</span>
                  <span className="font-medium">
                    {formatCurrency(purchase.transport_charge)}
                    {perKgTransportRate > 0 && (
                      <div className="text-xs text-muted-foreground">
                        ({formatCurrency(perKgTransportRate)}/kg)
                      </div>
                    )}
                  </span>
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
    </div>
  );
};

export default PurchaseDetail;
