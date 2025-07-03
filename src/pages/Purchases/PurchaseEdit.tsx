import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash, Calculator, FilePlus, Search, AlertTriangle } from "lucide-react";
import { showToast } from "@/components/ui/enhanced-toast";
import { formatCurrency } from "@/utils/formatters";
import { NewInventoryDialog } from "@/components/inventory/NewInventoryDialog";
import { SearchSelectDialog } from "@/components/purchases/SearchSelectDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { completePurchaseWithActualMeter, reversePurchaseCompletion } from "@/utils/purchaseInventoryUtils";

interface Supplier {
  id: string;
  name: string;
  gst?: string | null;
  [key: string]: string | number | boolean | null | undefined;
}

interface InventoryItem {
  id: string;
  material_name: string;
  color: string;
  unit: string;
  alternate_unit: string;
  conversion_rate: number;
  purchase_price: number;
  quantity: number;
}

interface PurchaseItem {
  id: string;
  material_id: string;
  material: InventoryItem | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  alt_quantity?: number;
  alt_unit_price?: number;
  gst?: number;
  gst_percentage?: number;
  gst_amount?: number;
  transport_share?: number;
  true_unit_price?: number;
  true_line_total?: number;
  total?: number;
  actual_meter?: number;
  base_amount?: number;
}

interface PurchaseData {
  id: string;
  purchase_number: string;
  purchase_date: string;
  supplier_id: string;
  total_amount: number;
  status: string;
  transport_charge: number;
  subtotal: number;
  notes: string;
  invoice_number?: string;
  suppliers: {
    id: string;
    name: string;
  };
  purchase_items: PurchaseItem[];
}

const PurchaseEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [selectedSupplierName, setSelectedSupplierName] = useState<string>("");
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [transportCharge, setTransportCharge] = useState<number>(0);
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isNewInventoryDialogOpen, setIsNewInventoryDialogOpen] = useState<boolean>(false);
  const [currentPurchaseItemId, setCurrentPurchaseItemId] = useState<string>("");
  const [isSupplierSearchOpen, setIsSupplierSearchOpen] = useState<boolean>(false);
  const [isMaterialSearchOpen, setIsMaterialSearchOpen] = useState<boolean>(false);
  const [originalPurchase, setOriginalPurchase] = useState<PurchaseData | null>(null);
  const [wasCompleted, setWasCompleted] = useState<boolean>(false);

  // Fetch existing purchase data
  const { data: purchaseData, isLoading, error } = useQuery({
    queryKey: ['purchase-edit', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          suppliers (id, name),
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
            actual_meter,
            material:inventory (
              id,
              material_name,
              color,
              unit,
              alternate_unit,
              conversion_rate,
              purchase_price
            )
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as unknown as PurchaseData;
    },
    enabled: !!id,
  });

  // Load suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, name")
        .eq('status', 'active')
        .order("name");
      
      if (error) {
        console.error("Error fetching suppliers:", error);
        return;
      }
      
      setSuppliers(data || []);
    };
    
    fetchSuppliers();
  }, []);
  
  // Load inventory items
  useEffect(() => {
    const fetchInventoryItems = async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select(`
          id,
          material_name,
          color,
          gsm,
          quantity,
          unit,
          alternate_unit,
          conversion_rate,
          track_cost,
          purchase_price,
          selling_price,
          status,
          min_stock_level,
          reorder_level,
          category_id,
          location_id,
          supplier_id,
          created_at,
          updated_at,
          rate,
          reorder_quantity,
          roll_width,
          purchase_rate,
          suppliers (
            id,
            name,
            contact_person,
            email,
            phone,
            address
          )
        `)
        .is('is_deleted', false)
        .order('material_name');
      
      if (error) {
        console.error("Error fetching inventory items:", error);
        return;
      }
      
      setInventoryItems(data || []);
    };
    
    fetchInventoryItems();
  }, []);

  // Initialize form with existing purchase data
  useEffect(() => {
    if (purchaseData) {
      console.log("Loading purchase data for edit:", purchaseData);
      
      setOriginalPurchase(purchaseData);
      setWasCompleted(purchaseData.status === 'completed');
      setSelectedSupplierId(purchaseData.supplier_id);
      setSelectedSupplierName(purchaseData.suppliers?.name || "");
      setTransportCharge(purchaseData.transport_charge || 0);
      setPurchaseDate(purchaseData.purchase_date);
      setInvoiceNumber(purchaseData.invoice_number || "");
      setNotes(purchaseData.notes || "");
      
      // Process purchase items to ensure they have proper format
      const processedItems = purchaseData.purchase_items.map(item => ({
        ...item,
        id: item.id || crypto.randomUUID(),
        gst: item.gst_percentage || 0,
        gst_amount: item.gst_amount || 0,
        alt_quantity: item.alt_quantity || 0,
        alt_unit_price: item.alt_unit_price || 0,
        actual_meter: item.actual_meter || 0,
        base_amount: (item.alt_quantity || 0) * (item.alt_unit_price || 0),
        transport_share: 0, // Will be calculated
      }));
      
      setPurchaseItems(processedItems);
    }
  }, [purchaseData]);

  // Calculate transport share and totals when transport charge changes
  useEffect(() => {
    if (purchaseItems.length === 0) {
      setSubtotal(0);
      setTotalAmount(0);
      return;
    }

    // Calculate total of all alt quantities to determine transport share proportion
    const totalAltQuantity = purchaseItems.reduce(
      (sum, item) => sum + (item.alt_quantity || 0),
      0
    );

    // Calculate per alt unit transport rate
    const perAltUnitTransportRate = totalAltQuantity > 0 
      ? (transportCharge || 0) / totalAltQuantity 
      : 0;

    // Update items with transport share and final calculations
    const updatedItems = purchaseItems.map(item => {
      const altQuantity = item.alt_quantity || 0;
      const altUnitPrice = item.alt_unit_price || 0;
      const gstRate = item.gst || 0;
      const mainQuantity = item.quantity || 0;
      
      // Base amount = alt_quantity * alt_unit_price (this is the base amount without GST)
      const baseAmount = altQuantity * altUnitPrice;
      
      // Calculate GST amount using the correct formula: (alt quantity * alt unit price) * gst_rate / 100
      const gstAmount = (baseAmount * gstRate) / 100;
      
      // Transport Share = alt_quantity × per_alt_unit_transport_rate
      const transportShare = altQuantity * perAltUnitTransportRate;
      
      // Unit Price = [(alt unit price * alt quantity) + transport charge] / main unit
      const unitPrice = mainQuantity > 0 
        ? (baseAmount + transportShare) / mainQuantity 
        : 0;
      
      // Line Total = base_amount + gst_amount + transport_share (complete cost per item)
      const lineTotal = baseAmount + gstAmount + transportShare;
      
      return {
        ...item,
        base_amount: baseAmount,
        gst_amount: gstAmount,
        transport_share: transportShare,
        unit_price: unitPrice,
        line_total: lineTotal,
        total: lineTotal
      };
    });

    // Calculate subtotal (sum of all line totals)
    const newSubtotal = updatedItems.reduce(
      (sum, item) => sum + (item.line_total || 0),
      0
    );
    setSubtotal(newSubtotal);

    // Calculate total amount
    const newTotalAmount = newSubtotal;
    setTotalAmount(newTotalAmount);

    // Only update state if there are actual changes to avoid infinite loops
    const hasChanges = purchaseItems.some((item, index) => {
      const updatedItem = updatedItems[index];
      return item.transport_share !== updatedItem.transport_share ||
             item.unit_price !== updatedItem.unit_price ||
             item.total !== updatedItem.total;
    });

    if (hasChanges) {
      setPurchaseItems(updatedItems);
    }
  }, [purchaseItems, transportCharge]);
  
  const addPurchaseItem = () => {
    setPurchaseItems([
      ...purchaseItems, 
      { 
        id: crypto.randomUUID(),
        material_id: "", 
        material: null,
        quantity: 0, 
        unit_price: 0, 
        line_total: 0,
        alt_quantity: 0,
        alt_unit_price: 0,
        gst: 0,
        actual_meter: 0
      }
    ]);
  };
  
  const removePurchaseItem = (id: string) => {
    setPurchaseItems(purchaseItems.filter(item => item.id !== id));
  };
  
  const updatePurchaseItem = (
    id: string, 
    field: keyof PurchaseItem, 
    value: string | number
  ) => {
    setPurchaseItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // If changing material_id, find and set the material data
          if (field === "material_id") {
            const selectedMaterial = inventoryItems.find(
              inv => inv.id === value
            );
            
            updatedItem.material = selectedMaterial || null;
            
            // Set the default prices from inventory if available
            if (selectedMaterial?.purchase_price) {
              if (selectedMaterial.conversion_rate && selectedMaterial.conversion_rate > 0) {
                updatedItem.alt_unit_price = selectedMaterial.purchase_price * selectedMaterial.conversion_rate;
              } else {
                updatedItem.alt_unit_price = selectedMaterial.purchase_price;
              }
            }
          }
          
          // Calculate derived values based on the new formula
          const altQuantity = field === "alt_quantity" ? (value as number) : (updatedItem.alt_quantity || 0);
          const altUnitPrice = field === "alt_unit_price" ? (value as number) : (updatedItem.alt_unit_price || 0);
          const gstRate = field === "gst" ? (value as number) : (updatedItem.gst || 0);
          
          // Calculate main quantity from alt quantity
          const mainQuantity = updatedItem.material?.conversion_rate 
            ? altQuantity / updatedItem.material.conversion_rate 
            : altQuantity;
          
          // Base amount = Alt. Quantity × Alt. Unit Price
          const baseAmount = altQuantity * altUnitPrice;
          
          // Set auto-calculated values
          updatedItem.quantity = mainQuantity;
          updatedItem.base_amount = baseAmount;
          
          return updatedItem;
        }
        return item;
      });
    });
  };

  const handleRefreshTransactions = async () => {
    if (!originalPurchase || !wasCompleted) {
      showToast({
        title: "No Transaction Refresh Needed",
        description: "This purchase was not completed, so no inventory transactions need to be refreshed.",
        type: "info"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      showToast({
        title: "Refreshing Transactions",
        description: "Reversing old inventory transactions and applying new ones...",
        type: "info"
      });      // Step 1: Reverse the original inventory transactions
      console.log("Reversing original purchase transactions...");
      
      // Ensure all purchase items have actual_meter for utility functions
      const originalPurchaseWithActualMeter = {
        ...originalPurchase,
        purchase_items: originalPurchase.purchase_items.map(item => ({
          ...item,
          actual_meter: item.actual_meter || item.quantity, // fallback to quantity if actual_meter is missing
          material: item.material || { 
            id: item.material_id, 
            material_name: 'Unknown Material',
            unit: 'unit',
            conversion_rate: 1
          }
        }))
      };
      
      const reversalResult = await reversePurchaseCompletion(originalPurchaseWithActualMeter);
      
      if (!reversalResult.success) {
        throw new Error(reversalResult.error || "Failed to reverse original transactions");
      }      // Step 2: Apply new inventory transactions with updated data
      console.log("Applying new purchase transactions...");
      const updatedPurchaseData = {
        ...originalPurchase,
        transport_charge: transportCharge,
        purchase_items: purchaseItems.map(item => ({
          ...item,
          actual_meter: item.actual_meter || item.quantity, // Ensure actual_meter is set
          material: item.material || { 
            id: item.material_id, 
            material_name: 'Unknown Material',
            unit: 'unit',
            conversion_rate: 1
          }
        }))
      };

      const completionResult = await completePurchaseWithActualMeter(updatedPurchaseData);
      
      if (!completionResult.success) {
        throw new Error(completionResult.error || "Failed to apply new transactions");
      }

      showToast({
        title: "Transactions Refreshed",
        description: "Inventory transactions have been successfully refreshed with updated purchase data.",
        type: "success"
      });

    } catch (error) {
      console.error("Error refreshing transactions:", error);
      showToast({
        title: "Transaction Refresh Failed",
        description: error instanceof Error ? error.message : "Failed to refresh inventory transactions",
        type: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!id) return;
    
    if (!selectedSupplierId) {
      showToast({
        title: "Validation Error",
        description: "Please select a supplier",
        type: "error"
      });
      return;
    }
    
    if (purchaseItems.length === 0) {
      showToast({
        title: "Validation Error", 
        description: "Please add at least one purchase item",
        type: "error"
      });
      return;
    }
    
    // Validate all purchase items have required fields
    for (const item of purchaseItems) {
      if (!item.material_id) {
        showToast({
          title: "Validation Error",
          description: "Please select a material for all purchase items",
          type: "error"
        });
        return;
      }
      
      if (!item.quantity || item.quantity <= 0) {
        showToast({
          title: "Validation Error",
          description: "Please enter valid quantities for all purchase items",
          type: "error"
        });
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Starting purchase update process...");
      
      // Step 1: Update the main purchase record
      const { error: purchaseError } = await supabase
        .from('purchases')
        .update({
          supplier_id: selectedSupplierId,
          transport_charge: transportCharge,
          purchase_date: purchaseDate,
          invoice_number: invoiceNumber || null,
          notes: notes || null,
          subtotal: subtotal,
          total_amount: totalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (purchaseError) {
        throw purchaseError;
      }

      console.log("Purchase record updated successfully");

      // Step 2: Delete existing purchase items
      const { error: deleteError } = await supabase
        .from('purchase_items')
        .delete()
        .eq('purchase_id', id);

      if (deleteError) {
        throw deleteError;
      }

      console.log("Existing purchase items deleted");

      // Step 3: Insert new purchase items
      for (const item of purchaseItems) {
        const baseAmount = item.base_amount || 0;
        const transportShare = item.transport_share || 0;
        const gstAmount = item.gst_amount || 0;
        const lineTotal = baseAmount + gstAmount + transportShare;
        
        const unitPrice = item.quantity > 0 
          ? (baseAmount + transportShare) / item.quantity 
          : item.unit_price || 0;
        
        const purchaseItemData = {
          purchase_id: id,
          material_id: item.material_id,
          quantity: item.quantity || 0,
          alt_quantity: item.alt_quantity || 0,
          alt_unit_price: item.alt_unit_price || 0,
          unit_price: unitPrice,
          line_total: lineTotal,
          gst_percentage: item.gst || item.gst_percentage || 0,
          gst_amount: gstAmount,
          actual_meter: item.actual_meter || 0
        };

        console.log('Inserting updated purchase item:', purchaseItemData);

        const { error: itemError } = await supabase
          .from('purchase_items')
          .insert([purchaseItemData]);

        if (itemError) {
          console.error("Error inserting updated purchase item:", itemError);
          throw itemError;
        }
      }
      
      console.log("New purchase items inserted successfully");

      // Step 4: If the purchase was completed, refresh inventory transactions
      if (wasCompleted) {
        await handleRefreshTransactions();
      }
      
      showToast({
        title: "Purchase Updated",
        description: `Purchase has been updated successfully${wasCompleted ? ' and inventory transactions refreshed' : ''}`,
        type: "success"
      });
      
      // Invalidate all purchase-related queries to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['purchase', id] });
      await queryClient.invalidateQueries({ queryKey: ['purchase-edit', id] });
      await queryClient.invalidateQueries({ queryKey: ['purchases'] });
      
      // Navigate back to purchase detail with a refresh parameter to force reload
      navigate(`/purchases/${id}?refresh=edit-${Date.now()}`);
    } catch (error: unknown) {
      console.error("Error updating purchase:", error);
      showToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update purchase",
        type: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTotalCell = (item: PurchaseItem) => {
    const lineTotal = item.line_total || 0;
    const transportShare = item.transport_share || 0;
    const total = lineTotal;
    const baseAmount = item.base_amount || 0;
    const gstAmount = item.gst_amount || 0;

    return (
      <TableCell>
        {formatCurrency(total)}
        <div className="text-xs text-muted-foreground">
          Base: {formatCurrency(baseAmount)}
          {gstAmount > 0 && (
            <>
              <br />
              GST: {formatCurrency(gstAmount)}
            </>
          )}
          {transportShare > 0 && (
            <>
              <br />
              Transport: {formatCurrency(transportShare)}
            </>
          )}
        </div>
      </TableCell>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate("/purchases")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Purchases
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading purchase data...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !purchaseData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate("/purchases")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Purchases
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Purchase Not Found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                The requested purchase could not be found or an error occurred.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate(`/purchases/${id}`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Purchase
        </Button>
        
        <div className="flex items-center gap-2">
          {wasCompleted && (
            <Button
              variant="outline"
              onClick={handleRefreshTransactions}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <Calculator className="h-4 w-4" />
              Refresh Inventory Transactions
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Purchase #{purchaseData.purchase_number}</CardTitle>
          <CardDescription>
            Update purchase details and items. 
            {wasCompleted && (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                {" "}⚠️ This purchase was completed - inventory transactions will be refreshed automatically.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <div className="flex gap-2">
                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsSupplierSearchOpen(true)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <Label>Purchase Items</Label>
            </div>
            
            {purchaseItems.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Qty (Main)</TableHead>
                      <TableHead>Alt Qty</TableHead>
                      <TableHead>Alt Price</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Actual Meter</TableHead>
                      <TableHead>Transport</TableHead>
                      <TableHead>GST %</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex gap-2 items-center">
                            <Select
                              value={item.material_id}
                              onValueChange={(value) =>
                                updatePurchaseItem(item.id, "material_id", value)
                              }
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="Select material" />
                              </SelectTrigger>
                              <SelectContent>
                                {inventoryItems.map((inv) => (
                                  <SelectItem key={inv.id} value={inv.id}>
                                    {inv.material_name} - {inv.color}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setCurrentPurchaseItemId(item.id);
                                setIsMaterialSearchOpen(true);
                              }}
                            >
                              <Search className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setCurrentPurchaseItemId(item.id);
                                setIsNewInventoryDialogOpen(true);
                              }}
                            >
                              <FilePlus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity || ""}
                            onChange={(e) =>
                              updatePurchaseItem(
                                item.id,
                                "quantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-24"
                            placeholder="Auto"
                            disabled
                          />
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.material?.unit || "unit"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.alt_quantity || ""}
                            onChange={(e) =>
                              updatePurchaseItem(
                                item.id,
                                "alt_quantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-24"
                          />
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.material?.alternate_unit || "alt unit"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.alt_unit_price || ""}
                            onChange={(e) =>
                              updatePurchaseItem(
                                item.id,
                                "alt_unit_price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-28"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {formatCurrency(item.unit_price || 0)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Auto-calculated
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.actual_meter || ""}
                            onChange={(e) => {
                              const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                              updatePurchaseItem(item.id, "actual_meter", value);
                            }}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          {formatCurrency(item.transport_share || 0)}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={item.gst || ""}
                            onChange={(e) =>
                              updatePurchaseItem(
                                item.id,
                                "gst",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-20"
                          />
                        </TableCell>
                        {renderTotalCell(item)}
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removePurchaseItem(item.id)}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    <TableRow>
                      <TableCell colSpan={10} className="text-center p-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addPurchaseItem}
                          className="flex items-center gap-1 mx-auto"
                        >
                          <Plus className="h-4 w-4" />
                          Add Item
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-8 text-center space-y-4">
                <p className="text-muted-foreground">
                  No items added yet. Add your first purchase item.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addPurchaseItem}
                  className="flex items-center gap-1 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  Add First Item
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                placeholder="Enter supplier invoice number"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter any additional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-24"
              />
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="transport-charge">Transport Charge</Label>
                <Input
                  id="transport-charge"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={transportCharge || ""}
                  onChange={(e) => {
                    const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                    setTransportCharge(value);
                  }}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Subtotal:</span>
                  <span className="text-sm">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Transport:</span>
                  <span className="text-sm">{formatCurrency(transportCharge)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-lg font-semibold">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate(`/purchases/${id}`)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || purchaseItems.length === 0}
          >
            {isSubmitting ? "Updating..." : "Update Purchase"}
          </Button>
        </CardFooter>
      </Card>      {/* New Inventory Dialog */}
      <NewInventoryDialog
        open={isNewInventoryDialogOpen}
        onOpenChange={(open) => {
          setIsNewInventoryDialogOpen(open);
          if (!open) setCurrentPurchaseItemId("");
        }}
        onInventoryCreated={(newItem) => {
          if (currentPurchaseItemId) {
            updatePurchaseItem(currentPurchaseItemId, "material_id", newItem.id);
          }
          setIsNewInventoryDialogOpen(false);
          setCurrentPurchaseItemId("");
        }}
      />      {/* Supplier Search Dialog */}
      <SearchSelectDialog
        open={isSupplierSearchOpen}
        onOpenChange={setIsSupplierSearchOpen}
        title="Select Supplier"
        items={suppliers.map(supplier => ({
          id: supplier.id,
          name: supplier.name,
          description: supplier.gst ? `GST: ${supplier.gst}` : "No GST"
        }))}
        onSelect={(supplier) => {
          setSelectedSupplierId(supplier.id);
          setSelectedSupplierName(supplier.name);
          setIsSupplierSearchOpen(false);
        }}
        displayField="name"
        secondaryField="description"
        searchFields={["name"]}
      />      {/* Material Search Dialog */}
      <SearchSelectDialog
        open={isMaterialSearchOpen}
        onOpenChange={(open) => {
          setIsMaterialSearchOpen(open);
          if (!open) setCurrentPurchaseItemId("");
        }}
        title="Select Material"
        items={inventoryItems.map(item => ({
          id: item.id,
          name: `${item.material_name} - ${item.color}`,
          description: `Unit: ${item.unit}, Stock: ${item.quantity}`
        }))}
        onSelect={(material) => {
          if (currentPurchaseItemId) {
            updatePurchaseItem(currentPurchaseItemId, "material_id", material.id);
          }
          setIsMaterialSearchOpen(false);
          setCurrentPurchaseItemId("");
        }}
        displayField="name"
        secondaryField="description"
        searchFields={["name"]}
      />
    </div>
  );
};

export default PurchaseEdit;