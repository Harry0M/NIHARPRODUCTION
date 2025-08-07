import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash, Calculator, FilePlus, Search } from "lucide-react";
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
  gst?: number; // GST percentage
  gst_percentage?: number; // GST percentage (alternative field name)
  gst_amount?: number; // Calculated GST amount
  transport_share?: number;
  true_unit_price?: number;
  true_line_total?: number;
  total?: number;
  actual_meter?: number;
  base_amount?: number; // Add base_amount field
}

const PurchaseNew = () => {
  const navigate = useNavigate();
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
        base_amount: baseAmount, // Pure base amount without GST
        gst_amount: gstAmount,
        transport_share: transportShare,
        unit_price: unitPrice,
        line_total: lineTotal, // Complete cost (base + GST + transport)
        total: lineTotal // Keep total same as line_total for backward compatibility
      };
    });

    // Calculate subtotal (sum of all line totals - no need to add transport since it's already included)
    const newSubtotal = updatedItems.reduce(
      (sum, item) => sum + (item.line_total || 0),
      0
    );
    setSubtotal(newSubtotal);

    // Calculate total amount (subtotal includes everything now)
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
        gst: 0, // Initialize GST to 0
        actual_meter: 0 // Initialize actual_meter to 0
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
          
          // GST amount = base_amount × (gst_rate / 100)
          const gstAmount = (baseAmount * gstRate) / 100;
          
          // Note: Transport share and unit price will be calculated in useEffect
          // based on the total transport charge and proportional distribution
          
          // Update calculated fields - final values will be set by useEffect
          updatedItem.quantity = mainQuantity;
          updatedItem.base_amount = baseAmount;
          updatedItem.gst_amount = gstAmount;
          // These will be recalculated in useEffect:
          updatedItem.transport_share = 0;
          updatedItem.unit_price = mainQuantity > 0 ? baseAmount / mainQuantity : 0;
          updatedItem.line_total = baseAmount; // Will be updated in useEffect to include transport and GST
          
          return updatedItem;
        }
        return item;
      });
    });
  };
  
  const handleSubmit = async () => {
    // Validate form
    if (!selectedSupplierId) {
      showToast({
        title: "Supplier Required",
        description: "Please select a supplier",
        type: "error"
      });
      return;
    }
    
    if (purchaseItems.length === 0) {
      showToast({
        title: "Items Required",
        description: "Please add at least one item to the purchase",
        type: "error"
      });
      return;
    }
    
    // Validate each purchase item
    for (const item of purchaseItems) {
      if (!item.material_id) {
        showToast({
          title: "Item Required",
          description: "Please select a material for all items",
          type: "error"
        });
        return;
      }
      
      if (!item.quantity || item.quantity <= 0) {
        showToast({
          title: "Invalid Quantity",
          description: "Quantity must be greater than zero for all items",
          type: "error"
        });
        return;
      }
      
      if (!item.unit_price || item.unit_price <= 0) {
        showToast({
          title: "Invalid Price",
          description: "Unit price must be greater than zero for all items",
          type: "error"
        });
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      // 1. Create the purchase record
      // Use the raw method to bypass TypeScript issues with custom tables
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .insert([
          {
            supplier_id: selectedSupplierId,
            purchase_date: purchaseDate,
            invoice_number: invoiceNumber,
            transport_charge: transportCharge || 0,
            subtotal: subtotal,
            total_amount: totalAmount,
            status: "pending",
            notes: notes,
            purchase_number: "" // Will be auto-generated by trigger
          }
        ])
        .select('id')
        .single();
      
      if (purchaseError) {
        console.error("Error creating purchase:", purchaseError);
        throw purchaseError;
      }
      
      if (!purchaseData) {
        throw new Error("Failed to create purchase record - no data returned");
      }
      
      const purchaseId = purchaseData.id;
      console.log("Created purchase record with ID:", purchaseId);
      
      // 2. Create purchase items
      for (const item of purchaseItems) {
        try {
          // Calculate the values correctly for database storage
          const baseAmount = item.base_amount || 0; // Pure base amount (alt_quantity * alt_unit_price)
          const transportShare = item.transport_share || 0;
          const gstAmount = item.gst_amount || 0;
          const lineTotal = baseAmount + gstAmount + transportShare; // Line total = base + GST + transport
          
          // Calculate unit price using the same formula as display: [(alt unit price * alt quantity) + transport charge] / main unit
          const unitPrice = item.quantity > 0 
            ? (baseAmount + transportShare) / item.quantity 
            : item.unit_price || 0;
          
          const purchaseItemData = {
            purchase_id: purchaseId,
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

          console.log('Inserting purchase item:', purchaseItemData);

          const { error: itemError } = await supabase
            .from('purchase_items')
            .insert([purchaseItemData]);

          if (itemError) {
            console.error("Error inserting purchase item:", itemError);
            throw itemError;
          }
        } catch (error) {
          console.error("Error processing purchase item:", error);
          throw error;
        }
      }
      
      console.log("Successfully inserted purchase items");
      
      // We no longer update inventory here since purchase status is initially 'pending'
      // Inventory will be updated when the purchase is marked as 'completed'
      
      showToast({
        title: "Purchase Created",
        description: "Purchase has been created successfully",
        type: "success"
      });
      
      // Navigate to the purchase detail page
      navigate(`/purchases/${purchaseId}`);
    } catch (error: unknown) {
      console.error("Error creating purchase:", error);
      showToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create purchase",
        type: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderTotalCell = (item: PurchaseItem) => {
    const lineTotal = item.line_total || 0; // This now includes base_amount + gst_amount + transport_share
    const transportShare = item.transport_share || 0;
    const total = lineTotal; // No need to add transport share since it's already included in line_total
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
        <CardHeader>
          <CardTitle>New Purchase</CardTitle>
          <CardDescription>Create a new purchase entry for inventory items</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <div className="flex gap-2">
                <Button
                  id="supplier"
                  variant="outline"
                  className="w-full justify-between text-left font-normal"
                  onClick={() => setIsSupplierSearchOpen(true)}
                >
                  {selectedSupplierName || "Select supplier"}
                  <Search className="h-4 w-4 opacity-50" />
                </Button>
              </div>
              
              {selectedSupplierId && suppliers.find(s => s.id === selectedSupplierId)?.gst && (
                <p className="text-sm text-muted-foreground mt-1">
                  GST: {suppliers.find(s => s.id === selectedSupplierId)?.gst}
                </p>
              )}
              
              <SearchSelectDialog
                open={isSupplierSearchOpen}
                onOpenChange={setIsSupplierSearchOpen}
                title="Select Supplier"
                items={suppliers}
                onSelect={(supplier) => {
                  setSelectedSupplierId(supplier.id);
                  setSelectedSupplierName(supplier.name);
                }}
                displayField="name"
                searchFields={["name"]}
              />
            </div>
            
            <div>
              <Label htmlFor="purchase-date">Purchase Date</Label>
              <Input
                id="purchase-date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Purchase Items</h3>
            </div>
            
            {purchaseItems.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Material</TableHead>
                      <TableHead>Alt. Quantity & Unit</TableHead>
                      <TableHead>Main Quantity & Unit</TableHead>
                      <TableHead>Alt. Unit Price</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Actual Meter</TableHead>
                      <TableHead>
                        <div>Transport</div>
                        <div className="text-xs text-muted-foreground">(Alt Qty %)</div>
                      </TableHead>
                      <TableHead>
                        <div>GST</div>
                        <div className="text-xs text-muted-foreground">(%)</div>
                      </TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Button
                                variant="outline"
                                className="w-full justify-between text-left font-normal"
                                onClick={() => {
                                  setCurrentPurchaseItemId(item.id);
                                  setIsMaterialSearchOpen(true);
                                }}
                              >
                                {item.material 
                                  ? `${item.material.material_name}${item.material.color ? ` - ${item.material.color}` : ''}` 
                                  : "Select material"}
                                <Search className="h-4 w-4 opacity-50" />
                              </Button>
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              type="button"
                              onClick={() => {
                                setCurrentPurchaseItemId(item.id);
                                setIsNewInventoryDialogOpen(true);
                              }}
                              title="Create new inventory item"
                            >
                              <FilePlus className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
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
                              className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">
                              {item.material?.alternate_unit || ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {item.material && item.alt_quantity && item.material.conversion_rate
                                ? (item.alt_quantity / (item.material.conversion_rate || 1)).toFixed(2)
                                : item.quantity?.toFixed(2) || "0.00"}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {item.material?.unit || ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
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
                              className="w-24"
                            />
                            <span className="text-sm text-muted-foreground">
                              /{item.material?.alternate_unit || "unit"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{formatCurrency(item.unit_price || 0)}</span>
                            <span className="text-sm text-muted-foreground">
                              /{item.material?.unit || "unit"}
                            </span>
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
                    
                    {/* Add Item button as a table row */}
                    <TableRow>
                      <TableCell colSpan={8} className="text-center p-2">
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
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={transportCharge === 0 ? "0" : transportCharge || ""}
                    onChange={(e) => {
                      const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                      setTransportCharge(value);
                    }}
                    className="w-full"
                  />
                </div>
                {/* Display transport rate calculation */}
                {transportCharge > 0 && purchaseItems.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1 p-2 bg-blue-50 rounded">
                    <div>Transport Rate Calculation:</div>
                    <div>
                      Total Alt Quantity: {purchaseItems.reduce((sum, item) => sum + (item.alt_quantity || 0), 0).toFixed(2)}
                    </div>
                    <div>
                      Per Alt Unit Rate: ₹{purchaseItems.reduce((sum, item) => sum + (item.alt_quantity || 0), 0) > 0 
                        ? (transportCharge / purchaseItems.reduce((sum, item) => sum + (item.alt_quantity || 0), 0)).toFixed(2) 
                        : '0.00'}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Subtotal (Base Cost):</span>
                  <span>{formatCurrency(purchaseItems.reduce((sum, item) => sum + (item.base_amount || 0), 0))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total GST:</span>
                  <span>{formatCurrency(purchaseItems.reduce((sum, item) => sum + (item.gst_amount || 0), 0))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Transport:</span>
                  <span>{formatCurrency(purchaseItems.reduce((sum, item) => sum + (item.transport_share || 0), 0))}</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between items-center font-bold">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(totalAmount || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate("/purchases")}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4" />
                Create Purchase
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Dialog for creating new inventory items */}
      <NewInventoryDialog
        open={isNewInventoryDialogOpen}
        onOpenChange={setIsNewInventoryDialogOpen}
        onInventoryCreated={(newItem) => {
          console.log("New inventory item created:", newItem);
          
          // Add the new item to the inventory items list
          setInventoryItems(prev => [...prev, newItem]);
          
          // If we have a current purchase item selected, update it with the new material
          if (currentPurchaseItemId) {
            // First update the material_id
            updatePurchaseItem(currentPurchaseItemId, "material_id", newItem.id);
            
            // Then manually update the purchase items to include the full material object
            setPurchaseItems(prevItems => 
              prevItems.map(item => {
                if (item.id === currentPurchaseItemId) {
                  return {
                    ...item,
                    material: newItem,
                    material_id: newItem.id,
                    unit_price: newItem.purchase_price || 0,
                    line_total: item.quantity * (newItem.purchase_price || 0)
                  };
                }
                return item;
              })
            );
            
            setCurrentPurchaseItemId("");
          }
        }}
      />
      
      {/* Material search dialog */}
      <SearchSelectDialog
        open={isMaterialSearchOpen}
        onOpenChange={setIsMaterialSearchOpen}
        title="Select Material"
        items={inventoryItems.map(item => ({
          id: item.id,
          name: `${item.material_name}${item.color ? ` - ${item.color}` : ''}`,
          ...item
        }))}
        onSelect={(material) => {
          if (currentPurchaseItemId) {
            const selectedMaterial = inventoryItems.find(inv => inv.id === material.id);
            if (selectedMaterial) {
              // Update the purchase item with the selected material
              setPurchaseItems(prevItems => 
                prevItems.map(item => {
                  if (item.id === currentPurchaseItemId) {
                    return {
                      ...item,
                      material: selectedMaterial,
                      material_id: selectedMaterial.id,
                      unit_price: selectedMaterial.purchase_price || 0,
                      line_total: item.quantity * (selectedMaterial.purchase_price || 0)
                    };
                  }
                  return item;
                })
              );
            }
          }
        }}
        displayField="name"
        searchFields={["material_name", "color"]}
      />
    </div>
  );
};

export default PurchaseNew;