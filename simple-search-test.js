// Simple test for purchase search query
// Copy this into browser console to test

async function testSimpleSearch() {
  const { supabase } = await import('/src/integrations/supabase/client.js');
  
  console.log('🧪 Testing simple purchase search...');
  
  try {
    // Test 1: Basic search without joins
    console.log('1. Testing basic search...');
    const { data: basicSearch, error: basicError } = await supabase
      .from('purchases')
      .select('id, purchase_number')
      .ilike('purchase_number', '%p%')
      .limit(3);
    
    if (basicError) {
      console.error('❌ Basic search error:', basicError);
    } else {
      console.log('✅ Basic search results:', basicSearch);
    }
    
    // Test 2: Search with supplier join
    console.log('2. Testing search with supplier join...');
    const { data: joinSearch, error: joinError } = await supabase
      .from('purchases')
      .select('id, purchase_number, suppliers!inner(name)')
      .or('purchase_number.ilike.%p%,suppliers.name.ilike.%p%')
      .limit(3);
    
    if (joinError) {
      console.error('❌ Join search error:', joinError);
    } else {
      console.log('✅ Join search results:', joinSearch);
    }
    
    // Test 3: Check if we have any suppliers data
    console.log('3. Checking suppliers table...');
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('id, name')
      .limit(3);
    
    if (suppliersError) {
      console.error('❌ Suppliers error:', suppliersError);
    } else {
      console.log('✅ Sample suppliers:', suppliers);
    }
    
    // Test 4: Check if purchases have supplier_id
    console.log('4. Checking purchase-supplier relationship...');
    const { data: purchaseWithSupplier, error: psError } = await supabase
      .from('purchases')
      .select('id, purchase_number, supplier_id, suppliers(name)')
      .not('supplier_id', 'is', null)
      .limit(3);
    
    if (psError) {
      console.error('❌ Purchase-supplier error:', psError);
    } else {
      console.log('✅ Purchases with suppliers:', purchaseWithSupplier);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSimpleSearch();
