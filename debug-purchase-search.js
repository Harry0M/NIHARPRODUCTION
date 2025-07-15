// Debug script to test purchase search functionality
// Run this in the browser console to test the search queries

import { supabase } from '@/integrations/supabase/client';

async function testPurchaseSearch() {
  console.log('🔍 Testing purchase search functionality...');
  
  try {
    // First, let's check if we have any purchases at all
    console.log('1. Checking total purchases count...');
    const { count: totalCount, error: totalError } = await supabase
      .from('purchases')
      .select('id', { count: 'exact', head: true });
    
    if (totalError) {
      console.error('❌ Error getting total count:', totalError);
      return;
    }
    
    console.log(`📊 Total purchases in database: ${totalCount}`);
    
    if (totalCount === 0) {
      console.log('⚠️ No purchases found in database');
      return;
    }
    
    // Get some sample purchases to see their structure
    console.log('2. Getting sample purchases...');
    const { data: samplePurchases, error: sampleError } = await supabase
      .from('purchases')
      .select('id, purchase_number, purchase_date, supplier_id, suppliers(name)')
      .limit(5);
    
    if (sampleError) {
      console.error('❌ Error getting samples:', sampleError);
      return;
    }
    
    console.log('📋 Sample purchases:', samplePurchases);
    
    // Test search with purchase number if we have any
    if (samplePurchases && samplePurchases.length > 0) {
      const firstPurchase = samplePurchases[0];
      
      if (firstPurchase.purchase_number) {
        console.log(`3. Testing search with purchase number: "${firstPurchase.purchase_number}"`);
        
        const { data: searchResult, error: searchError } = await supabase
          .from('purchases')
          .select('*, suppliers!inner(name)')
          .or(`purchase_number.ilike.%${firstPurchase.purchase_number}%,suppliers.name.ilike.%${firstPurchase.purchase_number}%`);
        
        if (searchError) {
          console.error('❌ Search error:', searchError);
        } else {
          console.log(`✅ Search result for "${firstPurchase.purchase_number}":`, searchResult);
        }
      }
      
      // Test search with supplier name if available
      if (firstPurchase.suppliers?.name) {
        console.log(`4. Testing search with supplier name: "${firstPurchase.suppliers.name}"`);
        
        const { data: supplierSearchResult, error: supplierSearchError } = await supabase
          .from('purchases')
          .select('*, suppliers!inner(name)')
          .or(`purchase_number.ilike.%${firstPurchase.suppliers.name}%,suppliers.name.ilike.%${firstPurchase.suppliers.name}%`);
        
        if (supplierSearchError) {
          console.error('❌ Supplier search error:', supplierSearchError);
        } else {
          console.log(`✅ Search result for supplier "${firstPurchase.suppliers.name}":`, supplierSearchResult);
        }
      }
    }
    
    // Test the exact query structure used in the component
    console.log('5. Testing exact component query structure...');
    const searchTerm = 'test';
    
    const { count: testCount, error: testCountError } = await supabase
      .from('purchases')
      .select('id, suppliers!inner(name)', { count: 'exact', head: true })
      .or(`purchase_number.ilike.%${searchTerm}%,suppliers.name.ilike.%${searchTerm}%`);
    
    if (testCountError) {
      console.error('❌ Test count query error:', testCountError);
    } else {
      console.log(`📊 Test search count for "${searchTerm}": ${testCount}`);
    }
    
    const { data: testData, error: testDataError } = await supabase
      .from('purchases')
      .select('*, suppliers!inner(name), purchase_items(id, material_id, quantity, unit_price, line_total)')
      .or(`purchase_number.ilike.%${searchTerm}%,suppliers.name.ilike.%${searchTerm}%`)
      .limit(5);
    
    if (testDataError) {
      console.error('❌ Test data query error:', testDataError);
    } else {
      console.log(`✅ Test search data for "${searchTerm}":`, testData);
    }
    
    console.log('🏁 Purchase search test completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error in test:', error);
  }
}

// Export for use
export { testPurchaseSearch };

// Auto-run if this script is loaded directly
if (typeof window !== 'undefined') {
  console.log('🚀 Purchase search debug script loaded. Run testPurchaseSearch() to test.');
}
