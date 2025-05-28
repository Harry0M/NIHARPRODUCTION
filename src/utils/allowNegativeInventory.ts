import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/components/ui/enhanced-toast";

/**
 * Update inventory quantity directly, allowing negative values
 * This function bypasses the database-level constraints and directly sets the inventory quantity
 */
export const updateInventoryQuantity = async (
  materialId: string,
  newQuantity: number,
  transactionType: string,
  notes: string | null = null,
  referenceType: string | null = null,
  referenceId: string | null = null,
  referenceNumber: string | null = null
) => {
  try {
    // First get the current quantity
    const { data: currentData, error: fetchError } = await supabase
      .from("inventory")
      .select("quantity")
      .eq("id", materialId)
      .single();
    
    if (fetchError) throw fetchError;
    
    const previousQuantity = currentData.quantity;
    const quantityChange = newQuantity - previousQuantity;
    
    // 1. Update the inventory table directly
    const { error: inventoryError } = await supabase
      .from("inventory")
      .update({ quantity: newQuantity })
      .eq("id", materialId);
    
    if (inventoryError) throw inventoryError;
    
    // 2. Create a transaction log entry manually
    const { error: logError } = await supabase
      .from("inventory_transaction_log")
      .insert({
        material_id: materialId,
        transaction_type: transactionType,
        quantity: quantityChange,
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        notes: notes,
        reference_type: referenceType,
        reference_id: referenceId,
        reference_number: referenceNumber,
        transaction_date: new Date().toISOString()
      });
    
    if (logError) throw logError;
    
    return {
      success: true,
      previousQuantity,
      newQuantity,
      change: quantityChange
    };
  } catch (error: any) {
    console.error("Error updating inventory quantity:", error);
    showToast({
      title: "Error updating inventory",
      description: error.message || "An unexpected error occurred",
      type: "error"
    });
    
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Record material usage for an order, allowing negative quantities
 */
export const recordOrderMaterialUsageWithNegatives = async (
  orderId: string,
  orderNumber: string,
  materialId: string,
  quantity: number,
  notes: string | null = null
) => {
  try {
    // First get the current quantity
    const { data: materialData, error: fetchError } = await supabase
      .from("inventory")
      .select("quantity, material_name")
      .eq("id", materialId)
      .single();
    
    if (fetchError) throw fetchError;
    
    const previousQuantity = materialData.quantity;
    const newQuantity = previousQuantity - quantity; // Allow negative quantities
    
    // Call our custom function that allows negative quantities
    const result = await updateInventoryQuantity(
      materialId,
      newQuantity,
      "consumption",
      notes || `Material used for order ${orderNumber}`,
      "Order",
      orderId,
      orderNumber
    );
    
    if (!result.success) {
      // Type-safe error handling
      const errorMsg = typeof result === 'object' && 'error' in result ? 
        result.error : 
        'Unknown error updating inventory';
      throw new Error(errorMsg);
    }
    
    showToast({
      title: "Inventory updated",
      description: `${materialData.material_name}: ${previousQuantity} → ${newQuantity}`,
      type: "success"
    });
    
    return {
      success: true,
      previousQuantity,
      newQuantity
    };
  } catch (error: any) {
    console.error("Error recording material usage:", error);
    showToast({
      title: "Error recording material usage",
      description: error.message || "An unexpected error occurred",
      type: "error"
    });
    
    return {
      success: false,
      error: error.message
    };
  }
};
