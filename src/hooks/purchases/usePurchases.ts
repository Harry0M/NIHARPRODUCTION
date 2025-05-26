
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Purchase, PurchaseWithItems } from "@/types/purchase";
import { showToast } from "@/components/ui/enhanced-toast";

export const usePurchases = () => {
  const [purchases, setPurchases] = useState<PurchaseWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchases = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          supplier:suppliers(id, name, contact_person, phone, email),
          purchase_items(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (err: any) {
      setError(err.message);
      showToast({
        title: "Error loading purchases",
        description: err.message,
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createPurchase = async (purchaseData: any) => {
    try {
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert([{
          supplier_id: purchaseData.supplier_id,
          purchase_date: purchaseData.purchase_date,
          transport_charge: purchaseData.transport_charge,
          subtotal: purchaseData.subtotal,
          total_amount: purchaseData.total_amount,
          notes: purchaseData.notes,
          status: 'pending'
        }])
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Insert purchase items
      const itemsWithPurchaseId = purchaseData.items.map((item: any) => ({
        ...item,
        purchase_id: purchase.id
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(itemsWithPurchaseId);

      if (itemsError) throw itemsError;

      showToast({
        title: "Purchase created",
        description: `Purchase ${purchase.purchase_number} created successfully`,
        type: "success"
      });

      fetchPurchases();
      return purchase;
    } catch (err: any) {
      showToast({
        title: "Error creating purchase",
        description: err.message,
        type: "error"
      });
      throw err;
    }
  };

  const completePurchase = async (purchaseId: string) => {
    try {
      const { error } = await supabase
        .from('purchases')
        .update({ status: 'completed' })
        .eq('id', purchaseId);

      if (error) throw error;

      showToast({
        title: "Purchase completed",
        description: "Inventory has been updated with purchased items",
        type: "success"
      });

      fetchPurchases();
    } catch (err: any) {
      showToast({
        title: "Error completing purchase",
        description: err.message,
        type: "error"
      });
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  return {
    purchases,
    isLoading,
    error,
    fetchPurchases,
    createPurchase,
    completePurchase
  };
};
