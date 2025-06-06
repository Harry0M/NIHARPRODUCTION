import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { PlusCircle, Trash2, Calendar, Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Supplier {
  id: string;
  name: string;
}

interface MaterialSupplier {
  id: string;
  material_id: string;
  supplier_id: string;
  supplier_name: string;
  is_default: boolean;
  last_purchase_date: string;
  purchase_price: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface SupplierHistoryProps {
  materialId: string;
  onUpdate?: () => void;
}

export const SupplierHistory = ({ materialId, onUpdate }: SupplierHistoryProps) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materialSuppliers, setMaterialSuppliers] = useState<MaterialSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [purchasePrice, setPurchasePrice] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [purchaseDate, setPurchaseDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );

  useEffect(() => {
    fetchSuppliers();
    fetchMaterialSuppliers();
  }, [materialId]);

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

  const fetchMaterialSuppliers = async () => {
    setLoading(true);
    try {
      // Join material_suppliers with suppliers to get supplier names
      // Use type assertion to tell TypeScript that this table exists
      const { data, error } = await (supabase as any)
        .from("material_suppliers")
        .select(`
          id,
          material_id,
          supplier_id,
          is_default,
          last_purchase_date,
          purchase_price,
          notes,
          created_at,
          updated_at,
          suppliers:supplier_id (name)
        `)
        .eq("material_id", materialId)
        .order("last_purchase_date", { ascending: false });

      if (error) throw error;

      // Format the data to include supplier_name
      const formattedData = (data || []).map((item: any) => {
        return {
          id: item.id,
          material_id: item.material_id,
          supplier_id: item.supplier_id,
          supplier_name: item.suppliers ? item.suppliers.name : "Unknown Supplier",
          is_default: item.is_default,
          last_purchase_date: item.last_purchase_date,
          purchase_price: item.purchase_price,
          notes: item.notes,
          created_at: item.created_at,
          updated_at: item.updated_at
        };
      });

      setMaterialSuppliers(formattedData);
    } catch (error) {
      console.error("Error fetching material suppliers:", error);
      toast({
        title: "Error",
        description: "Failed to load supplier history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addSupplier = async () => {
    if (!selectedSupplierId) {
      toast({
        title: "Error",
        description: "Please select a supplier",
        variant: "destructive",
      });
      return;
    }

    try {
      // Define the new supplier data with the correct types
      const newSupplier: {
        material_id: string;
        supplier_id: string;
        purchase_price: number | null;
        last_purchase_date: string | null;
        notes: string | null;
      } = {
        material_id: materialId,
        supplier_id: selectedSupplierId,
        purchase_price: parseFloat(purchasePrice) || null,
        last_purchase_date: purchaseDate ? new Date(purchaseDate).toISOString() : null,
        notes: notes || null,
      };

      // Use type assertion for the table name
      const { error } = await (supabase as any)
        .from("material_suppliers")
        .upsert(newSupplier, { onConflict: "material_id,supplier_id" });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Supplier added to material history",
      });

      // Reset form
      setSelectedSupplierId("");
      setPurchasePrice("");
      setNotes("");
      setPurchaseDate(format(new Date(), "yyyy-MM-dd"));
      setAddDialogOpen(false);

      // Refresh material suppliers
      fetchMaterialSuppliers();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error adding supplier:", error);
      toast({
        title: "Error",
        description: "Failed to add supplier",
        variant: "destructive",
      });
    }
  };

  const setDefaultSupplier = async (supplierId: string) => {
    try {
      // Call the database function to set the default supplier
      // Use 'any' type to bypass the TypeScript error with RPC function names
      const { error } = await (supabase.rpc as any)("set_default_material_supplier", {
        p_material_id: materialId,
        p_supplier_id: supplierId,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Default supplier updated",
      });

      // Refresh material suppliers
      fetchMaterialSuppliers();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error setting default supplier:", error);
      toast({
        title: "Error",
        description: "Failed to update default supplier",
        variant: "destructive",
      });
    }
  };

  const removeSupplier = async (supplierId: string) => {
    try {
      // Use type assertion for the table name
      const { error } = await (supabase as any)
        .from("material_suppliers")
        .delete()
        .eq("material_id", materialId)
        .eq("supplier_id", supplierId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Supplier removed from material history",
      });

      // Refresh material suppliers
      fetchMaterialSuppliers();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error removing supplier:", error);
      toast({
        title: "Error",
        description: "Failed to remove supplier",
        variant: "destructive",
      });
    }
  };

  const filteredSuppliers = suppliers.filter(
    (supplier) => !materialSuppliers.some((ms) => ms.supplier_id === supplier.id)
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Supplier History</CardTitle>
            <Button
              size="sm"
              onClick={() => setAddDialogOpen(true)}
              disabled={filteredSuppliers.length === 0}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800"></div>
            </div>
          ) : materialSuppliers.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>No supplier history available for this material.</p>
              <p className="text-sm mt-1">
                Add suppliers who have provided this material to keep track of purchase history.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Default</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Last Purchase</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materialSuppliers.map((ms) => (
                  <TableRow key={ms.id}>
                    <TableCell>
                      {ms.is_default ? (
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDefaultSupplier(ms.supplier_id)}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{ms.supplier_name}</TableCell>
                    <TableCell>
                      {ms.last_purchase_date
                        ? format(new Date(ms.last_purchase_date), "dd MMM yyyy")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {ms.purchase_price
                        ? new Intl.NumberFormat("en-IN", {
                            style: "currency",
                            currency: "INR",
                            minimumFractionDigits: 2,
                          }).format(ms.purchase_price)
                        : "N/A"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {ms.notes || "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSupplier(ms.supplier_id)}
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Supplier</DialogTitle>
            <DialogDescription>
              Add a supplier who has provided this material.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Select
                value={selectedSupplierId}
                onValueChange={setSelectedSupplierId}
              >
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSuppliers.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      All suppliers have been added to this material
                    </div>
                  ) : (
                    filteredSuppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Last Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price</Label>
              <Input
                id="purchasePrice"
                type="number"
                placeholder="Price per unit"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addSupplier}>Add Supplier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
