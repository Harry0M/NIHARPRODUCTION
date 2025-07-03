// Debug script for purchase invoice number update issue
// This script helps identify why invoice number updates work in database but don't show in frontend

const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPurchaseInvoiceUpdate() {
  console.log('🔍 DEBUGGING PURCHASE INVOICE UPDATE ISSUE');
  console.log('==========================================\n');

  try {
    // Step 1: List recent purchases to identify a test case
    console.log('📋 Step 1: Fetching recent purchases...');
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select(`
        id,
        purchase_number,
        invoice_number,
        status,
        created_at,
        updated_at,
        suppliers (name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (purchasesError) {
      console.error('❌ Error fetching purchases:', purchasesError);
      return;
    }

    console.log(`✅ Found ${purchases?.length || 0} recent purchases:`);
    purchases?.forEach((purchase, index) => {
      console.log(`   ${index + 1}. ${purchase.purchase_number} - ${purchase.suppliers?.name || 'Unknown Supplier'}`);
      console.log(`      Invoice: ${purchase.invoice_number || 'Not set'}`);
      console.log(`      Status: ${purchase.status}`);
      console.log(`      Updated: ${new Date(purchase.updated_at).toLocaleString()}`);
      console.log();
    });

    if (!purchases || purchases.length === 0) {
      console.log('❌ No purchases found to test with');
      return;
    }

    // Step 2: Select a purchase to test with (preferably one without invoice number)
    const testPurchase = purchases.find(p => !p.invoice_number) || purchases[0];
    console.log(`🎯 Selected purchase for testing: ${testPurchase.purchase_number}`);
    console.log(`   Current invoice number: ${testPurchase.invoice_number || 'Not set'}`);

    // Step 3: Update the invoice number
    const newInvoiceNumber = `TEST-INV-${Date.now()}`;
    console.log(`\n📝 Step 2: Updating invoice number to: ${newInvoiceNumber}`);
    
    const { data: updateResult, error: updateError } = await supabase
      .from('purchases')
      .update({ 
        invoice_number: newInvoiceNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', testPurchase.id)
      .select();

    if (updateError) {
      console.error('❌ Error updating purchase:', updateError);
      return;
    }

    console.log('✅ Update completed successfully');
    console.log('Update result:', updateResult);

    // Step 4: Verify the update in database
    console.log('\n🔍 Step 3: Verifying update in database...');
    const { data: verifyResult, error: verifyError } = await supabase
      .from('purchases')
      .select(`
        id,
        purchase_number,
        invoice_number,
        updated_at,
        suppliers (name)
      `)
      .eq('id', testPurchase.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
      return;
    }

    console.log('✅ Database verification:');
    console.log(`   Purchase: ${verifyResult.purchase_number}`);
    console.log(`   Invoice Number: ${verifyResult.invoice_number}`);
    console.log(`   Updated At: ${new Date(verifyResult.updated_at).toLocaleString()}`);

    // Step 5: Check frontend data fetching patterns
    console.log('\n🖥️  Step 4: Checking frontend data patterns...');
    
    // Simulate the frontend purchase list query
    const { data: listData, error: listError } = await supabase
      .from('purchases')
      .select(`
        id,
        purchase_number,
        purchase_date,
        supplier_id,
        total_amount,
        status,
        invoice_number,
        suppliers(name),
        purchase_items(id, material_id, quantity, unit_price, line_total)
      `)
      .order('purchase_date', { ascending: false })
      .limit(5);

    if (listError) {
      console.error('❌ Error fetching list data:', listError);
    } else {
      console.log('✅ Frontend list query results:');
      listData?.forEach(item => {
        console.log(`   ${item.purchase_number}: Invoice = ${item.invoice_number || 'Not set'}`);
      });
    }

    // Simulate the frontend purchase detail query
    const { data: detailData, error: detailError } = await supabase
      .from('purchases')
      .select(`
        *,
        suppliers (*),
        purchase_items (
          id,
          material_id,
          quantity,
          unit_price,
          line_total,
          gst_percentage,
          gst_amount,
          actual_meter,
          alt_quantity,
          alt_unit_price,
          material:inventory (
            id,
            material_name,
            color,
            gsm,
            unit,
            alternate_unit,
            conversion_rate
          )
        )
      `)
      .eq('id', testPurchase.id)
      .single();

    if (detailError) {
      console.error('❌ Error fetching detail data:', detailError);
    } else {
      console.log('\n✅ Frontend detail query results:');
      console.log(`   Purchase: ${detailData.purchase_number}`);
      console.log(`   Invoice Number: ${detailData.invoice_number}`);
      console.log(`   Updated At: ${new Date(detailData.updated_at).toLocaleString()}`);
    }

    // Step 6: Recommendations
    console.log('\n💡 ANALYSIS & RECOMMENDATIONS');
    console.log('================================');
    
    if (verifyResult.invoice_number === newInvoiceNumber) {
      console.log('✅ Database update is working correctly');
      
      if (detailData && detailData.invoice_number === newInvoiceNumber) {
        console.log('✅ Frontend queries are returning updated data');
        console.log('\n🎯 LIKELY CAUSES:');
        console.log('1. Frontend component state management issues');
        console.log('2. React Query cache not invalidating properly');
        console.log('3. Component not re-rendering after update');
        console.log('4. Browser cache issues');
        
        console.log('\n🔧 SOLUTIONS TO TRY:');
        console.log('1. Add refetch() call after successful update');
        console.log('2. Check React Query invalidation in edit component');
        console.log('3. Ensure useEffect dependencies are correct');
        console.log('4. Clear browser cache and try again');
        console.log('5. Check if component is using local state instead of server data');
      } else {
        console.log('❌ Frontend queries are NOT returning updated data');
        console.log('\n🎯 LIKELY CAUSES:');
        console.log('1. Row Level Security (RLS) policies blocking reads');
        console.log('2. Query filters excluding the updated record');
        console.log('3. Database connection/transaction issues');
        
        console.log('\n🔧 SOLUTIONS TO TRY:');
        console.log('1. Check RLS policies on purchases table');
        console.log('2. Verify user authentication');
        console.log('3. Check database logs for any errors');
        console.log('4. Test with different user or in database directly');
      }
    } else {
      console.log('❌ Database update failed or was rolled back');
      console.log('\n🔧 SOLUTIONS TO TRY:');
      console.log('1. Check database triggers that might revert changes');
      console.log('2. Verify user permissions for updates');
      console.log('3. Check for database constraints or validations');
    }

    // Step 7: Clean up - revert the test change
    console.log('\n🧹 Step 5: Cleaning up test data...');
    const { error: cleanupError } = await supabase
      .from('purchases')
      .update({ 
        invoice_number: testPurchase.invoice_number,
        updated_at: new Date().toISOString()
      })
      .eq('id', testPurchase.id);

    if (cleanupError) {
      console.error('❌ Error cleaning up test data:', cleanupError);
      console.log(`⚠️  Manual cleanup needed: Revert invoice_number for purchase ${testPurchase.purchase_number}`);
    } else {
      console.log('✅ Test data cleaned up successfully');
    }

  } catch (error) {
    console.error('💥 Unexpected error during debugging:', error);
  }
}

// Function to check specific purchase
async function checkSpecificPurchase(purchaseId) {
  console.log(`\n🔍 CHECKING SPECIFIC PURCHASE: ${purchaseId}`);
  console.log('=========================================');

  try {
    const { data, error } = await supabase
      .from('purchases')
      .select(`
        id,
        purchase_number,
        invoice_number,
        status,
        updated_at,
        suppliers (name)
      `)
      .eq('id', purchaseId)
      .single();

    if (error) {
      console.error('❌ Error fetching purchase:', error);
      return;
    }

    console.log('Purchase details:');
    console.log(`   ID: ${data.id}`);
    console.log(`   Purchase Number: ${data.purchase_number}`);
    console.log(`   Invoice Number: ${data.invoice_number || 'Not set'}`);
    console.log(`   Status: ${data.status}`);
    console.log(`   Supplier: ${data.suppliers?.name || 'Unknown'}`);
    console.log(`   Last Updated: ${new Date(data.updated_at).toLocaleString()}`);

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

// Export functions for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    debugPurchaseInvoiceUpdate,
    checkSpecificPurchase
  };
}

// Browser usage
if (typeof window !== 'undefined') {
  window.debugPurchaseInvoiceUpdate = debugPurchaseInvoiceUpdate;
  window.checkSpecificPurchase = checkSpecificPurchase;
  
  console.log('🚀 Debug functions loaded!');
  console.log('Usage:');
  console.log('  - debugPurchaseInvoiceUpdate() - Full debug analysis');
  console.log('  - checkSpecificPurchase(purchaseId) - Check specific purchase');
}

// Auto-run if called directly
if (require.main === module) {
  debugPurchaseInvoiceUpdate();
}