// Simple verification script for job card order date implementation
// This checks the database structure and recent transactions

const testImplementation = async () => {
  console.log('🔍 Testing Job Card Order Date Implementation');
  console.log('Testing from browser console...');
  
  try {
    // Check if we're in the browser environment
    if (typeof window === 'undefined') {
      console.log('❌ This script should be run in the browser console');
      return;
    }

    // Access the Supabase client from the global scope
    const supabase = window.supabase;
    if (!supabase) {
      console.log('❌ Supabase client not found. Make sure you\'re on the application page.');
      return;
    }

    console.log('✅ Supabase client found, checking recent transactions...');

    // Check recent job card consumption transactions
    const { data: transactions, error } = await supabase
      .from('inventory_transaction_log')
      .select(`
        id,
        material_id,
        transaction_type,
        reference_type,
        reference_number,
        transaction_date,
        metadata,
        inventory (material_name)
      `)
      .eq('reference_type', 'JobCard')
      .order('transaction_date', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log(`📊 Found ${transactions?.length || 0} job card transactions`);

    if (transactions && transactions.length > 0) {
      transactions.forEach((trans, i) => {
        console.log(`\n${i + 1}. ${trans.inventory?.material_name || 'Unknown Material'}`);
        console.log(`   Type: ${trans.transaction_type}`);
        console.log(`   Reference: ${trans.reference_number}`);
        console.log(`   Date: ${new Date(trans.transaction_date).toLocaleDateString()}`);
        
        if (trans.metadata && trans.metadata.order_date) {
          console.log(`   ✅ Order Date: ${new Date(trans.metadata.order_date).toLocaleDateString()}`);
        } else {
          console.log(`   ❌ Order date missing`);
        }
      });
    }

    // Check orders for reference
    const { data: orders } = await supabase
      .from('orders')
      .select('order_number, order_date')
      .order('created_at', { ascending: false })
      .limit(3);

    console.log('\n📋 Recent Orders:');
    orders?.forEach((order, i) => {
      console.log(`${i + 1}. ${order.order_number} - ${new Date(order.order_date).toLocaleDateString()}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testImplementation();
