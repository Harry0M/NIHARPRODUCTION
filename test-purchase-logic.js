/**
 * Test script for purchase completion logic
 * This tests our completePurchaseWithActualMeter function
 */

import { createClient } from '@supabase/supabase-js';

// These would normally come from environment variables
const supabaseUrl = 'http://localhost:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test purchase completion logic
async function testPurchaseCompletion() {
  console.log("=== TESTING PURCHASE COMPLETION LOGIC ===");
  
  try {
    // 1. First, let's check what purchases exist
    const { data: purchases, error: purchaseError } = await supabase
      .from('purchases')
      .select(`
        id,
        purchase_number,
        status,
        transport_charge,
        purchase_items (
          id,
          material_id,
          quantity,
          unit_price,
          actual_meter,
          material:inventory (
            id,
            material_name,
            unit,
            conversion_rate,
            quantity,
            purchase_price
          )
        )
      `)
      .limit(5);
      
    if (purchaseError) {
      console.error("Error fetching purchases:", purchaseError);
      return;
    }
    
    console.log(`Found ${purchases?.length || 0} purchases`);
    
    if (purchases && purchases.length > 0) {
      const testPurchase = purchases.find(p => p.status !== 'completed');
      
      if (testPurchase) {
        console.log(`\nTesting with purchase: ${testPurchase.purchase_number}`);
        console.log("Purchase data:", JSON.stringify(testPurchase, null, 2));
        
        // Check current inventory before completion
        console.log("\n=== BEFORE COMPLETION ===");
        for (const item of testPurchase.purchase_items) {
          const material = item.material;
          console.log(`${material.material_name}: ${material.quantity} ${material.unit} (Purchase Price: ${material.purchase_price})`);
        }
        
        // Test completion (we would call our TypeScript function here)
        console.log("\n=== SIMULATING COMPLETION ===");
        for (const item of testPurchase.purchase_items) {
          const inventoryQuantity = item.actual_meter > 0 ? item.actual_meter : item.quantity;
          const newQuantity = item.material.quantity + inventoryQuantity;
          
          console.log(`${item.material.material_name}:`);
          console.log(`  - Current: ${item.material.quantity}`);
          console.log(`  - Adding: ${inventoryQuantity} (actual_meter: ${item.actual_meter || 'N/A'})`);
          console.log(`  - New total: ${newQuantity}`);
          console.log(`  - Unit price update: ${item.unit_price}`);
        }
      } else {
        console.log("No pending purchases found to test");
      }
    } else {
      console.log("No purchases found");
    }
    
  } catch (error) {
    console.error("Test error:", error);
  }
}

// Run the test
testPurchaseCompletion();
