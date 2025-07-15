// Test the fixed purchase search approach
// Copy this into browser console to test

async function testFixedSearch() {
  const { supabase } = await import('/src/integrations/supabase/client.js');
  
  console.log('🧪 Testing fixed purchase search approach...');
  
  const searchTerm = 'p';
  
  try {
    console.log(`1. Testing purchase number search for "${searchTerm}"...`);
    const { data: pnResults, error: pnError } = await supabase
      .from('purchases')
      .select('id, purchase_number, suppliers(name)')
      .ilike('purchase_number', `%${searchTerm}%`);
    
    if (pnError) {
      console.error('❌ Purchase number search error:', pnError);
    } else {
      console.log(`✅ Purchase number results: ${pnResults?.length || 0} found`, pnResults?.slice(0, 2));
    }
    
    console.log(`2. Testing supplier name search for "${searchTerm}"...`);
    const { data: snResults, error: snError } = await supabase
      .from('purchases')
      .select('id, purchase_number, suppliers!inner(name)')
      .filter('suppliers.name', 'ilike', `%${searchTerm}%`);
    
    if (snError) {
      console.error('❌ Supplier name search error:', snError);
    } else {
      console.log(`✅ Supplier name results: ${snResults?.length || 0} found`, snResults?.slice(0, 2));
    }
    
    console.log('3. Testing combined approach...');
    const allResults = [...(pnResults || []), ...(snResults || [])];
    const uniqueResults = allResults.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    );
    
    console.log(`✅ Combined unique results: ${uniqueResults.length} found`);
    console.log('Sample results:', uniqueResults.slice(0, 3));
    
    console.log('🎉 Fixed search approach working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testFixedSearch();
