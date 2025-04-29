
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, ArrowLeftRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Define schema with proper type transformations
const inventoryFormSchema = z.object({
  material_type: z.string().min(2, {
    message: "Material type must be at least 2 characters.",
  }),
  color: z.string().optional(),
  gsm: z.string().optional(),
  quantity: z.coerce.number().min(0, {
    message: "Quantity must be a positive number.",
  }),
  unit: z.string().min(1, {
    message: "Please select a unit.",
  }),
  alternate_unit: z.string().optional(),
  conversion_rate: z.coerce.number().optional().default(1),
  track_cost: z.boolean().default(false),
  purchase_price: z.coerce.number().optional(),
  selling_price: z.coerce.number().optional(),
  supplier_id: z.string().optional(),
  reorder_level: z.coerce.number().optional(),
});

type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

const StockJournal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConversionRate, setShowConversionRate] = useState(false);
  const [showCostTracking, setShowCostTracking] = useState(false);

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      material_type: "",
      color: "",
      gsm: "",
      quantity: 0,
      unit: "",
      alternate_unit: "",
      conversion_rate: 1,
      track_cost: false,
      purchase_price: undefined,
      selling_price: undefined,
      supplier_id: "",
      reorder_level: 0,
    },
  });

  const createInventoryMutation = useMutation({
    mutationFn: async (formData: InventoryFormValues) => {
      // Ensure all required fields are present and properly typed
      const inventoryItem = {
        material_type: formData.material_type,
        color: formData.color || null,
        gsm: formData.gsm || null,
        quantity: formData.quantity,
        unit: formData.unit,
        alternate_unit: formData.alternate_unit || null,
        conversion_rate: formData.conversion_rate,
        track_cost: formData.track_cost,
        purchase_price: formData.purchase_price || null,
        selling_price: formData.selling_price || null,
        supplier_id: formData.supplier_id || null,
        reorder_level: formData.reorder_level || null,
      };
      
      const { data, error } = await supabase
        .from('inventory')
        .insert(inventoryItem)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Stock added",
        description: "The inventory item has been created successfully.",
      });
      navigate('/inventory/stock');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create inventory item: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: InventoryFormValues) {
    createInventoryMutation.mutate(data);
  }

  const commonUnits = [
    "meters", "yards", "kilograms", "pounds", 
    "pieces", "rolls", "boxes", "bundles"
  ];

  // Handle alternate unit selection
  const handleAlternateUnitChange = (value: string) => {
    if (value && value !== form.getValues("unit")) {
      setShowConversionRate(true);
    } else {
      setShowConversionRate(false);
      form.setValue("alternate_unit", "");
      form.setValue("conversion_rate", 1);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Package className="h-6 w-6 text-primary" />
          <CardTitle>Create Stock Entry</CardTitle>
        </div>
        <CardDescription>
          Add a new material to your inventory with detailed tracking options
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="material_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter material name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
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
                    <FormLabel>Main Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {commonUnits.map(unit => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alternate_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alternate Unit (Optional)</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleAlternateUnitChange(value);
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select alternate unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {commonUnits.map(unit => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Optional secondary unit for conversion
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showConversionRate && (
                <FormField
                  control={form.control}
                  name="conversion_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conversion Rate</FormLabel>
                      <div className="flex items-center space-x-2">
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)} 
                          />
                        </FormControl>
                        <ArrowLeftRight className="h-4 w-4" />
                      </div>
                      <FormDescription>
                        How many {form.watch("alternate_unit")} equals 1 {form.watch("unit")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter color" {...field} />
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
                    <FormLabel>GSM (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="GSM value" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="track_cost"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          setShowCostTracking(checked as boolean);
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Enable Cost Tracking
                      </FormLabel>
                      <FormDescription>
                        Track purchase and selling prices for this material
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showCostTracking && (
                <>
                  <FormField
                    control={form.control}
                    name="purchase_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purchase Price</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)} 
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
                        <FormLabel>Selling Price</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="reorder_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder Level (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)} 
                      />
                    </FormControl>
                    <FormDescription>
                      Set minimum stock level before reordering
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" type="button" onClick={() => navigate('/inventory/stock')}>
                Cancel
              </Button>
              <Button type="submit" disabled={createInventoryMutation.isPending}>
                {createInventoryMutation.isPending ? "Creating..." : "Create Stock Entry"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default StockJournal;
