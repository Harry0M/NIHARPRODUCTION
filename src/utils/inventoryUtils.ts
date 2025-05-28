
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/components/ui/enhanced-toast";

/**
 * Creates a manual inventory transaction
 */
export const manuallyCreateInventoryTransaction = async (
  supabaseClient: any,
  materialId: string,
  quantity: number,
  transactionType: string,
  notes: string | null = null
) => {
  try {
    // Get current quantity
    const { data: materialData, error: materialError } = await supabaseClient
      .from("inventory")
      .select("quantity, material_name, unit")
      .eq("id", materialId)
      .single();
    
    if (materialError) throw materialError;
    
    if (!materialData) {
      return {
        success: false,
        error: "Material not found"
      };
    }
    
    const currentQuantity = materialData.quantity;
    const newQuantity = currentQuantity + quantity;
    
    // Create transaction log entry
    const { data: logEntry, error: logError } = await supabaseClient
      .from("inventory_transaction_log")
      .insert({
        material_id: materialId,
        transaction_type: transactionType,
        quantity: quantity,
        previous_quantity: currentQuantity,
        new_quantity: newQuantity,
        notes: notes || `Manual ${transactionType} transaction`,
        metadata: {
          material_name: materialData.material_name,
          unit: materialData.unit,
          manual: true
        }
      })
      .select()
      .single();
      
    if (logError) throw logError;
    
    // Create compatible inventory_transactions entry
    const { data: txData, error: txError } = await supabaseClient
      .from("inventory_transactions")
      .insert({
        material_id: materialId,
        inventory_id: materialId,
        transaction_type: transactionType,
        quantity: quantity,
        notes: notes || `Manual ${transactionType} transaction`,
        unit: materialData.unit
      });
      
    if (txError) throw txError;
    
    // Update inventory quantity
    if (quantity !== 0) {
      const { error: updateError } = await supabaseClient
        .from("inventory")
        .update({ 
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq("id", materialId);
        
      if (updateError) throw updateError;
      
      // Store update in localStorage for monitoring
      try {
        localStorage.setItem('last_inventory_update', new Date().toISOString());
        
        const materialIds = JSON.parse(localStorage.getItem('updated_material_ids') || '[]');
        if (!materialIds.includes(materialId)) {
          materialIds.push(materialId);
          localStorage.setItem('updated_material_ids', JSON.stringify(materialIds));
        }
        
        // Store specific update details
        localStorage.setItem(`material_update_${materialId}`, JSON.stringify({
          previous: currentQuantity,
          new: newQuantity,
          consumed: quantity < 0 ? Math.abs(quantity) : null,
          timestamp: new Date().toISOString(),
          transactionSuccess: true
        }));
      } catch (e) {
        console.error("Error updating localStorage:", e);
      }
    }
    
    return {
      success: true,
      data: {
        logEntry,
        newQuantity
      }
    };
  } catch (error: any) {
    console.error("Error creating inventory transaction:", error);
    
    // Try to log the failure in localStorage
    try {
      localStorage.setItem(`material_update_${materialId}`, JSON.stringify({
        timestamp: new Date().toISOString(),
        transactionSuccess: false,
        error: error.message
      }));
    } catch (e) {
      console.error("Error updating localStorage:", e);
    }
    
    return {
      success: false,
      error: error.message || "An unexpected error occurred"
    };
  }
};

/**
 * Record material usage for an order
 */
export const recordOrderMaterialUsage = async (
  orderId: string,
  orderNumber: string,
  materialId: string,
  quantity: number,
  notes: string | null = null
) => {
  try {
    const { data, error } = await supabase.rpc(
      'record_order_material_usage',
      {
        p_order_id: orderId,
        p_order_number: orderNumber,
        p_material_id: materialId,
        p_quantity: quantity,
        p_notes: notes
      }
    );
    
    if (error) throw error;
    
    return {
      success: true
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

/**
 * Update inventory for order components
 */
export const updateInventoryForOrderComponents = async (
  supabaseClient: any,
  orderId: string,
  orderNumber: string,
  components: any[]
) => {
  try {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    const updatedMaterials: any[] = [];
    
    // Process each component with a material_id
    for (const component of components) {
      if (!component.material_id || !component.consumption) {
        continue; // Skip components without material or consumption value
      }
      
      const materialId = component.material_id;
      const consumption = parseFloat(component.consumption);
      
      if (isNaN(consumption) || consumption <= 0) {
        continue; // Skip invalid consumption values
      }
      
      // Get current material data
      const { data: materialData, error: materialError } = await supabaseClient
        .from("inventory")
        .select("id, material_name, quantity, unit")
        .eq("id", materialId)
        .single();
        
      if (materialError) {
        console.error(`Error fetching material ${materialId}:`, materialError);
        errors.push(`Failed to fetch material ${materialId}: ${materialError.message}`);
        errorCount++;
        continue;
      }
      
      const previousQuantity = materialData.quantity;
      // Allow negative inventory to track over-consumption
      const newQuantity = previousQuantity - consumption;
      
      // Call the RPC function to record the usage
      const { error: rpcError } = await supabaseClient.rpc(
        'record_order_material_usage',
        {
          p_order_id: orderId,
          p_order_number: orderNumber,
          p_material_id: materialId,
          p_quantity: consumption,
          p_notes: `Material used for ${component.component_type} component`
        }
      );
      
      if (rpcError) {
        console.error(`Error recording material usage for ${materialId}:`, rpcError);
        errors.push(`Failed to record usage for ${materialData.material_name}: ${rpcError.message}`);
        errorCount++;
      } else {
        successCount++;
        updatedMaterials.push({
          id: materialId,
          name: materialData.material_name,
          previous: previousQuantity,
          new: newQuantity,
          consumed: consumption,
          unit: materialData.unit
        });
      }
    }
    
    return {
      success: successCount > 0,
      message: `Updated ${successCount} material(s)${errorCount > 0 ? ` with ${errorCount} error(s)` : ''}`,
      errors: errors.length > 0 ? errors : null,
      updatedMaterials
    };
  } catch (error: any) {
    console.error("Error updating inventory for order components:", error);
    return {
      success: false,
      message: "Failed to update inventory",
      errors: [error.message || "An unexpected error occurred"]
    };
  }
};
