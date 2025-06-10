/**
 * Order Deletion Verification Test
 * Run this in the browser console after the migration is applied
 */

console.log("🔧 ORDER DELETION VERIFICATION TOOL");
console.log("===================================");

// Function to test the fixed order deletion
window.testFixedOrderDeletion = async function(orderId) {
  console.log("\n🚨 TESTING FIXED ORDER DELETION 🚨");
  console.log("===================================");
  
  if (!orderId) {
    console.error("❌ Please provide an order ID");
    console.log("Usage: testFixedOrderDeletion('your-order-id-here')");
    return;
  }
  
  try {
    // Step 1: Verify order exists
    console.log("\n📋 STEP 1: Verifying order exists...");
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, company_name')
      .eq('id', orderId)
      .single();
      
    if (orderError || !order) {
      console.error("❌ Order not found:", orderError);
      return;
    }
    
    console.log("✓ Order found:", order.order_number);
    
    // Step 2: Test the database function directly
    console.log("\n🗑️ STEP 2: Testing database function...");
    const { error: deleteError } = await supabase.rpc(
      'delete_order_completely',
      { target_order_id: orderId }
    );
    
    if (deleteError) {
      console.error("❌ Deletion failed:", deleteError);
      return;
    }
    
    console.log("✅ Database function executed successfully!");
    
    // Step 3: Verify deletion
    console.log("\n🔍 STEP 3: Verifying deletion...");
    const { data: checkOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .maybeSingle();
      
    if (checkOrder) {
      console.error("❌ Order still exists after deletion!");
      return;
    }
    
    console.log("✅ Order successfully deleted!");
    
    // Step 4: Check related data
    console.log("\n🔍 STEP 4: Checking related data cleanup...");
    
    // Check job cards
    const { data: jobCards } = await supabase
      .from('job_cards')
      .select('id')
      .eq('order_id', orderId);
      
    console.log(`✓ Job cards remaining: ${jobCards?.length || 0}`);
    
    // Check transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id')
      .eq('order_id', orderId);
      
    console.log(`✓ Transactions remaining: ${transactions?.length || 0}`);
    
    // Check components
    const { data: components } = await supabase
      .from('order_components')
      .select('id')
      .eq('order_id', orderId);
      
    console.log(`✓ Order components remaining: ${components?.length || 0}`);
    
    if ((jobCards?.length || 0) === 0 && 
        (transactions?.length || 0) === 0 && 
        (components?.length || 0) === 0) {
      console.log("🎉 COMPLETE SUCCESS: All related data cleaned up!");
    } else {
      console.warn("⚠️ Some related data still exists");
    }
    
  } catch (error) {
    console.error("❌ Error in verification:", error);
  }
};

// Function to create a test order for deletion testing
window.createTestOrder = async function() {
  console.log("\n🏗️ CREATING TEST ORDER");
  console.log("======================");
  
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        company_name: 'Test Company for Deletion',
        quantity: 100,
        bag_length: 10,
        bag_width: 12,
        order_date: new Date().toISOString().split('T')[0],
        status: 'pending'
      })
      .select()
      .single();
      
    if (error) {
      console.error("❌ Error creating test order:", error);
      return;
    }
    
    console.log("✅ Test order created:", order);
    console.log(`📋 Order ID: ${order.id}`);
    console.log(`📋 Order Number: ${order.order_number}`);
    console.log("\nTo test deletion, run:");
    console.log(`testFixedOrderDeletion('${order.id}')`);
    
    return order.id;
    
  } catch (error) {
    console.error("❌ Error creating test order:", error);
  }
};

console.log("\n📖 AVAILABLE COMMANDS:");
console.log("======================");
console.log("1. createTestOrder() - Create a test order for deletion");
console.log("2. testFixedOrderDeletion('order-id') - Test the fixed deletion");
console.log("3. listOrders() - See all available orders (from previous script)");
console.log("\n🚀 Ready to test the fixed order deletion!");
