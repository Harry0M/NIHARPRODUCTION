
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInventoryItems } from "@/hooks/use-catalog-products";
import { SearchSelectDialog } from "@/components/purchases/SearchSelectDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface InventoryItem {
  id: string;
  material_name: string;
  color?: string;
  gsm?: string;
  unit: string;
}

interface PurchaseItem {
  id: string;
  material_id: string;
  material_name: string;
  color?: string;
  gsm?: string;
  unit: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

const PurchaseNew = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplierId, setSupplierId] = useState("");
  const [transportCharge, setTransportCharge] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  
  const { data: inventoryItems = [], isLoading: loadingInventory } = useInventoryItems();

  const [suppliers, setSuppliers] = useState<any[]>([]);
  
  // Fetch suppliers
  React.useEffect(() => {
    const fetchSuppliers = async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("status", "active");
      
      if (!error && data) {
        setSuppliers(data);
      }
    };
    
    fetchSuppliers();
  }, []);

  const addMaterial = (material: InventoryItem) => {
    const newItem: PurchaseItem = {
      id: Math.random().toString(),
      material_id: material.id,
      material_name: material.material_name,
      color: material.color,
      gsm: material.gsm,
      unit: material.unit,
      quantity: 1,
      unit_price: 0,
      line_total: 0
    };
    
    setItems(prev => [...prev, newItem]);
  };

  const updateItem = (id: string, field: keyof PurchaseItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          updatedItem.line_total = updatedItem.quantity * updatedItem.unit_price;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
  const totalAmount = subtotal + transportCharge;

  const createPurchaseMutation = useMutation({
    mutationFn: async () => {
      if (!supplierId || items.length === 0) {
        throw new Error("Please select a supplier and add at least one item");
      }

      // Create purchase
      const { data: purchase, error: purchaseError } = await supabase
        .from("purchases")
        .insert({
          supplier_id: supplierId,
          purchase_date: purchaseDate,
          transport_charge: transportCharge,
          subtotal: subtotal,
          total_amount: totalAmount,
          notes: notes,
          status: 'pending'
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Create purchase items
      const purchaseItems = items.map(item => ({
        purchase_id: purchase.id,
        material_id: item.material_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total
      }));

      const { error: itemsError } = await supabase
        .from("purchase_items")
        .insert(purchaseItems);

      if (itemsError) throw itemsError;

      return purchase;
    },
    onSuccess: (purchase) => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast({
        title: "Success",
        description: "Purchase order created successfully",
      });
      navigate(`/inventory/purchase/${purchase.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create purchase order",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => navigate("/inventory/purchase")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">New Purchase Order</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Purchase Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Input
                id="purchase_date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <select
                id="supplier"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
              >
                <option value="">Select a supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="transport_charge">Transport Charge</Label>
              <Input
                id="transport_charge"
                type="number"
                step="0.01"
                value={transportCharge}
                onChange={(e) => setTransportCharge(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Purchase Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Transport Charge:</span>
              <span>₹{transportCharge.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total Amount:</span>
              <span>₹{totalAmount.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Purchase Items</CardTitle>
            <Button onClick={() => setMaterialDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Line Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.material_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.color && `${item.color} • `}
                        {item.gsm && `${item.gsm} GSM • `}
                        {item.unit}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    ₹{item.line_total.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => navigate("/inventory/purchase")}>
          Cancel
        </Button>
        <Button
          onClick={() => createPurchaseMutation.mutate()}
          disabled={createPurchaseMutation.isPending || !supplierId || items.length === 0}
        >
          {createPurchaseMutation.isPending ? "Creating..." : "Create Purchase Order"}
        </Button>
      </div>

      <SearchSelectDialog
        open={materialDialogOpen}
        onOpenChange={setMaterialDialogOpen}
        title="Select Material"
        items={inventoryItems}
        onSelect={addMaterial}
        displayField="material_name"
        secondaryField="unit"
        searchFields={["material_name", "color", "gsm"]}
      />
    </div>
  );
};

export default PurchaseNew;
