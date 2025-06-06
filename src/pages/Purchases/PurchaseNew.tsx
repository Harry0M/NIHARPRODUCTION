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
  [key: string]: any;
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
  gst_amount?: number; // Calculated GST amount
  // For transport charge calculations
  transport_share?: number;
  true_unit_price?: number;
  true_line_total?: number;
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
  
  // Calculate subtotal, total, and transport charge allocation
  useEffect(() => {
    // First calculate base amounts and GST for each item
    const itemsWithGST = purchaseItems.map(item => {
      const baseAmount = item.line_total || 0;
      const gstAmount = (baseAmount * (item.gst || 0)) / 100;
      const totalWithGST = baseAmount + gstAmount;
      
      return {
        ...item,
        gst_amount: gstAmount,
        total_with_gst: totalWithGST,
        transport_share: 0, // Reset transport share
        true_unit_price: item.unit_price, // Reset true unit price
        true_line_total: totalWithGST // Reset true line total
      };
    });

    // Calculate subtotal (sum of all items with GST)
    const newSubtotal = itemsWithGST.reduce(
      (sum, item) => sum + item.total_with_gst,
      0
    );
    setSubtotal(newSubtotal);

    // Only calculate transport charges if there is a transport charge
    if (transportCharge > 0) {
      // Calculate transport charge allocation based on weight (kg)
      const totalWeight = itemsWithGST.reduce(
        (sum, item) => sum + (item.alt_quantity || 0),
        0
      );
      
      if (totalWeight > 0) {
        const perKgTransportCharge = transportCharge / totalWeight;
        
        // Update each item with its transport share and true cost
        setPurchaseItems(itemsWithGST.map(item => {
          const weight = item.alt_quantity || 0;
          const transportShare = weight * perKgTransportCharge;
          const totalWithGSTAndTransport = item.total_with_gst + transportShare;
          const trueUnitPrice = totalWithGSTAndTransport / (item.quantity || 1);
          
          return {
            ...item,
            transport_share: transportShare,
            true_unit_price: trueUnitPrice,
            true_line_total: totalWithGSTAndTransport
          };
        }));
      } else {
        setPurchaseItems(itemsWithGST);
      }
    } else {
      // If no transport charge, just set the items without transport calculations
      setPurchaseItems(itemsWithGST);
    }

    // Set total amount (subtotal + transport charge)
    setTotalAmount(newSubtotal + (transportCharge || 0));
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
        gst: 0 // Initialize GST to 0
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
    setPurchaseItems(
      purchaseItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // If changing material_id, find and set the material data
          if (field === "material_id") {
            const selectedMaterial = inventoryItems.find(
              inv => inv.id === value
            );
            
            updatedItem.material = selectedMaterial || null;
            
            // Set the default unit price from inventory if available
            if (selectedMaterial?.purchase_price) {
              // Set alt_unit_price and convert to main unit price
              if (selectedMaterial.conversion_rate && selectedMaterial.conversion_rate > 0) {
                updatedItem.alt_unit_price = selectedMaterial.purchase_price * selectedMaterial.conversion_rate;
                updatedItem.unit_price = selectedMaterial.purchase_price;
              } else {
                updatedItem.alt_unit_price = selectedMaterial.purchase_price;
                updatedItem.unit_price = selectedMaterial.purchase_price;
              }
            }
          }
          
          // When alt_quantity changes, update main quantity
          if (field === "alt_quantity") {
            if (updatedItem.material?.conversion_rate && updatedItem.material.conversion_rate > 0) {
              updatedItem.quantity = (value as number) / updatedItem.material.conversion_rate;
            } else {
              updatedItem.quantity = value as number;
            }
            
            // Recalculate line total
            updatedItem.line_total = updatedItem.quantity * updatedItem.unit_price;
          }
          
          // When alt_unit_price changes, update main unit price
          if (field === "alt_unit_price") {
            if (updatedItem.material?.conversion_rate && updatedItem.material.conversion_rate > 0) {
              updatedItem.unit_price = (value as number) / updatedItem.material.conversion_rate;
            } else {
              updatedItem.unit_price = value as number;
            }
            
            // Recalculate line total
            updatedItem.line_total = updatedItem.quantity * updatedItem.unit_price;
          }
          
          // Keep original calculations for direct changes to main quantity or unit price
          if (field === "quantity" || field === "unit_price") {
            updatedItem.line_total = updatedItem.quantity * updatedItem.unit_price;
            
            // Update alt values when main values change
            if (field === "quantity" && updatedItem.material?.conversion_rate) {
              updatedItem.alt_quantity = updatedItem.quantity * updatedItem.material.conversion_rate;
            }
            
            if (field === "unit_price" && updatedItem.material?.conversion_rate) {
              updatedItem.alt_unit_price = updatedItem.unit_price * updatedItem.material.conversion_rate;
            }
          }
          
          return updatedItem;
        }
        return item;
      })
    );
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
        const baseAmount = item.quantity * item.unit_price;
        const gstAmount = (baseAmount * (item.gst || 0)) / 100;
        
        const { error: itemError } = await supabase
          .from('purchase_items')
          .insert([
            {
              purchase_id: purchaseId,
              material_id: item.material_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              line_total: item.line_total,
              gst_percentage: item.gst || 0,
              gst_amount: item.gst_amount || gstAmount
            }
          ]);
        
        if (itemError) {
          console.error("Error inserting purchase item:", itemError);
          throw itemError;
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
      
      // Use window.location.href instead of navigate to ensure full page refresh
      window.location.href = `/purchases/${purchaseId}`;
    } catch (error: any) {
      console.error("Error creating purchase:", error);
      showToast({
        title: "Error",
        description: error.message || "Failed to create purchase",
        type: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderTotalCell = (item: PurchaseItem) => {
    const baseAmount = item.line_total || 0;
    const gstAmount = item.gst_amount || 0;
    const transportShare = transportCharge > 0 ? (item.transport_share || 0) : 0;
    const total = baseAmount + gstAmount + transportShare;

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
  
  const renderTruePriceCell = (item: PurchaseItem) => {
    const baseAmount = item.line_total || 0;
    const gstAmount = item.gst_amount || 0;
    const transportShare = transportCharge > 0 ? (item.transport_share || 0) : 0;
    const total = baseAmount + gstAmount + transportShare;
    const trueUnitPrice = item.quantity ? total / item.quantity : 0;

    return (
      <TableCell>
        {formatCurrency(trueUnitPrice)}
        <div className="text-xs text-muted-foreground">
          per {item.material?.unit || 'unit'}
          <br />
          Total: {formatCurrency(total)}
        </div>
      </TableCell>
    );
  };
  
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
                      <TableHead>Alt. Quantity</TableHead>
                      <TableHead>Alt. Unit</TableHead>
                      <TableHead>Main Quantity</TableHead>
                      <TableHead>Main Unit</TableHead>
                      <TableHead>
                        <div>Alt. Unit Price</div>
                        <div className="text-xs text-muted-foreground">(Per alt unit)</div>
                      </TableHead>
                      <TableHead>
                        <div>Unit Price</div>
                        <div className="text-xs text-muted-foreground">(Per main unit)</div>
                      </TableHead>
                      <TableHead>
                        <div>Transport</div>
                        <div className="text-xs text-muted-foreground">(Share)</div>
                      </TableHead>
                      <TableHead>
                        <div>True Price</div>
                        <div className="text-xs text-muted-foreground">(With transport)</div>
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
                        </TableCell>
                        <TableCell>
                          {item.material?.alternate_unit || ""}
                        </TableCell>
                        <TableCell>
                          {item.material && item.alt_quantity && item.material.conversion_rate
                            ? (item.alt_quantity / (item.material.conversion_rate || 1)).toFixed(2)
                            : item.quantity?.toFixed(2) || "0.00"}
                        </TableCell>
                        <TableCell>
                          {item.material?.unit || ""}
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
                            className="w-24"
                          />
                          <div className="text-xs text-muted-foreground">
                            per {item.material?.alternate_unit || 'alt unit'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.material?.conversion_rate 
                            ? formatCurrency((item.alt_unit_price || 0) / item.material.conversion_rate)
                            : formatCurrency(item.unit_price || 0)}
                          <div className="text-xs text-muted-foreground">
                            per {item.material?.unit || 'unit'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(item.transport_share || 0)}
                        </TableCell>
                        {renderTruePriceCell(item)}
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
                      <TableCell colSpan={9} className="text-center p-2">
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
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Subtotal (Before GST):</span>
                  <span>{formatCurrency(purchaseItems.reduce((sum, item) => sum + (item.line_total || 0), 0))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total GST:</span>
                  <span>{formatCurrency(purchaseItems.reduce((sum, item) => {
                    const baseAmount = item.line_total || 0;
                    return sum + (baseAmount * (item.gst || 0)) / 100;
                  }, 0))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Subtotal (After GST):</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Transport Charge:</span>
                  <span>{formatCurrency(transportCharge || 0)}</span>
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
