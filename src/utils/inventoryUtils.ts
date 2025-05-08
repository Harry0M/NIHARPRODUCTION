
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
 * Create a single inventory transaction with error handling
 */
export const createInventoryTransaction = async (
  supabase: any,
  transaction: {
    material_id: string;
    quantity: number;
    transaction_type: string;
    reference_id?: string | null;
    reference_number?: string | null;
    reference_type?: string | null;
    notes?: string | null;
    unit_price?: number | null;
    roll_width?: number | null;
  }
) => {
  console.log("Creating inventory transaction:", transaction);
  
  if (!transaction.material_id) {
    console.error("Cannot create transaction: Missing material_id");
    return { error: "Missing material_id", success: false };
  }
  
  if (transaction.quantity === undefined || transaction.quantity === null) {
    console.error("Cannot create transaction: Missing quantity");
    return { error: "Missing quantity", success: false };
  }
  
  try {
    const timestamp = new Date().toISOString();
    
    const transactionData = {
      material_id: transaction.material_id,
      inventory_id: transaction.material_id, // Set inventory_id to match material_id
      quantity: transaction.quantity,
      transaction_type: transaction.transaction_type,
      reference_id: transaction.reference_id || null,
      reference_number: transaction.reference_number || null,
      reference_type: transaction.reference_type || null,
      notes: transaction.notes || null,
      unit_price: transaction.unit_price || null,
      roll_width: transaction.roll_width || null,
      created_at: timestamp,
      updated_at: timestamp
    };
    
    // Insert the transaction with detailed error handling
    const { data, error } = await supabase
      .from("inventory_transactions")
      .insert(transactionData)
      .select();
    
    if (error) {
      console.error("Error creating inventory transaction:", error);
      console.error("Failed transaction data:", transactionData);
      
      // Log more details about the error for debugging
      if (error.code === '42501') {
        console.error("Permission denied error. This could be an RLS policy issue.");
      } else if (error.code === '23505') {
        console.error("Unique constraint violation. This transaction may already exist.");
      }
      
      return { 
        error: error.message || "Failed to create transaction", 
        code: error.code,
        success: false 
      };
    }
    
    console.log("Transaction created successfully:", data);
    return { data, success: true };
  } catch (err: any) {
    console.error("Unexpected error creating transaction:", err);
    return { error: err.message || "Unexpected error", success: false };
  }
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
  const transactionResults = [];
  
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
      
      // Create negative transaction for material consumption with improved error handling
      const transactionResult = await createInventoryTransaction(supabase, {
        material_id: materialId,
        quantity: -consumption, // Negative since we're consuming material
        transaction_type: "order",
        reference_id: orderId,
        reference_number: orderNumber,
        reference_type: "Order",
        notes: `Material used in order #${orderNumber}`
      });
      
      transactionResults.push(transactionResult);
      
      if (!transactionResult.success) {
        console.error(`Error creating transaction for material ${materialId}:`, transactionResult.error);
        errors.push(`Error creating transaction: ${transactionResult.error}`);
      } else {
        console.log(`Successfully created transaction for material ${materialId}`);
        transactions.push(transactionResult.data);
      }
      
      // Update inventory quantity regardless of transaction success
      // This ensures inventory is accurate even if transaction logging fails
      const timestamp = new Date().toISOString();
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
    } catch (err: any) {
      console.error(`Error processing material ${materialId}:`, err);
      errors.push(`Error processing material ${materialId}: ${err.message}`);
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
          consumed: material.consumed,
          transactionSuccess: transactionResults.some(tr => tr.success)
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
  
  // If there were transaction errors but inventory updates succeeded, include that in the message
  if (transactionResults.some(result => !result.success) && updatedMaterials.length > 0) {
    summaryMessage += ". Note: Some transaction records might not be visible immediately.";
  }
  
  if (errors.length > 0) {
    return { 
      success: false, 
      message: `${summaryMessage} with ${errors.length} errors. Check console for details.`,
      errors,
      updatedMaterials,
      transactionResults
    };
  }
  
  return { 
    success: true, 
    message: summaryMessage,
    updatedMaterials,
    transactionResults
  };
};

/**
 * Helper function to manually create an inventory transaction
 * This can be used for testing or manually creating transactions
 */
export const manuallyCreateInventoryTransaction = async (
  supabase: any,
  materialId: string, 
  quantity: number,
  transactionType: string = 'adjustment',
  notes: string = 'Manual adjustment'
) => {
  if (!materialId) {
    console.error("Cannot create transaction: Missing material ID");
    return { success: false, error: "Missing material ID" };
  }

  try {
    // First get the current material info for validation
    const { data: materialData, error: materialError } = await supabase
      .from("inventory")
      .select("id, material_name, quantity, unit")
      .eq("id", materialId)
      .single();
    
    if (materialError) {
      console.error("Error fetching material:", materialError);
      return { success: false, error: materialError.message };
    }
    
    if (!materialData) {
      return { success: false, error: "Material not found" };
    }

    // Create the transaction
    const result = await createInventoryTransaction(supabase, {
      material_id: materialId,
      quantity: quantity,
      transaction_type: transactionType,
      notes: notes
    });
    
    if (!result.success) {
      return result;
    }
    
    // Update inventory quantity if needed
    if (transactionType !== 'view') {  // 'view' type doesn't affect quantity
      const newQuantity = materialData.quantity + quantity;
      
      const { error: updateError } = await supabase
        .from("inventory")
        .update({ 
          quantity: Math.max(0, newQuantity),  // Prevent negative quantities
          updated_at: new Date().toISOString() 
        })
        .eq("id", materialId);
      
      if (updateError) {
        console.error("Error updating inventory quantity:", updateError);
        return { success: false, error: updateError.message, transactionCreated: true };
      }

      // Trigger storage event to notify other components
      try {
        localStorage.setItem('updated_material_ids', JSON.stringify([materialId]));
        localStorage.setItem('last_inventory_update', new Date().toISOString());
        localStorage.setItem(`material_update_${materialId}`, JSON.stringify({
          timestamp: new Date().toISOString(),
          previous: materialData.quantity,
          new: newQuantity,
          adjusted: quantity,
          transactionSuccess: true
        }));
        
        // Create and dispatch a storage event
        const storageEvent = new StorageEvent('storage', {
          key: 'last_inventory_update',
          newValue: new Date().toISOString(),
          url: window.location.href
        });
        window.dispatchEvent(storageEvent);
      } catch (e) {
        console.warn("Could not dispatch storage event:", e);
      }
    }
    
    return { 
      success: true, 
      message: `${transactionType === 'purchase' ? 'Added' : 'Adjusted'} ${Math.abs(quantity)} ${materialData.unit} for ${materialData.material_name}`,
      transaction: result.data
    };
  } catch (err: any) {
    console.error("Unexpected error in manuallyCreateInventoryTransaction:", err);
    return { success: false, error: err.message || "Unexpected error" };
  }
};
