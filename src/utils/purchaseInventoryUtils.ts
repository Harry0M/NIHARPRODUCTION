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
  purchase_date?: string;
  transport_charge: number;
  purchase_items: PurchaseItemWithActualMeter[];
}

/**
 * Interface for updated material result
 */
interface UpdatedMaterial {
  id: string;
  name: string;
  previous: number;
  new: number;
  added: number;
  unit: string;
  adjustedPrice: number;
}

/**
 * Interface for reverted material result
 */
interface RevertedMaterial {
  id: string;
  name: string;
  previous: number;
  new: number;
  removed: number;
  unit: string;
}

/**
 * Handle purchase completion using actual_meter for inventory transactions
 * This replaces database triggers with TypeScript logic
 */
export const completePurchaseWithActualMeter = async (
  purchase: PurchaseData
): Promise<{ success: boolean; error?: string; updatedMaterials?: UpdatedMaterial[] }> => {
  try {
    console.log("========= STARTING PURCHASE COMPLETION WITH ACTUAL_METER =========");
    console.log("Purchase ID:", purchase.id);
    console.log("Purchase Number:", purchase.purchase_number);
    console.log("Transport Charge:", purchase.transport_charge);
    console.log("Purchase items:", purchase.purchase_items);

    const updatedMaterials: UpdatedMaterial[] = [];
    const errors: string[] = [];

    // Process each purchase item using actual_meter for inventory calculations
    for (const item of purchase.purchase_items) {
      const { material_id, actual_meter, quantity, unit_price, material } = item;
      
      console.log(`\n🔍 DEBUGGING ITEM: ${material.material_name}`);
      console.log(`- Material ID: ${material_id}`);
      console.log(`- Main Quantity: ${quantity}`);
      console.log(`- Actual Meter: ${actual_meter}`);
      console.log(`- Unit Price: ${unit_price}`);
      console.log(`- Transport Charge: ${purchase.transport_charge}`);

      // Use actual_meter for inventory transaction if it's greater than 0, otherwise fall back to quantity
      const inventoryQuantity = actual_meter > 0 ? actual_meter : quantity;
      
      console.log(`- Using ${inventoryQuantity} for inventory update (actual_meter logic)`);

      try {
        // Get current inventory quantity
        const { data: currentInventory, error: fetchError } = await supabase
          .from("inventory")
          .select("quantity, material_name, conversion_rate, purchase_rate")
          .eq("id", material_id)
          .single();

        if (fetchError) {
          console.error(`Error fetching inventory for ${material_id}:`, fetchError);
          errors.push(`Failed to fetch inventory for ${material.material_name}: ${fetchError.message}`);
          continue;
        }        console.log(`- Current inventory data:`, currentInventory);
        console.log(`- Current purchase_rate in inventory: ${currentInventory.purchase_rate}`);

        const previousQuantity = currentInventory.quantity || 0;
        const newQuantity = previousQuantity + inventoryQuantity;

        console.log(`- Current inventory: ${previousQuantity}`);        console.log(`- New inventory: ${newQuantity}`);

        // Use unit price directly as purchase rate (no transport calculation)
        const adjustedUnitPrice = unit_price;
        
        console.log(`\n💰 PURCHASE RATE UPDATE:`);
        console.log(`- Using unit_price directly as purchase_rate: ${unit_price}`);
        console.log(`- Rate change: ${currentInventory.purchase_rate} → ${unit_price} (difference: ${unit_price - currentInventory.purchase_rate})`);        console.log(`- Transport charge (${purchase.transport_charge}) will be handled separately, not added to unit price`);
        
        console.log(`\n💾 DATABASE UPDATE:`);
        console.log(`- Updating inventory table for material_id: ${material_id}`);
        console.log(`- Setting quantity: ${newQuantity}`);
        console.log(`- Setting purchase_rate: ${adjustedUnitPrice}`);
        console.log(`- Previous purchase_rate was: ${currentInventory.purchase_rate}`);
        
        // Update inventory with new quantity and adjusted price
        const { error: updateError } = await supabase
          .from("inventory")
          .update({
            quantity: newQuantity,
            purchase_rate: adjustedUnitPrice,
            updated_at: new Date().toISOString()
          })
          .eq("id", material_id);

        if (updateError) {
          console.error(`Error updating inventory for ${material_id}:`, updateError);
          errors.push(`Failed to update inventory for ${material.material_name}: ${updateError.message}`);
          continue;
        }
        
        console.log(`✅ Database update successful for ${material.material_name}!`);

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
            notes: `Purchase completion - used actual_meter: ${actual_meter > 0 ? actual_meter : 'N/A (fallback to quantity)'} - purchase_rate set to unit_price: ${unit_price}`,            metadata: {
              material_name: material.material_name,
              unit: material.unit,
              main_quantity: quantity,
              actual_meter: actual_meter,
              used_quantity: inventoryQuantity,
              unit_price: unit_price,
              adjusted_unit_price: adjustedUnitPrice,
              transport_charge: purchase.transport_charge,
              purchase_id: purchase.id,
              purchase_number: purchase.purchase_number,
              purchase_date: purchase.purchase_date || new Date().toISOString()
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

        console.log(`✓ Successfully updated ${material.material_name}`);      } catch (itemError: unknown) {
        console.error(`Error processing item ${material_id}:`, itemError);
        const errorMessage = itemError instanceof Error ? itemError.message : 'Unknown error';
        errors.push(`Failed to process ${material.material_name}: ${errorMessage}`);
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
  } catch (error: unknown) {
    console.error("Error in completePurchaseWithActualMeter:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during purchase completion';
    return {
      success: false,
      error: errorMessage
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
    console.log(`🚛 DETAILED TRANSPORT CALCULATION for item ${item.material_id}:`);
    console.log(`  - Item quantity: ${item.quantity}`);
    console.log(`  - Item conversion rate: ${conversionRate}`);
    console.log(`  - Purchase transport charge: ${purchase.transport_charge}`);
    
    // SAFETY CHECK: If transport charge is 0 or invalid, return 0
    if (!purchase.transport_charge || purchase.transport_charge <= 0) {
      console.log(`  - ⚠️  Transport charge is ${purchase.transport_charge}, returning 0 adjustment`);
      return 0;
    }
    
    // Calculate total weight of all items in the purchase
    let totalWeight = 0;
    console.log(`  - Calculating total weight for all items:`);
    
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
      
      console.log(`    * ${purchaseItem.material_id}: ${purchaseItem.quantity} × ${itemConversionRate} = ${itemWeight}kg`);
    }

    console.log(`  - Total purchase weight: ${totalWeight}kg`);

    if (totalWeight <= 0) {
      console.log(`  - ERROR: Total weight is ${totalWeight}, returning 0`);
      return 0;
    }

    // Calculate per kg transport rate
    const perKgTransport = purchase.transport_charge / totalWeight;
    console.log(`  - Per kg transport rate: ${purchase.transport_charge} ÷ ${totalWeight} = ${perKgTransport}`);
    
    // Calculate this item's weight and transport share
    const itemWeight = item.quantity * conversionRate;
    const transportShare = itemWeight * perKgTransport;
    
    // Calculate transport adjustment per unit
    const transportPerUnit = transportShare / (item.quantity || 1);
    
    console.log(`  - This item's weight: ${item.quantity} × ${conversionRate} = ${itemWeight}kg`);
    console.log(`  - This item's transport share: ${itemWeight} × ${perKgTransport} = ${transportShare}`);
    console.log(`  - Transport per unit: ${transportShare} ÷ ${item.quantity} = ${transportPerUnit}`);
    
    // VALIDATION: Check if transport per unit seems reasonable
    if (transportPerUnit > item.unit_price) {
      console.log(`  - ⚠️  WARNING: Transport per unit (${transportPerUnit}) is greater than unit price (${item.unit_price})`);
      console.log(`  - This might indicate an issue with conversion rates or calculation`);
    }
    
    // VALIDATION: Check if transport adjustment is too high (more than 50% of unit price)
    const percentageIncrease = (transportPerUnit / item.unit_price) * 100;
    console.log(`  - Transport adjustment is ${percentageIncrease.toFixed(2)}% of unit price`);
    
    if (percentageIncrease > 50) {
      console.log(`  - ⚠️  WARNING: Transport adjustment is ${percentageIncrease.toFixed(2)}% of unit price - this seems unusually high`);
    }

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
): Promise<{ success: boolean; error?: string; revertedMaterials?: RevertedMaterial[] }> => {
  try {
    console.log("========= REVERSING PURCHASE COMPLETION =========");
    console.log("Purchase ID:", purchase.id);

    const revertedMaterials: RevertedMaterial[] = [];
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
            notes: `Purchase reversal - removed actual_meter: ${actual_meter > 0 ? actual_meter : 'N/A (fallback to quantity)'}`,            metadata: {
              material_name: material.material_name,
              unit: material.unit,
              main_quantity: quantity,
              actual_meter: actual_meter,
              removed_quantity: inventoryQuantity,
              purchase_id: purchase.id,
              purchase_number: purchase.purchase_number,
              purchase_date: purchase.purchase_date || new Date().toISOString(),
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

        console.log(`✓ Successfully reverted ${material.material_name}`);      } catch (itemError: unknown) {
        console.error(`Error reversing item ${material_id}:`, itemError);
        const errorMessage = itemError instanceof Error ? itemError.message : 'Unknown error';
        errors.push(`Failed to reverse ${material.material_name}: ${errorMessage}`);
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
  } catch (error: unknown) {
    console.error("Error in reversePurchaseCompletion:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during purchase reversal';
    return {
      success: false,
      error: errorMessage
    };
  }
};
