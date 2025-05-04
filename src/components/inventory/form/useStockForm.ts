
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
}

export function useStockForm({ stockId }: UseStockFormProps = {}) {
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

  const { data: vendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vendors").select("id, name");
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
    defaultValues,
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
        vendor_id: stockItem.vendor_id || "",
        reorder_level: stockItem.reorder_level || 0,
      });
      setHasAlternateUnit(!!stockItem.alternate_unit);
      setTrackCost(stockItem.track_cost || false);
    }
  }, [stockItem, form]);

  const createStockMutation = useMutation({
    mutationFn: async (values: StockFormValues) => {
      // Ensure required fields are present
      if (!values.material_type || !values.quantity || !values.unit) {
        throw new Error("Required fields are missing");
      }

      // Create a properly typed object for insertion
      const stockData = {
        material_type: values.material_type,
        color: values.color || null,
        gsm: values.gsm || null,
        quantity: values.quantity,
        unit: values.unit,
        alternate_unit: values.alternate_unit || null,
        conversion_rate: values.conversion_rate || 1,
        track_cost: values.track_cost || false,
        purchase_price: values.purchase_price || null,
        selling_price: values.selling_price || null,
        supplier_id: values.supplier_id || null,
        vendor_id: values.vendor_id || null,
        reorder_level: values.reorder_level || null,
      };
      
      const { data, error } = await supabase.from("inventory").insert(stockData).select();
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
      
      // Ensure required fields are present
      if (!values.material_type || !values.quantity || !values.unit) {
        throw new Error("Required fields are missing");
      }

      // Create a properly typed object for update
      const stockData = {
        material_type: values.material_type,
        color: values.color || null,
        gsm: values.gsm || null,
        quantity: values.quantity,
        unit: values.unit,
        alternate_unit: values.alternate_unit || null,
        conversion_rate: values.conversion_rate || 1,
        track_cost: values.track_cost || false,
        purchase_price: values.purchase_price || null,
        selling_price: values.selling_price || null,
        supplier_id: values.supplier_id || null,
        vendor_id: values.vendor_id || null,
        reorder_level: values.reorder_level || null,
      };
      
      const { data, error } = await supabase
        .from("inventory")
        .update(stockData)
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
    // Prepare the values for submission
    const submissionValues = { ...values };

    // Remove alternate unit data if not using it
    if (!hasAlternateUnit) {
      submissionValues.alternate_unit = undefined;
      submissionValues.conversion_rate = undefined;
    }

    // Remove cost tracking data if not using it
    if (!trackCost) {
      submissionValues.purchase_price = undefined;
      submissionValues.selling_price = undefined;
    }

    // Handle empty value for supplier_id and vendor_id
    if (submissionValues.supplier_id === "") {
      submissionValues.supplier_id = undefined;
    }
    
    if (submissionValues.vendor_id === "") {
      submissionValues.vendor_id = undefined;
    }

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
    vendors,
    hasAlternateUnit,
    setHasAlternateUnit,
    trackCost,
    setTrackCost,
    isLoading,
  };
}
