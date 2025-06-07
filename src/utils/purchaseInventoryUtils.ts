import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/components/ui/enhanced-toast";

/**
 * Interface for purchase item data with actual_meter
 */
interface PurchaseItemWithActualMeter {
  id: string;
  material_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  actual_meter: number;
  material: {
    id: string;
    material_name: string;
    conversion_rate?: number;
    unit: string;
  };
}

/**
 * Interface for purchase data
 */
interface PurchaseData {
  id: string;
  purchase_number: string;
  transport_charge: number;
  purchase_items: PurchaseItemWithActualMeter[];
}

/**
 * Handle purchase completion using actual_meter for inventory transactions
 * This replaces database triggers with TypeScript logic
 */
export const completePurchaseWithActualMeter = async (
  purchase: PurchaseData
): Promise<{ success: boolean; error?: string; updatedMaterials?: any[] }> => {
  try {
    console.log("========= STARTING PURCHASE COMPLETION WITH ACTUAL_METER =========");
    console.log("Purchase ID:", purchase.id);
    console.log("Purchase items:", purchase.purchase_items);

    const updatedMaterials: any[] = [];
    const errors: string[] = [];

    // Process each purchase item using actual_meter for inventory calculations
    for (const item of purchase.purchase_items) {
      const { material_id, actual_meter, quantity, unit_price, material } = item;
      
      console.log(`Processing material ${material_id} (${material.material_name})`);
      console.log(`- Main Quantity: ${quantity}`);
      console.log(`- Actual Meter: ${actual_meter}`);
      console.log(`- Unit Price: ${unit_price}`);

      // Use actual_meter for inventory transaction if it's greater than 0, otherwise fall back to quantity
      const inventoryQuantity = actual_meter > 0 ? actual_meter : quantity;
      
      console.log(`- Using ${inventoryQuantity} for inventory update (actual_meter logic)`);

      try {
        // Get current inventory quantity
        const { data: currentInventory, error: fetchError } = await supabase
          .from("inventory")
          .select("quantity, material_name, conversion_rate, purchase_price")
          .eq("id", material_id)
          .single();

        if (fetchError) {
          console.error(`Error fetching inventory for ${material_id}:`, fetchError);
          errors.push(`Failed to fetch inventory for ${material.material_name}: ${fetchError.message}`);
          continue;
        }

        const previousQuantity = currentInventory.quantity || 0;
        const newQuantity = previousQuantity + inventoryQuantity;

        console.log(`- Current inventory: ${previousQuantity}`);
        console.log(`- New inventory: ${newQuantity}`);

        // Calculate transport-adjusted price if transport charge exists
        let adjustedUnitPrice = unit_price;
        if (purchase.transport_charge > 0) {
          const transportAdjustment = await calculateTransportAdjustment(
            purchase,
            item,
            currentInventory.conversion_rate || 1
          );
          adjustedUnitPrice = unit_price + transportAdjustment;
          console.log(`- Transport adjustment: ${transportAdjustment}`);
          console.log(`- Adjusted unit price: ${adjustedUnitPrice}`);
        }

        // Update inventory with new quantity and adjusted price
        const { error: updateError } = await supabase
          .from("inventory")
          .update({
            quantity: newQuantity,
            purchase_price: adjustedUnitPrice,
            updated_at: new Date().toISOString()
          })
          .eq("id", material_id);

        if (updateError) {
          console.error(`Error updating inventory for ${material_id}:`, updateError);
          errors.push(`Failed to update inventory for ${material.material_name}: ${updateError.message}`);
          continue;
        }

        // Create inventory transaction log
        const { error: logError } = await supabase
          .from("inventory_transaction_log")
          .insert({
            material_id,
            transaction_type: "purchase",
            quantity: inventoryQuantity,
            previous_quantity: previousQuantity,
            new_quantity: newQuantity,
            reference_id: purchase.id,
            reference_number: purchase.purchase_number,
            reference_type: "Purchase",
            notes: `Purchase completion - used actual_meter: ${actual_meter > 0 ? actual_meter : 'N/A (fallback to quantity)'}`,
            metadata: {
              material_name: material.material_name,
              unit: material.unit,
              main_quantity: quantity,
              actual_meter: actual_meter,
              used_quantity: inventoryQuantity,
              unit_price: unit_price,
              adjusted_unit_price: adjustedUnitPrice,
              transport_charge: purchase.transport_charge,
              purchase_id: purchase.id,
              purchase_number: purchase.purchase_number
            }
          });

        if (logError) {
          console.error(`Error creating transaction log for ${material_id}:`, logError);
          errors.push(`Failed to create transaction log for ${material.material_name}: ${logError.message}`);
          // Continue processing other items even if log creation fails
        }

        // Store update details for local storage tracking
        try {
          localStorage.setItem('last_inventory_update', new Date().toISOString());
          
          const materialIds = JSON.parse(localStorage.getItem('updated_material_ids') || '[]');
          if (!materialIds.includes(material_id)) {
            materialIds.push(material_id);
            localStorage.setItem('updated_material_ids', JSON.stringify(materialIds));
          }
          
          localStorage.setItem(`material_update_${material_id}`, JSON.stringify({
            previous: previousQuantity,
            new: newQuantity,
            added: inventoryQuantity,
            timestamp: new Date().toISOString(),
            transactionSuccess: !logError,
            source: 'purchase_completion_actual_meter'
          }));
        } catch (e) {
          console.error("Error updating localStorage:", e);
        }

        updatedMaterials.push({
          id: material_id,
          name: material.material_name,
          previous: previousQuantity,
          new: newQuantity,
          added: inventoryQuantity,
          unit: material.unit,
          adjustedPrice: adjustedUnitPrice
        });

        console.log(`✓ Successfully updated ${material.material_name}`);

      } catch (itemError: any) {
        console.error(`Error processing item ${material_id}:`, itemError);
        errors.push(`Failed to process ${material.material_name}: ${itemError.message}`);
      }
    }

    console.log("========= PURCHASE COMPLETION SUMMARY =========");
    console.log(`Successfully updated: ${updatedMaterials.length} materials`);
    console.log(`Errors: ${errors.length}`);
    if (errors.length > 0) {
      console.log("Errors:", errors);
    }
    console.log("Updated materials:", updatedMaterials);

    return {
      success: updatedMaterials.length > 0,
      error: errors.length > 0 ? errors.join('; ') : undefined,
      updatedMaterials
    };

  } catch (error: any) {
    console.error("Error in completePurchaseWithActualMeter:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred during purchase completion"
    };
  }
};

/**
 * Calculate transport adjustment per unit for a purchase item
 */
async function calculateTransportAdjustment(
  purchase: PurchaseData,
  item: PurchaseItemWithActualMeter,
  conversionRate: number
): Promise<number> {
  try {
    // Calculate total weight of all items in the purchase
    let totalWeight = 0;
    for (const purchaseItem of purchase.purchase_items) {
      // Get conversion rate for each item
      const { data: inventoryData } = await supabase
        .from("inventory")
        .select("conversion_rate")
        .eq("id", purchaseItem.material_id)
        .single();
      
      const itemConversionRate = inventoryData?.conversion_rate || 1;
      const itemWeight = purchaseItem.quantity * itemConversionRate;
      totalWeight += itemWeight;
    }

    if (totalWeight <= 0) {
      return 0;
    }

    // Calculate per kg transport rate
    const perKgTransport = purchase.transport_charge / totalWeight;
    
    // Calculate this item's weight and transport share
    const itemWeight = item.quantity * conversionRate;
    const transportShare = itemWeight * perKgTransport;
    
    // Calculate transport adjustment per unit
    const transportPerUnit = transportShare / (item.quantity || 1);
    
    console.log(`Transport calculation for ${item.material_id}:`);
    console.log(`- Total weight: ${totalWeight}kg`);
    console.log(`- Per kg transport: ${perKgTransport}`);
    console.log(`- Item weight: ${itemWeight}kg`);
    console.log(`- Transport share: ${transportShare}`);
    console.log(`- Transport per unit: ${transportPerUnit}`);

    return transportPerUnit;

  } catch (error) {
    console.error("Error calculating transport adjustment:", error);
    return 0;
  }
}

/**
 * Reverse purchase completion (for status changes from completed to pending/cancelled)
 */
export const reversePurchaseCompletion = async (
  purchase: PurchaseData
): Promise<{ success: boolean; error?: string; revertedMaterials?: any[] }> => {
  try {
    console.log("========= REVERSING PURCHASE COMPLETION =========");
    console.log("Purchase ID:", purchase.id);

    const revertedMaterials: any[] = [];
    const errors: string[] = [];

    // Process each purchase item to reverse inventory changes
    for (const item of purchase.purchase_items) {
      const { material_id, actual_meter, quantity, material } = item;
      
      // Use actual_meter for inventory transaction if it's greater than 0, otherwise fall back to quantity
      const inventoryQuantity = actual_meter > 0 ? actual_meter : quantity;
      
      console.log(`Reversing ${material.material_name}: removing ${inventoryQuantity} units`);

      try {
        // Get current inventory quantity
        const { data: currentInventory, error: fetchError } = await supabase
          .from("inventory")
          .select("quantity, material_name")
          .eq("id", material_id)
          .single();

        if (fetchError) {
          console.error(`Error fetching inventory for ${material_id}:`, fetchError);
          errors.push(`Failed to fetch inventory for ${material.material_name}: ${fetchError.message}`);
          continue;
        }

        const previousQuantity = currentInventory.quantity || 0;
        const newQuantity = Math.max(0, previousQuantity - inventoryQuantity); // Prevent negative inventory

        // Update inventory quantity
        const { error: updateError } = await supabase
          .from("inventory")
          .update({
            quantity: newQuantity,
            updated_at: new Date().toISOString()
          })
          .eq("id", material_id);

        if (updateError) {
          console.error(`Error updating inventory for ${material_id}:`, updateError);
          errors.push(`Failed to update inventory for ${material.material_name}: ${updateError.message}`);
          continue;
        }

        // Create inventory transaction log for reversal
        const { error: logError } = await supabase
          .from("inventory_transaction_log")
          .insert({
            material_id,
            transaction_type: "purchase-reversal",
            quantity: -inventoryQuantity,
            previous_quantity: previousQuantity,
            new_quantity: newQuantity,
            reference_id: purchase.id,
            reference_number: purchase.purchase_number,
            reference_type: "Purchase",
            notes: `Purchase reversal - removed actual_meter: ${actual_meter > 0 ? actual_meter : 'N/A (fallback to quantity)'}`,
            metadata: {
              material_name: material.material_name,
              unit: material.unit,
              main_quantity: quantity,
              actual_meter: actual_meter,
              removed_quantity: inventoryQuantity,
              purchase_id: purchase.id,
              purchase_number: purchase.purchase_number,
              reversal: true
            }
          });

        if (logError) {
          console.error(`Error creating reversal transaction log for ${material_id}:`, logError);
          errors.push(`Failed to create reversal transaction log for ${material.material_name}: ${logError.message}`);
        }

        revertedMaterials.push({
          id: material_id,
          name: material.material_name,
          previous: previousQuantity,
          new: newQuantity,
          removed: inventoryQuantity,
          unit: material.unit
        });

        console.log(`✓ Successfully reverted ${material.material_name}`);

      } catch (itemError: any) {
        console.error(`Error reversing item ${material_id}:`, itemError);
        errors.push(`Failed to reverse ${material.material_name}: ${itemError.message}`);
      }
    }

    console.log("========= REVERSAL SUMMARY =========");
    console.log(`Successfully reverted: ${revertedMaterials.length} materials`);
    console.log(`Errors: ${errors.length}`);

    return {
      success: revertedMaterials.length > 0,
      error: errors.length > 0 ? errors.join('; ') : undefined,
      revertedMaterials
    };

  } catch (error: any) {
    console.error("Error in reversePurchaseCompletion:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred during purchase reversal"
    };
  }
};
