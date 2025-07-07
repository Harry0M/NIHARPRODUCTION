// Test script to verify that new orders have 0% wastage by default
// Run this after applying the wastage fix

const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'your-supabase-url';
const supabaseKey = 'your-supabase-key';

async function testWastageDefault() {
  console.log('🧪 Testing wastage default value...');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Create a test order to verify wastage defaults to 0
    const testOrderData = {
      company_name: 'Test Company',
      quantity: 100,
      order_date: new Date().toISOString().split('T')[0],
      material_cost: 1000,
      // Note: NOT setting wastage_percentage to test if it defaults to 0
    };
    
    console.log('Creating test order without setting wastage_percentage...');
    
    const { data: newOrder, error } = await supabase
      .from('orders')
      .insert(testOrderData)
      .select('id, wastage_percentage, wastage_cost')
      .single();
    
    if (error) {
      console.error('❌ Error creating test order:', error);
      return;
    }
    
    console.log('✅ Test order created:', newOrder);
    
    // Check the values
    if (newOrder.wastage_percentage === 0 || newOrder.wastage_percentage === null) {
      console.log('✅ SUCCESS: Wastage percentage defaults to 0 (or null)');
    } else {
      console.log('❌ FAILURE: Wastage percentage is:', newOrder.wastage_percentage);
    }
    
    if (newOrder.wastage_cost === 0 || newOrder.wastage_cost === null) {
      console.log('✅ SUCCESS: Wastage cost defaults to 0 (or null)');
    } else {
      console.log('❌ FAILURE: Wastage cost is:', newOrder.wastage_cost);
    }
    
    // Clean up - delete the test order
    await supabase
      .from('orders')
      .delete()
      .eq('id', newOrder.id);
    
    console.log('🧹 Test order cleaned up');
    
  } catch (error) {
    console.error('❌ Exception during test:', error);
  }
}

// Check database schema for default values
async function checkDatabaseSchema() {
  console.log('\n📋 Checking database schema...');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            column_name,
            column_default,
            data_type,
            is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'orders' 
            AND column_name IN ('wastage_percentage', 'wastage_cost')
          ORDER BY column_name;
        `
      });
    
    if (error) {
      console.error('❌ Error checking schema:', error);
      return;
    }
    
    console.log('Database schema for wastage columns:');
    data.forEach(col => {
      console.log(`• ${col.column_name}: default=${col.column_default}, type=${col.data_type}, nullable=${col.is_nullable}`);
    });
    
  } catch (error) {
    console.error('❌ Exception checking schema:', error);
  }
}

// Run the tests
async function runTests() {
  console.log('🚀 Starting wastage default tests...\n');
  
  await checkDatabaseSchema();
  await testWastageDefault();
  
  console.log('\n✨ Tests completed!');
}

// Uncomment the line below to run the test
// runTests();

console.log('📝 To run this test:');
console.log('1. Update the supabaseUrl and supabaseKey variables with your credentials');
console.log('2. Uncomment the runTests() call at the bottom');
console.log('3. Run: node test-wastage-zero-default.js');
