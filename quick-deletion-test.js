// Quick Order Deletion Test
// Copy and paste this into the browser console on the orders page

console.log("🔧 QUICK ORDER DELETION TEST");
console.log("============================");

// Test the fixed function directly
window.quickTestDeletion = async function(orderId) {
  if (!orderId) {
    console.error("❌ Please provide an order ID");
    console.log("Usage: quickTestDeletion('your-order-id-here')");
    return;
  }
  
  console.log(`\n🚨 Testing deletion for order: ${orderId}`);
  
  try {
    // Check if order exists first
    const { data: order, error: checkError } = await supabase
      .from('orders')
      .select('id, order_number, company_name')
      .eq('id', orderId)
      .single();
      
    if (checkError || !order) {
      console.error("❌ Order not found:", checkError);
      return;
    }
    
    console.log("✓ Order found:", order.order_number, "-", order.company_name);
    
    // Now test the deletion function
    console.log("\n🗑️ Calling delete_order_completely...");
    const { error: deleteError } = await supabase.rpc(
      'delete_order_completely',
      { target_order_id: orderId }
    );
    
    if (deleteError) {
      console.error("❌ Deletion failed:", deleteError);
      console.error("Full error details:", deleteError);
      return;
    }
    
    console.log("✅ Deletion function completed successfully!");
    
    // Verify the order is gone
    const { data: verifyOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .maybeSingle();
      
    if (verifyOrder) {
      console.error("❌ Order still exists after deletion!");
    } else {
      console.log("🎉 SUCCESS: Order completely deleted!");
    }
    
  } catch (error) {
    console.error("❌ Error during test:", error);
  }
};

// List orders for testing
window.getTestOrders = async function() {
  console.log("\n📋 Available orders for testing:");
  console.log("================================");
  
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_number, company_name, status')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (error) {
    console.error("❌ Error fetching orders:", error);
    return;
  }
  
  if (!orders || orders.length === 0) {
    console.log("No orders found");
    return;
  }
  
  orders.forEach((order, index) => {
    console.log(`${index + 1}. ${order.order_number} - ${order.company_name} (${order.status})`);
    console.log(`   ID: ${order.id}`);
    console.log(`   Test: quickTestDeletion('${order.id}')`);
    console.log("");
  });
};

console.log("\n📖 Commands:");
console.log("============");
console.log("getTestOrders() - List available orders");
console.log("quickTestDeletion('order-id') - Test deletion");
console.log("\n🚀 Ready to test the fixed deletion!");

// Auto-load orders
getTestOrders();
