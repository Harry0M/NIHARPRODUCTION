import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash, Calculator } from "lucide-react";
import { showToast } from "@/components/ui/enhanced-toast";
import { formatCurrency } from "@/utils/formatters";
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
}

interface InventoryItem {
  id: string;
  material_name: string;
  color: string;
  main_unit: string;
  alternative_unit: string;
  main_to_alternative_ratio: number;
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
}

const PurchaseNew = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [transportCharge, setTransportCharge] = useState<number>(0);
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  
  // Load suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, name")
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
        .select("id, material_name, color, main_unit, alternative_unit, main_to_alternative_ratio, purchase_price, quantity")
        .order("material_name");
      
      if (error) {
        console.error("Error fetching inventory items:", error);
        return;
      }
      
      setInventoryItems(data || []);
    };
    
    fetchInventoryItems();
  }, []);
  
  // Calculate subtotal and total whenever purchase items or transport charge changes
  useEffect(() => {
    const calculatedSubtotal = purchaseItems.reduce(
      (sum, item) => sum + (item.line_total || 0), 
      0
    );
    
    setSubtotal(calculatedSubtotal);
    setTotalAmount(calculatedSubtotal + (transportCharge || 0));
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
        line_total: 0 
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
              updatedItem.unit_price = selectedMaterial.purchase_price;
            }
          }
          
          // Recalculate line total when quantity or unit price changes
          if (field === "quantity" || field === "unit_price" || field === "material_id") {
            updatedItem.line_total = updatedItem.quantity * updatedItem.unit_price;
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
      const { data: purchaseData, error: purchaseError } = await supabase
        .from("purchases")
        .insert({
          supplier_id: selectedSupplierId,
          purchase_date: purchaseDate,
          transport_charge: transportCharge || 0,
          subtotal: subtotal,
          total_amount: totalAmount,
          status: "pending",
          notes: notes,
          purchase_number: "" // Will be auto-generated by trigger
        })
        .select("id")
        .single();
      
      if (purchaseError) {
        throw purchaseError;
      }
      
      const purchaseId = purchaseData.id;
      
      // 2. Create purchase items
      const purchaseItemsToInsert = purchaseItems.map(item => ({
        purchase_id: purchaseId,
        material_id: item.material_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total
      }));
      
      const { error: itemsError } = await supabase
        .from("purchase_items")
        .insert(purchaseItemsToInsert);
      
      if (itemsError) {
        throw itemsError;
      }
      
      // 3. Create inventory transaction logs and update stock quantities
      for (const item of purchaseItems) {
        // Get current quantity
        const { data: inventoryData, error: inventoryError } = await supabase
          .from("inventory")
          .select("quantity")
          .eq("id", item.material_id)
          .single();
        
        if (inventoryError) {
          console.error("Error fetching inventory item:", inventoryError);
          continue;
        }
        
        const currentQuantity = inventoryData.quantity || 0;
        const newQuantity = currentQuantity + item.quantity;
        
        // Update inventory quantity
        const { error: updateError } = await supabase
          .from("inventory")
          .update({ quantity: newQuantity })
          .eq("id", item.material_id);
        
        if (updateError) {
          console.error("Error updating inventory quantity:", updateError);
          continue;
        }
        
        // Create transaction log entry
        const { error: logError } = await supabase
          .from("inventory_transaction_log")
          .insert({
            material_id: item.material_id,
            transaction_type: "purchase",
            quantity: item.quantity,
            reference_id: purchaseId,
            reference_type: "purchase",
            previous_quantity: currentQuantity,
            new_quantity: newQuantity,
            notes: `Purchase ${item.material?.material_name || ""}`,
          });
        
        if (logError) {
          console.error("Error creating transaction log:", logError);
        }
      }
      
      showToast({
        title: "Purchase Created",
        description: "Purchase has been created successfully",
        type: "success"
      });
      
      navigate(`/inventory/purchases/${purchaseId}`);
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
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate("/inventory/purchases")}
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
              <Select
                value={selectedSupplierId}
                onValueChange={setSelectedSupplierId}
              >
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Button
                variant="outline"
                size="sm"
                onClick={addPurchaseItem}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>
            
            {purchaseItems.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Material</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Main Unit</TableHead>
                      <TableHead>Alt. Quantity</TableHead>
                      <TableHead>Alt. Unit</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Select
                            value={item.material_id}
                            onValueChange={(value) =>
                              updatePurchaseItem(item.id, "material_id", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select material" />
                            </SelectTrigger>
                            <SelectContent>
                              {inventoryItems.map((inv) => (
                                <SelectItem key={inv.id} value={inv.id}>
                                  {inv.material_name} {inv.color ? `- ${inv.color}` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                          />
                        </TableCell>
                        <TableCell>
                          {item.material?.main_unit || ""}
                        </TableCell>
                        <TableCell>
                          {item.material && item.quantity
                            ? (item.quantity / (item.material.main_to_alternative_ratio || 1)).toFixed(2)
                            : "0.00"}
                        </TableCell>
                        <TableCell>
                          {item.material?.alternative_unit || ""}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price || ""}
                            onChange={(e) =>
                              updatePurchaseItem(
                                item.id,
                                "unit_price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          {formatCurrency(item.line_total || 0)}
                        </TableCell>
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
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-8 text-center">
                <p className="text-muted-foreground">
                  No items added yet. Click "Add Item" to add purchase items.
                </p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="transport-charge">Transport Charge</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="transport-charge"
                    type="number"
                    min="0"
                    step="0.01"
                    value={transportCharge || ""}
                    onChange={(e) => setTransportCharge(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              
              <div className="rounded-md border p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Subtotal:</span>
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
            onClick={() => navigate("/inventory/purchases")}
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
    </div>
  );
};

export default PurchaseNew;
