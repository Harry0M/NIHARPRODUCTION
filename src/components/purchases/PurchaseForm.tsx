
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Calculator } from "lucide-react";
import { useSuppliers } from "@/hooks/purchases/useSuppliers";
import { useInventoryStocks } from "@/hooks/inventory/useInventoryStocks";
import { PurchaseFormData, PurchaseItemFormData } from "@/types/purchase";
import { showToast } from "@/components/ui/enhanced-toast";

interface PurchaseFormProps {
  onSubmit: (data: PurchaseFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const PurchaseForm = ({ onSubmit, onCancel, isLoading = false }: PurchaseFormProps) => {
  const { suppliers } = useSuppliers();
  const { stocks } = useInventoryStocks();
  
  const [formData, setFormData] = useState<PurchaseFormData>({
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    transport_charge: 0,
    notes: '',
    items: [{ material_id: '', quantity: 0, unit_price: 0, line_total: 0 }]
  });

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { material_id: '', quantity: 0, unit_price: 0, line_total: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: keyof PurchaseItemFormData, value: string | number) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      
      // Calculate line total when quantity or unit_price changes
      if (field === 'quantity' || field === 'unit_price') {
        newItems[index].line_total = newItems[index].quantity * newItems[index].unit_price;
      }
      
      return { ...prev, items: newItems };
    });
  };

  const getSelectedMaterial = (materialId: string) => {
    return stocks.find(stock => stock.id === materialId);
  };

  const getAlternateQuantity = (materialId: string, mainQuantity: number) => {
    const material = getSelectedMaterial(materialId);
    if (material?.alternate_unit && material?.conversion_rate) {
      return (mainQuantity * material.conversion_rate).toFixed(2);
    }
    return null;
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.line_total, 0);
    const total = subtotal + formData.transport_charge;
    return { subtotal, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier_id) {
      showToast({
        title: "Validation Error",
        description: "Please select a supplier",
        type: "error"
      });
      return;
    }

    if (formData.items.length === 0 || formData.items.some(item => !item.material_id || item.quantity <= 0)) {
      showToast({
        title: "Validation Error",
        description: "Please add at least one valid item",
        type: "error"
      });
      return;
    }

    const { subtotal, total } = calculateTotals();
    
    await onSubmit({
      ...formData,
      subtotal,
      total_amount: total
    });
  };

  const { subtotal, total } = calculateTotals();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Purchase Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplier_id">Supplier *</Label>
              <Select value={formData.supplier_id} onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Purchase notes..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Purchase Items</CardTitle>
          <Button type="button" onClick={addItem} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.items.map((item, index) => {
              const material = getSelectedMaterial(item.material_id);
              const alternateQty = getAlternateQuantity(item.material_id, item.quantity);
              
              return (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    {formData.items.length > 1 && (
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Material *</Label>
                      <Select value={item.material_id} onValueChange={(value) => updateItem(index, 'material_id', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select material" />
                        </SelectTrigger>
                        <SelectContent>
                          {stocks.map(stock => (
                            <SelectItem key={stock.id} value={stock.id}>
                              {stock.material_name} {stock.color && `- ${stock.color}`} {stock.gsm && `(${stock.gsm} GSM)`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Unit Price ({material?.unit || 'unit'})</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Quantity ({material?.unit || 'unit'}) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                      {alternateQty && material?.alternate_unit && (
                        <p className="text-sm text-muted-foreground mt-1">
                          = {alternateQty} {material.alternate_unit}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label>Line Total</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.line_total.toFixed(2)}
                          readOnly
                          className="bg-muted"
                        />
                        <Calculator className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="transport_charge">Transport Charge</Label>
            <Input
              id="transport_charge"
              type="number"
              step="0.01"
              value={formData.transport_charge}
              onChange={(e) => setFormData(prev => ({ ...prev, transport_charge: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
            />
          </div>
          
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Transport Charge:</span>
              <span>₹{formData.transport_charge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total Amount:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Purchase"}
        </Button>
      </div>
    </form>
  );
};
