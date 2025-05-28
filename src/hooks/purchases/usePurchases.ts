
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Purchase, CreatePurchaseData } from "@/types/purchase";

export const usePurchases = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch all purchases
  const {
    data: purchases = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select(`
          *,
          supplier:suppliers(id, name, contact_person, phone, email),
          purchase_items(
            *,
            material:inventory(id, material_name, unit, color, gsm)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Purchase[];
    },
  });

  // Create purchase mutation
  const createMutation = useMutation({
    mutationFn: async (purchaseData: CreatePurchaseData) => {
      // Create the purchase first
      const { data: purchase, error: purchaseError } = await supabase
        .from("purchases")
        .insert({
          supplier_id: purchaseData.supplier_id,
          purchase_date: purchaseData.purchase_date,
          transport_charge: purchaseData.transport_charge,
          subtotal: purchaseData.subtotal,
          total_amount: purchaseData.total_amount,
          notes: purchaseData.notes,
          status: purchaseData.status,
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Create purchase items
      if (purchaseData.items.length > 0) {
        const items = purchaseData.items.map(item => ({
          ...item,
          purchase_id: purchase.id,
        }));

        const { error: itemsError } = await supabase
          .from("purchase_items")
          .insert(items);

        if (itemsError) throw itemsError;
      }

      return purchase;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast({
        title: "Success",
        description: "Purchase created successfully",
      });
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      console.error("Error creating purchase:", error);
      toast({
        title: "Error",
        description: "Failed to create purchase. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete purchase mutation
  const deleteMutation = useMutation({
    mutationFn: async (purchaseId: string) => {
      const { error } = await supabase
        .from("purchases")
        .delete()
        .eq("id", purchaseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      toast({
        title: "Success",
        description: "Purchase deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting purchase:", error);
      toast({
        title: "Error",
        description: "Failed to delete purchase. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    purchases,
    isLoading,
    error,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    createPurchase: createMutation.mutate,
    deletePurchase: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
