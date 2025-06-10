/**
 * Test Hard Delete After Constraint Fix
 * 
 * Tests the inventory hard delete functionality after fixing the
 * purchase_items.material_id constraint issue.
 */

console.log("🔧 TESTING HARD DELETE AFTER CONSTRAINT FIX");
console.log("============================================");

window.testFixedHardDelete = async function() {
  try {
    const { supabase } = window;
    if (!supabase) {
      console.error("❌ Supabase not available");
      return;
    }
    
    console.log("✅ Supabase client available");
    
    // Get an inventory item to test with
    const { data: items, error } = await supabase
      .from('inventory')
      .select('id, material_name, quantity')
      .limit(3);
      
    if (error || !items || items.length === 0) {
      console.log("⚠️ No inventory items found");
      return;
    }
    
    console.log("📦 Available test items:");
    items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.material_name} (ID: ${item.id}) - Qty: ${item.quantity}`);
    });
    
    const testItem = items[0];
    console.log(`\n🎯 Testing with: ${testItem.material_name}`);
    
    // Test preview first
    console.log("\n1️⃣ Testing deletion preview...");
    const { data: preview, error: previewError } = await supabase.rpc(
      'preview_inventory_hard_deletion', 
      { input_inventory_id: testItem.id }
    );
    
    if (previewError) {
      console.error("❌ Preview failed:", previewError);
      return;
    }
    
    console.log("✅ Preview successful:");
    console.log("📊 Deletion Preview:");
    console.log("  Will be deleted:", preview.deletion_preview.will_be_deleted);
    console.log("  Will be preserved:", preview.deletion_preview.will_be_preserved);
    console.log("  Will be modified:", preview.deletion_preview.will_be_modified);
    console.log("📝 Summary:", preview.summary);
    
    // Check if item has any purchase history that would be affected
    if (preview.deletion_preview.will_be_modified.purchase_items_lose_material_ref > 0) {
      console.log("\n💡 This item has purchase references that will be set to NULL");
      console.log("   This should work now that we've fixed the constraint!");
    }
    
    // Only proceed with actual deletion if explicitly requested
    console.log("\n⚠️ To test actual deletion, call testActualHardDelete()");
    console.log("   (This will permanently delete the inventory item)");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
};

window.testActualHardDelete = async function() {
  try {
    const { supabase } = window;
    
    // Get a test item
    const { data: items } = await supabase
      .from('inventory')
      .select('id, material_name')
      .limit(1);
      
    if (!items || items.length === 0) {
      console.log("⚠️ No items to test with");
      return;
    }
    
    const testItem = items[0];
    console.log(`🚨 WARNING: About to hard delete "${testItem.material_name}"`);
    console.log("⏰ Waiting 3 seconds... Press Ctrl+C to cancel");
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log("\n🗑️ Performing hard delete...");
    const { data: result, error: deleteError } = await supabase.rpc(
      'hard_delete_inventory_with_consumption_preserve', 
      { input_inventory_id: testItem.id }
    );
    
    if (deleteError) {
      console.error("❌ Hard delete failed:", deleteError);
      return;
    }
    
    console.log("✅ Hard delete successful!");
    console.log("📋 Result:", result.message);
    
  } catch (error) {
    console.error("❌ Actual delete test failed:", error);
  }
};

console.log("\n📝 Usage:");
console.log("- Run testFixedHardDelete() to test preview (safe)");
console.log("- Run testActualHardDelete() to test actual deletion (destructive)");
