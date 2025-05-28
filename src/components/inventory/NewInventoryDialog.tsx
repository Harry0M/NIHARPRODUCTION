import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showToast } from "@/components/ui/enhanced-toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

type InventoryItem = Database["public"]["Tables"]["inventory"]["Row"];

interface NewInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInventoryCreated: (newItem: InventoryItem) => void;
}

export const NewInventoryDialog = ({
  open,
  onOpenChange,
  onInventoryCreated,
}: NewInventoryDialogProps) => {
  // Prevent form submission from bubbling up to parent forms
  const handleDialogClick = (e: React.MouseEvent) => {
    // Stop click events from reaching parent forms
    e.stopPropagation();
  };
  const [materialName, setMaterialName] = useState("");
  const [color, setColor] = useState("");
  const [unit, setUnit] = useState("meters");
  const [alternateUnit, setAlternateUnit] = useState("none");
  const [conversionRate, setConversionRate] = useState<number>(1);
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [gsm, setGsm] = useState<string>("");
  const [minStockLevel, setMinStockLevel] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common units used in the system
  const commonUnits = [
    "meters", "pieces", "kilograms", "grams", "yards", "rolls", 
    "packs", "sets", "boxes", "liters", "milliliters"
  ];

  const handleSubmit = async () => {
    if (!materialName) {
      showToast({
        title: "Material Name Required",
        description: "Please enter a material name",
        type: "error"
      });
      return;
    }

    if (!unit) {
      showToast({
        title: "Unit Required",
        description: "Please select a unit of measurement",
        type: "error"
      });
      return;
    }

    if (purchasePrice <= 0) {
      showToast({
        title: "Invalid Price",
        description: "Purchase price must be greater than zero",
        type: "error"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const newInventoryItem = {
        material_name: materialName,
        color: color || null,
        unit: unit,
        alternate_unit: alternateUnit === 'none' ? null : alternateUnit,
        conversion_rate: alternateUnit === 'none' ? null : (conversionRate || 1),
        purchase_price: purchasePrice,
        quantity: quantity || 0,
        min_stock_level: minStockLevel || 0,
        gsm: gsm || null,
        status: "active"
      };

      const { data, error } = await supabase
        .from("inventory")
        .insert([newInventoryItem])
        .select()
        .single();

      if (error) {
        console.error("Error creating inventory item:", error);
        showToast({
          title: "Error",
          description: error.message || "Failed to create inventory item",
          type: "error"
        });
        return;
      }

      showToast({
        title: "Inventory Item Created",
        description: `${materialName} has been added to inventory`,
        type: "success"
      });

      onInventoryCreated(data);
      onOpenChange(false);
      
      // Reset form
      setMaterialName("");
      setColor("");
      setUnit("meters");
      setAlternateUnit("pieces");
      setConversionRate(1);
      setPurchasePrice(0);
      setQuantity(0);
      setGsm("");
      setMinStockLevel(10);
    } catch (error: any) {
      console.error("Error creating inventory item:", error);
      showToast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        type: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[500px]" 
        onClick={handleDialogClick}
      >
        <DialogHeader>
          <DialogTitle>Create New Inventory Item</DialogTitle>
          <DialogDescription>
            Add a new material to your inventory. This item will be immediately available for purchase.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4" onSubmit={(e) => e.stopPropagation()}>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="material-name" className="text-right">
              Material Name*
            </Label>
            <Input
              id="material-name"
              value={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Cotton Fabric"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">
              Color
            </Label>
            <Input
              id="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Blue"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="gsm" className="text-right">
              GSM
            </Label>
            <Input
              id="gsm"
              value={gsm}
              onChange={(e) => setGsm(e.target.value)}
              className="col-span-3"
              placeholder="e.g., 180"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="main-unit" className="text-right">
              Main Unit*
            </Label>
            <div className="col-span-3">
              <Select
                value={unit}
                onValueChange={setUnit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {commonUnits.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u.charAt(0).toUpperCase() + u.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="alternate-unit" className="text-right">
              Alternate Unit
            </Label>
            <div className="col-span-3">
              <Select
                value={alternateUnit}
                onValueChange={setAlternateUnit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select alternate unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {commonUnits.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u.charAt(0).toUpperCase() + u.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {alternateUnit && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="conversion-rate" className="text-right">
                Conversion Rate
              </Label>
              <Input
                id="conversion-rate"
                type="number"
                min="0.01"
                step="0.01"
                value={conversionRate || ""}
                onChange={(e) => setConversionRate(parseFloat(e.target.value) || 0)}
                className="col-span-3"
                placeholder="e.g., 1.5"
              />
              <div className="col-span-4 text-xs text-muted-foreground pl-[calc(25%+16px)]">
                1 {unit} = {conversionRate} {alternateUnit}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="purchase-price" className="text-right">
              Purchase Price*
            </Label>
            <Input
              id="purchase-price"
              type="number"
              min="0"
              step="0.01"
              value={purchasePrice || ""}
              onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
              className="col-span-3"
              placeholder="e.g., 100"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="initial-quantity" className="text-right">
              Initial Quantity
            </Label>
            <Input
              id="initial-quantity"
              type="number"
              min="0"
              step="0.01"
              value={quantity || ""}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              className="col-span-3"
              placeholder="e.g., 0"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="min-stock-level" className="text-right">
              Min Stock Level
            </Label>
            <Input
              id="min-stock-level"
              type="number"
              min="0"
              step="1"
              value={minStockLevel || ""}
              onChange={(e) => setMinStockLevel(parseInt(e.target.value) || 0)}
              className="col-span-3"
              placeholder="e.g., 10"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating...
              </>
            ) : (
              "Create & Add"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
