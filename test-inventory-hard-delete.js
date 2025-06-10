/**
 * Test script for Inventory Hard Delete with Consumption Preservation
 * 
 * This script tests the complete flow of:
 * 1. Previewing what will be deleted vs preserved
 * 2. Performing hard deletion while preserving consumption transactions
 * 3. Verifying that inventory is completely removed but consumption history is kept
 * 
 * Run this in the browser console while on the inventory page.
 */

console.log("🧪 INVENTORY HARD DELETE TEST LOADED");
console.log("=====================================");

// Test the inventory hard delete functionality
window.testInventoryHardDelete = async function() {
  console.log("\n🚀 STARTING INVENTORY HARD DELETE TEST");
  console.log("======================================");
  
  try {
    // Get supabase client
    const { supabase } = window;
    if (!supabase) {
      console.error("❌ Supabase client not available");
      return;
    }
    
    console.log("✓ Supabase client available");
    
    // Step 1: Get an inventory item to test with
    const { data: inventoryItems, error: inventoryError } = await supabase
      .from('inventory')
      .select('id, material_name, quantity, unit')
      .limit(5);
      
    if (inventoryError) {
      console.error("❌ Error fetching inventory items:", inventoryError);
      return;
    }
    
    if (!inventoryItems || inventoryItems.length === 0) {
      console.log("⚠️ No inventory items found for testing");
      return;
    }
    
    console.log("✓ Found inventory items for testing:");
    inventoryItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.material_name} - ${item.quantity} ${item.unit} (ID: ${item.id})`);
    });
    
    // Use the first item for testing
    const testItem = inventoryItems[0];
    console.log(`\n📝 Using test item: ${testItem.material_name} (ID: ${testItem.id})`);
    
    // Step 2: Get deletion preview
    console.log("\n🔍 STEP 1: Getting deletion preview...");
    const { data: preview, error: previewError } = await supabase
      .rpc('preview_inventory_hard_deletion', {
        input_inventory_id: testItem.id
      });
      
    if (previewError) {
      console.error("❌ Error getting deletion preview:", previewError);
      return;
    }
    
    console.log("✅ Deletion Preview:");
    console.log("Material:", preview.material_name);
    console.log("Summary:", preview.summary);
    console.log("\n📊 What will be deleted:");
    console.log("- Inventory item:", preview.deletion_preview.will_be_deleted.inventory_item);
    console.log("- Non-consumption transactions:", preview.deletion_preview.will_be_deleted.non_consumption_transactions);
    console.log("- Catalog material references:", preview.deletion_preview.will_be_deleted.catalog_material_references);
    
    console.log("\n🛡️ What will be preserved:");
    console.log("- Consumption transactions:", preview.deletion_preview.will_be_preserved.consumption_transactions);
    console.log("- Purchase history:", preview.deletion_preview.will_be_preserved.purchase_history);
    console.log("- Order history:", preview.deletion_preview.will_be_preserved.order_history);
    
    console.log("\n🔧 What will be modified:");
    console.log("- Purchase items losing material ref:", preview.deletion_preview.will_be_modified.purchase_items_lose_material_ref);
    console.log("- Order components losing material ref:", preview.deletion_preview.will_be_modified.order_components_lose_material_ref);
    
    // Step 3: Check current transaction logs
    console.log("\n📜 STEP 2: Checking current transaction logs...");
    const { data: currentLogs, error: logsError } = await supabase
      .from('inventory_transaction_log')
      .select(`
        id,
        transaction_type,
        quantity,
        transaction_date,
        notes
      `)
      .eq('material_id', testItem.id)
      .order('transaction_date', { ascending: false })
      .limit(10);
      
    if (logsError) {
      console.error("❌ Error fetching transaction logs:", logsError);
    } else {
      console.log(`✓ Found ${currentLogs?.length || 0} transaction logs before deletion:`);
      currentLogs?.forEach((log, index) => {
        console.log(`${index + 1}. ${log.transaction_type}: ${log.quantity} (${new Date(log.transaction_date).toLocaleString()})`);
      });
    }
    
    console.log("\n⚠️ READY FOR HARD DELETE TEST");
    console.log("================================");
    console.log("To proceed with the actual deletion, run:");
    console.log(`performInventoryHardDelete('${testItem.id}', '${testItem.material_name}');`);
    console.log("\n⚠️ WARNING: This will permanently delete the inventory item!");
    console.log("Only consumption transactions will be preserved.");
    
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
};

// Function to actually perform the hard delete (separate for safety)
window.performInventoryHardDelete = async function(inventoryId, materialName) {
  console.log(`\n🚨 PERFORMING HARD DELETE FOR: ${materialName}`);
  console.log("==============================================");
  
  try {
    const { supabase } = window;
    
    // Perform the hard delete
    const { data: deleteResult, error: deleteError } = await supabase
      .rpc('hard_delete_inventory_with_consumption_preserve', {
        input_inventory_id: inventoryId
      });
      
    if (deleteError) {
      console.error("❌ Error performing hard delete:", deleteError);
      return;
    }
    
    console.log("✅ Hard delete completed successfully!");
    console.log("Result:", deleteResult);
    console.log("\n📊 Deletion Summary:");
    console.log("- Material:", deleteResult.material_name);
    console.log("- Deletion type:", deleteResult.deletion_type);
    console.log("- Transactions deleted:", deleteResult.transactions_deleted);
    console.log("- Consumption transactions preserved:", deleteResult.consumption_transactions_preserved);
    console.log("- Message:", deleteResult.message);
    
    // Verify the inventory item is gone
    console.log("\n🔍 Verifying inventory item deletion...");
    const { data: verifyInventory, error: verifyError } = await supabase
      .from('inventory')
      .select('id')
      .eq('id', inventoryId)
      .maybeSingle();
      
    if (verifyError) {
      console.error("❌ Error verifying deletion:", verifyError);
    } else if (verifyInventory) {
      console.log("⚠️ WARNING: Inventory item still exists after deletion!");
    } else {
      console.log("✅ Inventory item successfully removed from database");
    }
    
    // Check remaining consumption transactions
    console.log("\n📜 Checking remaining consumption transactions...");
    const { data: remainingLogs, error: remainingError } = await supabase
      .from('inventory_transaction_log')
      .select(`
        id,
        transaction_type,
        quantity,
        transaction_date,
        notes
      `)
      .eq('material_id', inventoryId)
      .eq('transaction_type', 'consumption')
      .order('transaction_date', { ascending: false });
      
    if (remainingError) {
      console.error("❌ Error checking remaining logs:", remainingError);
    } else {
      console.log(`✅ Found ${remainingLogs?.length || 0} preserved consumption transactions:`);
      remainingLogs?.forEach((log, index) => {
        console.log(`${index + 1}. ${log.transaction_type}: ${log.quantity} (${new Date(log.transaction_date).toLocaleString()})`);
        if (log.notes) {
          console.log(`   Notes: ${log.notes}`);
        }
      });
    }
    
    console.log("\n🎉 HARD DELETE TEST COMPLETED SUCCESSFULLY!");
    console.log("===========================================");
    
  } catch (error) {
    console.error("❌ Hard delete failed with error:", error);
  }
};

// Helper function to test both functions
window.testInventoryHardDeleteComplete = async function() {
  console.log("\n🚀 RUNNING COMPLETE INVENTORY HARD DELETE TEST");
  console.log("===============================================");
  
  // First run the preview test
  await testInventoryHardDelete();
  
  console.log("\n⏳ Waiting 3 seconds before proceeding...");
  setTimeout(() => {
    console.log("\n💡 To complete the test, you can manually run:");
    console.log("performInventoryHardDelete('inventory-id-here', 'material-name-here');");
    console.log("\nOr run the functions individually:");
    console.log("- testInventoryHardDelete() - Preview only");
    console.log("- performInventoryHardDelete(id, name) - Actual deletion");
  }, 3000);
};

console.log("\n🛠️ AVAILABLE TEST FUNCTIONS:");
console.log("- testInventoryHardDelete() - Preview deletion impact");
console.log("- performInventoryHardDelete(id, name) - Perform hard deletion");
console.log("- testInventoryHardDeleteComplete() - Complete test flow");

console.log("\n🚀 QUICK START:");
console.log("Run: testInventoryHardDelete()");
