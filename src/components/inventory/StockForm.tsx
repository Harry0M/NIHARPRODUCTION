import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const stockFormSchema = z.object({
  material_type: z.string().min(1, "Material type is required"),
  color: z.string().optional(),
  gsm: z.string().optional(),
  quantity: z.number().min(0, "Quantity must be a positive number"),
  unit: z.string().min(1, "Unit is required"),
  alternate_unit: z.string().optional(),
  conversion_rate: z.number().optional(),
  track_cost: z.boolean().default(false),
  purchase_price: z.number().optional(),
  selling_price: z.number().optional(),
  supplier_id: z.string().optional(),
  reorder_level: z.number().optional(),
});

type StockFormValues = z.infer<typeof stockFormSchema>;

interface StockFormProps {
  stockId?: string;
}

export const StockForm = ({ stockId }: StockFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [hasAlternateUnit, setHasAlternateUnit] = useState(false);
  const [trackCost, setTrackCost] = useState(false);

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("id, name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: stockItem, isLoading } = useQuery({
    queryKey: ["stock", stockId],
    queryFn: async () => {
      if (!stockId) return null;
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("id", stockId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!stockId,
  });

  const form = useForm<StockFormValues>({
    resolver: zodResolver(stockFormSchema),
    defaultValues: {
      material_type: "",
      color: "",
      gsm: "",
      quantity: 0,
      unit: "",
      alternate_unit: "",
      conversion_rate: 1,
      track_cost: false,
      purchase_price: 0,
      selling_price: 0,
      supplier_id: "",
      reorder_level: 0,
    },
  });

  // Set form values when editing an existing stock item
  useEffect(() => {
    if (stockItem) {
      form.reset({
        material_type: stockItem.material_type,
        color: stockItem.color || "",
        gsm: stockItem.gsm || "",
        quantity: stockItem.quantity,
        unit: stockItem.unit,
        alternate_unit: stockItem.alternate_unit || "",
        conversion_rate: stockItem.conversion_rate || 1,
        track_cost: stockItem.track_cost || false,
        purchase_price: stockItem.purchase_price || 0,
        selling_price: stockItem.selling_price || 0,
        supplier_id: stockItem.supplier_id || "",
        reorder_level: stockItem.reorder_level || 0,
      });
      setHasAlternateUnit(!!stockItem.alternate_unit);
      setTrackCost(stockItem.track_cost || false);
    }
  }, [stockItem, form]);

  const createStockMutation = useMutation({
    mutationFn: async (values: StockFormValues) => {
      // Fix: Pass a single object instead of an array to insert
      const { data, error } = await supabase.from("inventory").insert(values).select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({
        title: "Stock created successfully",
        description: "New stock item has been added to inventory",
      });
      navigate("/inventory/stock");
    },
    onError: (error) => {
      console.error("Error creating stock:", error);
      toast({
        title: "Failed to create stock",
        description: "There was an error creating the stock item",
        variant: "destructive",
      });
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async (values: StockFormValues) => {
      if (!stockId) throw new Error("Stock ID is required for updates");
      const { data, error } = await supabase
        .from("inventory")
        .update(values)
        .eq("id", stockId)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["stock", stockId] });
      toast({
        title: "Stock updated successfully",
        description: "The stock item has been updated",
      });
      navigate("/inventory/stock");
    },
    onError: (error) => {
      console.error("Error updating stock:", error);
      toast({
        title: "Failed to update stock",
        description: "There was an error updating the stock item",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: StockFormValues) => {
    // Remove alternate unit data if not using it
    if (!hasAlternateUnit) {
      values.alternate_unit = undefined;
      values.conversion_rate = undefined;
    }

    // Remove cost tracking data if not using it
    if (!trackCost) {
      values.purchase_price = undefined;
      values.selling_price = undefined;
    }

    // Handle "none" value for supplier_id
    if (values.supplier_id === "none") {
      values.supplier_id = undefined;
    }

    if (stockId) {
      updateStockMutation.mutate(values);
    } else {
      createStockMutation.mutate(values);
    }
  };

  if (isLoading && stockId) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{stockId ? "Edit Stock Item" : "Add New Stock Item"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <FormField
                  control={form.control}
                  name="material_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material Type</FormLabel>
                      <FormControl>
                        <Input placeholder="Fabric, Thread, Zipper, etc" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input placeholder="Red, Blue, Green, etc" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gsm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GSM</FormLabel>
                      <FormControl>
                        <Input placeholder="120, 250, etc" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Quantity and Units */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Quantity and Units</h3>
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="any"
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
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="meters, kg, pieces, etc" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center space-x-2 mt-4">
                  <Switch
                    id="alternate-unit"
                    checked={hasAlternateUnit}
                    onCheckedChange={setHasAlternateUnit}
                  />
                  <label
                    htmlFor="alternate-unit"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Use Alternate Unit
                  </label>
                </div>
              </div>
            </div>

            {/* Alternate Unit Settings */}
            {hasAlternateUnit && (
              <>
                <Separator className="my-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="alternate_unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alternate Unit</FormLabel>
                        <FormControl>
                          <Input placeholder="yards, pieces, etc" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="conversion_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conversion Rate</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="any" 
                            min="0.01"
                            placeholder="1 primary unit = ? alternate units" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)} 
                          />
                        </FormControl>
                        <FormDescription>
                          1 {form.watch("unit")} = {form.watch("conversion_rate")} {form.watch("alternate_unit")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            {/* Cost Tracking */}
            <Separator className="my-4" />
            <div className="flex items-center space-x-2 mb-4">
              <Switch
                id="cost-tracking"
                checked={trackCost}
                onCheckedChange={setTrackCost}
              />
              <label
                htmlFor="cost-tracking"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Enable Cost Tracking
              </label>
            </div>

            {trackCost && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="purchase_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Price (per {form.watch("unit")})</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="any" 
                          min="0"
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
                  name="selling_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selling Price (per {form.watch("unit")})</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="any" 
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Additional Information */}
            <Separator className="my-4" />
            <h3 className="text-lg font-medium">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="supplier_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {suppliers?.map((supplier) => (
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
                name="reorder_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder Level</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="any" 
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} 
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum quantity before reordering
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate("/inventory/stock")}
              >
                Cancel
              </Button>
              <Button type="submit">
                {stockId ? "Update Stock" : "Add Stock"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
