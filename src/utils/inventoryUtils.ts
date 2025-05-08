
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
  
  components.forEach(component => {
    if (component.material_id && component.consumption) {
      const materialId = component.material_id;
      const consumption = typeof component.consumption === 'string' 
        ? parseFloat(component.consumption) 
        : component.consumption;
      
      if (!isNaN(consumption) && consumption > 0) {
        materialConsumption[materialId] = (materialConsumption[materialId] || 0) + consumption;
      }
    }
  });
  
  console.log("Calculated material consumption:", materialConsumption);
  
  // No materials to update
  if (Object.keys(materialConsumption).length === 0) {
    console.log("No materials with consumption found for inventory update");
    return { success: true, message: "No materials to update" };
  }
  
  const transactions = [];
  const inventoryUpdates = [];
  
  // Process each material
  for (const materialId of Object.keys(materialConsumption)) {
    const consumption = materialConsumption[materialId];
    
    // Get current material info
    const { data: materialData, error: materialError } = await supabase
      .from("inventory")
      .select("id, material_name, quantity, unit")
      .eq("id", materialId)
      .single();
    
    if (materialError) {
      console.error(`Error fetching material ${materialId}:`, materialError);
      continue;
    }
    
    console.log(`Current material ${materialData.material_name} quantity: ${materialData.quantity} ${materialData.unit}`);
    
    // Create negative transaction for material consumption
    transactions.push({
      material_id: materialId,
      inventory_id: materialId,
      quantity: -consumption, // Negative since we're consuming material
      transaction_type: "order",
      reference_id: orderId,
      reference_number: orderNumber,
      reference_type: "Order",
      notes: `Material used in order #${orderNumber}`,
      created_at: new Date().toISOString(), // Add created_at field explicitly 
      updated_at: new Date().toISOString() // Add updated_at field
    });
    
    // Update inventory quantity
    const newQuantity = Math.max(0, materialData.quantity - consumption);
    inventoryUpdates.push({
      id: materialId,
      quantity: newQuantity,
      updated_at: new Date().toISOString() // Add updated_at field to inventory update
    });
    
    console.log(`Updating ${materialData.material_name} quantity to ${newQuantity} ${materialData.unit} (consumed ${consumption})`);
  }
  
  // Record transactions
  if (transactions.length > 0) {
    console.log("Recording inventory transactions:", transactions);
    const { data: transactionData, error: transactionError } = await supabase
      .from("inventory_transactions")
      .insert(transactions)
      .select();
    
    if (transactionError) {
      console.error("Error recording inventory transactions:", transactionError);
      return { success: false, error: transactionError };
    }
    
    console.log("Successfully recorded inventory transactions:", transactionData);
  }
  
  // Update inventory quantities
  for (const update of inventoryUpdates) {
    const { error: updateError } = await supabase
      .from("inventory")
      .update({ quantity: update.quantity, updated_at: update.updated_at })
      .eq("id", update.id);
    
    if (updateError) {
      console.error(`Error updating inventory ${update.id}:`, updateError);
      return { success: false, error: updateError };
    }
    
    console.log(`Successfully updated inventory ${update.id} to quantity ${update.quantity}`);
  }
  
  return { 
    success: true, 
    message: `Updated inventory for ${inventoryUpdates.length} materials`
  };
};
