import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { stockFormSchema, StockFormValues, defaultValues } from "./StockFormSchema";

interface UseStockFormProps {
  stockId?: string;
  onSuccess?: (stockId: string) => void;
}

export function useStockForm({ stockId, onSuccess }: UseStockFormProps = {}) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [hasAlternateUnit, setHasAlternateUnit] = useState(false);
  // Remove trackCost state as we're removing that functionality

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      console.log("Fetching suppliers...");
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, name, status")
        .eq('status', 'active')
        .order("name");
      
      if (error) {
        console.error("Error fetching suppliers:", error);
        throw error;
      }
      
      console.log("Fetched suppliers:", data);
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
    defaultValues,
    mode: "onChange"
  });

  // Set form values when editing an existing stock item
  useEffect(() => {
    if (stockItem) {
      form.reset({
        material_name: stockItem.material_name,
        color: stockItem.color || "",
        gsm: stockItem.gsm || "",
        quantity: stockItem.quantity,
        unit: stockItem.unit,
        alternate_unit: stockItem.alternate_unit || "",
        conversion_rate: stockItem.conversion_rate || 0,
        track_cost: false, // Always set to false since we're removing this option
        purchase_price: stockItem.purchase_price || 0,
        selling_price: stockItem.selling_price || 0,
        supplier_id: stockItem.supplier_id || "",
        reorder_level: stockItem.reorder_level || 0,
        purchase_rate: stockItem.purchase_rate || 0,
      });
      setHasAlternateUnit(!!stockItem.alternate_unit);
    }
  }, [stockItem, form]);

  const createStockMutation = useMutation({
    mutationFn: async (values: StockFormValues) => {
      try {
        // Make sure all required fields are present and valid
        if (!values.material_name || values.material_name.trim() === '') {
          throw new Error("Material name is required");
        }

        if (!values.unit || values.unit.trim() === '') {
          throw new Error("Unit is required");
        }

        // Create a properly typed object for insertion
        const stockData = {
          material_name: values.material_name.trim(),
          color: values.color || null,
          gsm: values.gsm || null,
          quantity: values.quantity,
          unit: values.unit,
          alternate_unit: hasAlternateUnit ? values.alternate_unit || null : null,
          conversion_rate: hasAlternateUnit ? values.conversion_rate || 0 : 0,
          track_cost: false, // Always set to false since we're removing this option
          purchase_price: null, // Set to null since we're not tracking cost
          selling_price: null, // Set to null since we're not tracking cost
          supplier_id: values.supplier_id && values.supplier_id !== "" && values.supplier_id !== "none" ? values.supplier_id : null,
          reorder_level: values.reorder_level || null,
          purchase_rate: values.purchase_rate || null, // Keep purchase rate
        };
        
        const { data, error } = await supabase
          .from("inventory")
          .insert(stockData)
          .select();
          
        if (error) throw error;
        
        // Create a manual transaction log entry for initial stock creation
        if (data && data[0] && values.quantity > 0) {
          const { error: transactionError } = await supabase.rpc(
            'record_manual_inventory_transaction',
            {
              p_material_id: data[0].id,
              p_transaction_type: 'initial-stock-creation',
              p_quantity: values.quantity,
              p_previous_quantity: 0,
              p_new_quantity: values.quantity,
              p_notes: `Initial stock creation: ${values.material_name}`,
              p_metadata: JSON.stringify({
                material_name: values.material_name,
                unit: values.unit,
                update_source: 'stock_form_creation'
              })
            }
          );
          
          if (transactionError) {
            console.error("Error creating manual transaction log:", transactionError);
            // Don't fail the stock creation if transaction log fails
          }
        }
        
        return data;
      } catch (error) {
        console.error("Error creating stock:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({
        title: "Stock created successfully",
        description: "The stock item has been created",
      });
      
      // Call the onSuccess callback if provided
      if (onSuccess && data && data[0]) {
        onSuccess(data[0].id);
        return; // Don't navigate automatically when callback is provided
      }

      // Navigate to the newly created stock item's detail page using hash routing (only when no callback)
      if (data && data[0]) {
        window.location.href = `${window.location.origin}/#/inventory/stock/${data[0].id}`;
      } else {
        window.location.href = `${window.location.origin}/#/inventory/stock`;
      }
    },
    onError: (error) => {
      console.error("Error creating stock:", error);
      toast({
        title: "Failed to create stock",
        description: error instanceof Error ? error.message : "There was an error creating the stock item",
        variant: "destructive",
      });
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async (values: StockFormValues) => {
      if (!stockId) throw new Error("Stock ID is required for updates");
      
      // Ensure required fields are present
      if (!values.material_name || !values.quantity || !values.unit) {
        throw new Error("Required fields are missing");
      }

      // Get current stock data to check for quantity changes
      const { data: currentStock, error: fetchError } = await supabase
        .from("inventory")
        .select("quantity, material_name, unit")
        .eq("id", stockId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const previousQuantity = currentStock?.quantity || 0;
      const newQuantity = values.quantity;
      const quantityChanged = previousQuantity !== newQuantity;

      // Create a properly typed object for update
      const stockData = {
        material_name: values.material_name,
        color: values.color || null,
        gsm: values.gsm || null,
        quantity: values.quantity,
        unit: values.unit,
        alternate_unit: values.alternate_unit || null,
        conversion_rate: values.conversion_rate || 0,
        track_cost: false, // Always set to false since we're removing this option
        purchase_price: null, // Set to null since we're not tracking cost
        selling_price: null, // Set to null since we're not tracking cost
        supplier_id: values.supplier_id || null,
        reorder_level: values.reorder_level || null,
        purchase_rate: values.purchase_rate || null, // Keep purchase rate
      };
      
      const { data, error } = await supabase
        .from("inventory")
        .update(stockData)
        .eq("id", stockId)
        .select();
      
      if (error) throw error;
      
      // Create a manual transaction log entry if quantity changed
      if (quantityChanged) {
        const quantityChange = newQuantity - previousQuantity;
        const { error: transactionError } = await supabase.rpc(
          'record_manual_inventory_transaction',
          {
            p_material_id: stockId,
            p_transaction_type: 'manual-stock-adjustment',
            p_quantity: newQuantity, // Store the actual entered amount, not the difference
            p_previous_quantity: previousQuantity,
            p_new_quantity: newQuantity,
            p_notes: `Manual stock adjustment: ${values.material_name} (quantity set to ${newQuantity})`,
            p_metadata: JSON.stringify({
              material_name: values.material_name,
              unit: values.unit,
              update_source: 'stock_form_edit',
              quantity_change: quantityChange, // Store the difference in metadata for reference
              entered_amount: newQuantity // Store the actual entered amount in metadata too
            })
          }
        );
        
        if (transactionError) {
          console.error("Error creating manual transaction log:", transactionError);
          // Don't fail the stock update if transaction log fails
        }
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["stock", stockId] });
      toast({
        title: "Stock updated successfully",
        description: "The stock item has been updated",
      });
      
      // Call the onSuccess callback if provided
      if (onSuccess && data && data[0]) {
        onSuccess(data[0].id);
      } else {
        // Navigate to the updated stock item's detail page using hash routing
        window.location.href = `${window.location.origin}/#/inventory/stock/${stockId}`;
      }
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
    // Log the form values before submission
    console.log("Form values before submission:", values);
    
    // Make sure the values are correct before submission
    const submissionValues = { 
      ...values,
      material_name: values.material_name.trim(),
      unit: values.unit.trim(), 
      track_cost: false // Always set to false since we're removing this option
    };

    // Remove alternate unit data if not using it
    if (!hasAlternateUnit) {
      submissionValues.alternate_unit = '';
      submissionValues.conversion_rate = 0;
    }

    // Handle empty value for supplier_id
    if (submissionValues.supplier_id === "" || submissionValues.supplier_id === "none") {
      submissionValues.supplier_id = "";
    }

    console.log("Submitting values:", submissionValues);

    if (stockId) {
      updateStockMutation.mutate(submissionValues);
    } else {
      createStockMutation.mutate(submissionValues);
    }
  };

  return {
    form,
    onSubmit,
    suppliers,
    hasAlternateUnit,
    setHasAlternateUnit,
    isLoading,
    // Remove trackCost and setTrackCost from the returned object
  };
}
