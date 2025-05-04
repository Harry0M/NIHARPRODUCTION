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
    mode: "onChange" // Update to validate on change
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
        track_cost: stockItem.track_cost || false,
        purchase_price: stockItem.purchase_price || 0,
        selling_price: stockItem.selling_price || 0,
        supplier_id: stockItem.supplier_id || "",
        reorder_level: stockItem.reorder_level || 0,
        purchase_rate: stockItem.purchase_rate || 0, // Added purchase rate
      });
      setHasAlternateUnit(!!stockItem.alternate_unit);
      setTrackCost(stockItem.track_cost || false);
    }
  }, [stockItem, form]);

  const createStockMutation = useMutation({
    mutationFn: async (values: StockFormValues) => {
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
        track_cost: trackCost,
        purchase_price: trackCost ? values.purchase_price || null : null,
        selling_price: trackCost ? values.selling_price || null : null,
        supplier_id: values.supplier_id && values.supplier_id !== "" && values.supplier_id !== "none" ? values.supplier_id : null,
        reorder_level: values.reorder_level || null,
        purchase_rate: values.purchase_rate || null, // Added purchase rate
      };
      
      console.log("Submitting stock data:", stockData);
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

      // Create a properly typed object for update
      const stockData = {
        material_name: values.material_name,
        color: values.color || null,
        gsm: values.gsm || null,
        quantity: values.quantity,
        unit: values.unit,
        alternate_unit: values.alternate_unit || null,
        conversion_rate: values.conversion_rate || 0,
        track_cost: values.track_cost || false,
        purchase_price: values.purchase_price || null,
        selling_price: values.selling_price || null,
        supplier_id: values.supplier_id || null,
        reorder_level: values.reorder_level || null,
        purchase_rate: values.purchase_rate || null, // Added purchase rate
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
    // Log the form values before submission
    console.log("Form values before submission:", values);
    
    // Make sure the values are correct before submission
    const submissionValues = { 
      ...values,
      material_name: values.material_name.trim(),
      unit: values.unit.trim(), 
    };

    // Remove alternate unit data if not using it
    if (!hasAlternateUnit) {
      submissionValues.alternate_unit = '';
      submissionValues.conversion_rate = 0;
    }

    // Remove cost tracking data if not using it
    if (!trackCost) {
      submissionValues.purchase_price = 0;
      submissionValues.selling_price = 0;
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
    trackCost,
    setTrackCost,
    isLoading,
  };
}
