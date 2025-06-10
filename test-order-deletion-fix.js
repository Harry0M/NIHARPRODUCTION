/**
 * Test script to verify the order deletion functionality
 * Run this in the browser console after navigating to the orders page
 */

console.log("🔧 ORDER DELETION TEST TOOL LOADED");
console.log("==================================");

// Function to test order deletion with proper sequence
window.testOrderDeletion = async function(orderId) {
  console.log("\n🚨 TESTING ORDER DELETION 🚨");
  console.log("==============================");
  
  if (!orderId) {
    console.error("❌ Please provide an order ID");
    console.log("Usage: testOrderDeletion('your-order-id-here')");
    return;
  }
  
  try {
    // Step 1: Check if order exists and has related data
    console.log("\n📋 STEP 1: Checking order data...");
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        company_name,
        status
      `)
      .eq('id', orderId)
      .single();
      
    if (orderError || !order) {
      console.error("❌ Order not found:", orderError);
      return;
    }
    
    console.log("✓ Order found:", {
      number: order.order_number,
      company: order.company_name,
      status: order.status
    });
    
    // Step 2: Check for job cards
    console.log("\n📦 STEP 2: Checking job cards...");
    const { data: jobCards, error: jobCardsError } = await supabase
      .from('job_cards')
      .select('id, job_number, status')
      .eq('order_id', orderId);
      
    if (jobCardsError) {
      console.error("❌ Error fetching job cards:", jobCardsError);
      return;
    }
    
    console.log(`✓ Found ${jobCards?.length || 0} job cards:`, jobCards);
    
    // Step 3: Check for dispatch records
    console.log("\n📤 STEP 3: Checking dispatch records...");
    const { data: dispatches, error: dispatchError } = await supabase
      .from('dispatch')
      .select('id, created_at')
      .eq('order_id', orderId);
      
    if (dispatchError) {
      console.error("❌ Error fetching dispatches:", dispatchError);
      return;
    }
    
    console.log(`✓ Found ${dispatches?.length || 0} dispatch records:`, dispatches);
    
    // Step 4: Check for sales invoices
    console.log("\n💰 STEP 4: Checking sales invoices...");
    const { data: salesInvoices, error: salesError } = await supabase
      .from('sales_invoices')
      .select('id, invoice_number')
      .eq('order_id', orderId);
      
    if (salesError) {
      console.error("❌ Error fetching sales invoices:", salesError);
      return;
    }
    
    console.log(`✓ Found ${salesInvoices?.length || 0} sales invoices:`, salesInvoices);
    
    // Step 5: Check for transactions
    console.log("\n🔄 STEP 5: Checking transactions...");
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('id, transaction_type, material_id')
      .eq('order_id', orderId);
      
    if (transactionsError) {
      console.error("❌ Error fetching transactions:", transactionsError);
      return;
    }
    
    console.log(`✓ Found ${transactions?.length || 0} transactions:`, transactions);
    
    // Step 6: Perform the deletion test
    console.log("\n🗑️ STEP 6: Testing deletion process...");
    console.log("⚠️ CONFIRM: Do you want to proceed with deletion?");
    console.log("This will delete the order and all related data!");
    console.log("To proceed, run: window.confirmOrderDeletion('" + orderId + "')");
    
    // Store the order ID for confirmation
    window.pendingDeletionOrderId = orderId;
    
  } catch (error) {
    console.error("❌ Error in test setup:", error);
  }
};

// Confirmation function
window.confirmOrderDeletion = async function(orderId) {
  if (orderId !== window.pendingDeletionOrderId) {
    console.error("❌ Order ID mismatch. Please run testOrderDeletion first.");
    return;
  }
  
  try {
    console.log("\n🚨 PERFORMING ACTUAL DELETION 🚨");
    console.log("==================================");
    
    // Call the delete_order_completely function
    const { error: deleteError } = await supabase.rpc(
      'delete_order_completely',
      { order_id: orderId }
    );
    
    if (deleteError) {
      console.error("❌ Deletion failed:", deleteError);
      return;
    }
    
    console.log("✅ Deletion completed successfully!");
    
    // Verify deletion
    console.log("\n🔍 VERIFICATION: Checking if order was deleted...");
    const { data: checkOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .maybeSingle();
      
    if (checkOrder) {
      console.error("❌ Order still exists after deletion!");
    } else {
      console.log("✅ Order successfully deleted from database!");
    }
    
    // Clean up
    delete window.pendingDeletionOrderId;
    
  } catch (error) {
    console.error("❌ Error during deletion:", error);
  }
};

// Helper function to list all orders
window.listOrders = async function() {
  console.log("\n📋 LISTING ALL ORDERS");
  console.log("====================");
  
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_number, company_name, status')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error("❌ Error fetching orders:", error);
    return;
  }
  
  console.log("Recent orders:");
  orders?.forEach(order => {
    console.log(`- ${order.order_number} (${order.company_name}) - ${order.status} [ID: ${order.id}]`);
  });
  
  console.log("\nTo test deletion, run: testOrderDeletion('order-id-here')");
};

console.log("\n📖 USAGE INSTRUCTIONS:");
console.log("======================");
console.log("1. listOrders() - See all available orders");
console.log("2. testOrderDeletion('order-id') - Test deletion for specific order");
console.log("3. confirmOrderDeletion('order-id') - Actually perform the deletion");
console.log("\n🚀 Ready to test order deletion!");
