
/**
 * Calculates consumption for a component based on dimensions and quantity
 */
export const calculateConsumption = (
  length: number,
  width: number,
  rollWidth: number,
  quantity: number = 1
): number => {
  if (!length || !width || !rollWidth) return 0;
  
  // Formula: (length * width) / (roll_width * 39.37) * quantity
  // 39.37 is the conversion factor from inches to meters
  const consumption = (length * width) / (rollWidth * 39.37) * quantity;
  return Number(consumption.toFixed(4));
};

/**
 * Updates inventory based on material consumption
 */
export const updateInventoryForOrderComponents = async (
  supabase: any,
  orderId: string,
  orderNumber: string,
  components: any[]
) => {
  console.log(`Updating inventory for order ${orderNumber}`, components);
  
  // Group components by material_id and sum up their consumption
  const materialConsumption: Record<string, number> = {};
  
  // Log initial component data for debugging
  components.forEach((component, index) => {
    console.log(`Component ${index + 1}:`, {
      type: component.component_type,
      materialId: component.material_id,
      consumption: component.consumption,
      valid: !!component.material_id && !!component.consumption
    });
  });
  
  // Filter components with both material_id and consumption > 0
  const validComponents = components.filter(component => {
    const hasValidMaterialId = !!component.material_id;
    const consumption = typeof component.consumption === 'string' 
      ? parseFloat(component.consumption) 
      : component.consumption;
    const hasValidConsumption = !isNaN(consumption) && consumption > 0;
    
    if (!hasValidMaterialId) {
      console.warn(`Component missing material_id:`, component);
    }
    if (!hasValidConsumption) {
      console.warn(`Component has invalid consumption:`, component);
    }
    
    return hasValidMaterialId && hasValidConsumption;
  });
  
  console.log(`Found ${validComponents.length} of ${components.length} components with valid material_id and consumption`);
  
  // Calculate total consumption per material
  validComponents.forEach(component => {
    const materialId = component.material_id;
    const consumption = typeof component.consumption === 'string' 
      ? parseFloat(component.consumption) 
      : component.consumption;
    
    materialConsumption[materialId] = (materialConsumption[materialId] || 0) + consumption;
  });
  
  console.log("Calculated material consumption:", materialConsumption);
  
  // No materials to update
  if (Object.keys(materialConsumption).length === 0) {
    console.warn("No materials with consumption found for inventory update");
    return { success: true, message: "No materials to update" };
  }
  
  const transactions = [];
  const inventoryUpdates = [];
  const errors = [];
  const updatedMaterials = [];
  
  // Process each material
  for (const materialId of Object.keys(materialConsumption)) {
    const consumption = materialConsumption[materialId];
    
    try {
      // Get current material info
      const { data: materialData, error: materialError } = await supabase
        .from("inventory")
        .select("id, material_name, quantity, unit")
        .eq("id", materialId)
        .single();
      
      if (materialError) {
        console.error(`Error fetching material ${materialId}:`, materialError);
        errors.push(`Error fetching material ${materialId}: ${materialError.message}`);
        continue;
      }
      
      if (!materialData) {
        console.error(`Material ${materialId} not found in inventory`);
        errors.push(`Material ${materialId} not found in inventory`);
        continue;
      }
      
      console.log(`Current material ${materialData.material_name} quantity: ${materialData.quantity} ${materialData.unit}`);
      
      const timestamp = new Date().toISOString();
      
      // Create negative transaction for material consumption
      const transaction = {
        material_id: materialId,
        inventory_id: materialId, // Ensure the inventory_id field is set
        quantity: -consumption, // Negative since we're consuming material
        transaction_type: "order",
        reference_id: orderId,
        reference_number: orderNumber,
        reference_type: "Order",
        notes: `Material used in order #${orderNumber}`,
        created_at: timestamp,
        updated_at: timestamp // Ensure the updated_at field is set
      };
      
      transactions.push(transaction);
      console.log(`Creating transaction for ${materialData.material_name}:`, transaction);
      
      // Update inventory quantity
      const newQuantity = Math.max(0, materialData.quantity - consumption);
      inventoryUpdates.push({
        id: materialId,
        quantity: newQuantity,
        updated_at: timestamp
      });
      
      updatedMaterials.push({
        id: materialId,
        name: materialData.material_name,
        previous: materialData.quantity,
        new: newQuantity,
        unit: materialData.unit,
        consumed: consumption
      });
      
      console.log(`Updating ${materialData.material_name} quantity to ${newQuantity} ${materialData.unit} (consumed ${consumption})`);
    } catch (err) {
      console.error(`Error processing material ${materialId}:`, err);
      errors.push(`Error processing material ${materialId}: ${err}`);
    }
  }
  
  // Record transactions - use single insert for better atomicity
  if (transactions.length > 0) {
    console.log("Recording inventory transactions:", transactions);
    try {
      const { data: transactionData, error: transactionError } = await supabase
        .from("inventory_transactions")
        .insert(transactions)
        .select();
      
      if (transactionError) {
        console.error("Error recording inventory transactions:", transactionError);
        errors.push(`Error recording inventory transactions: ${transactionError.message}`);
      } else {
        console.log("Successfully recorded inventory transactions:", transactionData);
      }
    } catch (err: any) {
      console.error("Error inserting transactions:", err);
      errors.push(`Error inserting transactions: ${err.message}`);
    }
  }
  
  // Update inventory quantities - do all updates in sequence
  for (const update of inventoryUpdates) {
    try {
      const { error: updateError } = await supabase
        .from("inventory")
        .update({ quantity: update.quantity, updated_at: update.updated_at })
        .eq("id", update.id);
      
      if (updateError) {
        console.error(`Error updating inventory ${update.id}:`, updateError);
        errors.push(`Error updating inventory ${update.id}: ${updateError.message}`);
      } else {
        console.log(`Successfully updated inventory ${update.id} to quantity ${update.quantity}`);
      }
    } catch (err: any) {
      console.error(`Error updating inventory ${update.id}:`, err);
      errors.push(`Error updating inventory ${update.id}: ${err.message}`);
    }
  }
  
  // Store updated material IDs in localStorage for other components to detect
  if (updatedMaterials.length > 0) {
    try {
      // Store updated material IDs and timestamp
      const materialIds = updatedMaterials.map(m => m.id);
      localStorage.setItem('updated_material_ids', JSON.stringify(materialIds));
      localStorage.setItem('last_inventory_update', new Date().toISOString());
      
      // Also store individual material details for more specific updates
      for (const material of updatedMaterials) {
        localStorage.setItem(`material_update_${material.id}`, JSON.stringify({
          timestamp: new Date().toISOString(),
          previous: material.previous,
          new: material.new,
          consumed: material.consumed
        }));
      }
      
      // Add a debugging log to check localStorage after setting
      console.log("Updated localStorage with material IDs:", {
        materialIds,
        timestamp: new Date().toISOString()
      });
      
      // Manually trigger a storage event for components in the same window
      try {
        // Create and dispatch a fake storage event
        const storageEvent = new StorageEvent('storage', {
          key: 'last_inventory_update',
          newValue: new Date().toISOString(),
          url: window.location.href
        });
        window.dispatchEvent(storageEvent);
        console.log("Dispatched storage event to notify other components");
      } catch (e) {
        console.warn("Could not dispatch storage event:", e);
      }
    } catch (err) {
      console.warn("Could not store updated material IDs in localStorage:", err);
    }
  }
  
  // Prepare summary message for toast
  let summaryMessage = "Updated inventory for ";
  if (updatedMaterials.length > 0) {
    if (updatedMaterials.length === 1) {
      const material = updatedMaterials[0];
      summaryMessage += `${material.name} (${material.consumed.toFixed(2)} ${material.unit})`;
    } else {
      summaryMessage += `${updatedMaterials.length} materials`;
    }
  } else {
    summaryMessage = "No inventory updated";
  }
  
  if (errors.length > 0) {
    return { 
      success: false, 
      message: `${summaryMessage} with ${errors.length} errors. Check console for details.`,
      errors,
      updatedMaterials
    };
  }
  
  return { 
    success: true, 
    message: summaryMessage,
    updatedMaterials
  };
};
