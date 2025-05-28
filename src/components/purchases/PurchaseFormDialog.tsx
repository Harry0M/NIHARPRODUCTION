
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePurchases } from "@/hooks/purchases/usePurchases";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useInventoryStocks } from "@/hooks/inventory/useInventoryStocks";

const purchaseItemSchema = z.object({
  material_id: z.string().min(1, "Material is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unit_price: z.number().min(0.01, "Unit price must be greater than 0"),
});

const purchaseSchema = z.object({
  supplier_id: z.string().optional(),
  purchase_date: z.string().min(1, "Purchase date is required"),
  transport_charge: z.number().min(0, "Transport charge cannot be negative"),
  notes: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

interface PurchaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PurchaseFormDialog({ open, onOpenChange }: PurchaseFormDialogProps) {
  const { createPurchase, isCreating } = usePurchases();
  const { data: suppliers = [] } = useSuppliers();
  const { data: materials = [] } = useInventoryStocks();
  
  const [items, setItems] = useState([
    { material_id: "", quantity: 0, unit_price: 0 }
  ]);

  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplier_id: "",
      purchase_date: new Date().toISOString().split('T')[0],
      transport_charge: 0,
      notes: "",
      items: [{ material_id: "", quantity: 0, unit_price: 0 }],
    },
  });

  useEffect(() => {
    form.setValue("items", items);
  }, [items, form]);

  const addItem = () => {
    setItems([...items, { material_id: "", quantity: 0, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      const lineTotal = item.quantity * item.unit_price;
      return sum + (isNaN(lineTotal) ? 0 : lineTotal);
    }, 0);
    
    const transportCharge = form.getValues("transport_charge") || 0;
    const total = subtotal + transportCharge;
    
    return { subtotal, total };
  };

  const onSubmit = (data: PurchaseFormData) => {
    const { subtotal, total } = calculateTotals();
    
    const purchaseData = {
      supplier_id: data.supplier_id || null,
      purchase_date: data.purchase_date,
      transport_charge: data.transport_charge,
      subtotal,
      total_amount: total,
      notes: data.notes || null,
      status: "pending",
      items: items.map(item => ({
        material_id: item.material_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.quantity * item.unit_price,
      })),
    };

    createPurchase(purchaseData);
  };

  const { subtotal, total } = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Purchase</DialogTitle>
          <DialogDescription>
            Add a new purchase order from a supplier
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplier_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No Supplier</SelectItem>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchase_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Purchase Items</CardTitle>
                  <Button type="button" onClick={addItem} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded">
                    <div>
                      <label className="text-sm font-medium">Material</label>
                      <Select
                        value={item.material_id}
                        onValueChange={(value) => updateItem(index, "material_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select material" />
                        </SelectTrigger>
                        <SelectContent>
                          {materials.map((material) => (
                            <SelectItem key={material.id} value={material.id}>
                              {material.material_name} - {material.color} ({material.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Quantity</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Unit Price</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="flex items-end">
                      <div className="flex-1">
                        <label className="text-sm font-medium">Line Total</label>
                        <div className="text-lg font-semibold">
                          ₹{(item.quantity * item.unit_price).toFixed(2)}
                        </div>
                      </div>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="transport_charge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transport Charge</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transport Charge:</span>
                    <span>₹{(form.watch("transport_charge") || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Total:</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Purchase"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
