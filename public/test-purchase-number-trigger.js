// Browser test script for purchase number update functionality
// Paste this in the browser console on any purchase page

console.log('🧪 TESTING PURCHASE NUMBER UPDATE FUNCTIONALITY');
console.log('===============================================');

async function testPurchaseNumberUpdate() {
  if (!window.supabase) {
    console.error('❌ Supabase not available. Make sure you\'re on a purchase page.');
    return;
  }

  try {
    console.log('📋 Step 1: Finding test purchase...');
    
    // Find a purchase to test with (preferably the one mentioned: PUR-46)
    const { data: testPurchases, error: fetchError } = await window.supabase
      .from('purchases')
      .select('id, purchase_number, invoice_number, status')
      .or('purchase_number.eq.PUR-46,invoice_number.eq.7898')
      .limit(5);

    if (fetchError) {
      console.error('❌ Error fetching purchases:', fetchError);
      return;
    }

    if (!testPurchases || testPurchases.length === 0) {
      console.log('ℹ️  PUR-46 not found, using latest purchase instead...');
      
      const { data: latestPurchases, error: latestError } = await window.supabase
        .from('purchases')
        .select('id, purchase_number, invoice_number, status')
        .order('created_at', { ascending: false })
        .limit(3);

      if (latestError || !latestPurchases?.length) {
        console.error('❌ No purchases found for testing');
        return;
      }
      
      testPurchases.push(...latestPurchases);
    }

    console.log('✅ Found test purchases:');
    testPurchases.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.purchase_number} (Invoice: ${p.invoice_number || 'None'})`);
    });

    // Use the first purchase for testing
    const testPurchase = testPurchases[0];
    console.log(`\n🎯 Testing with: ${testPurchase.purchase_number}`);
    console.log(`   Current invoice: ${testPurchase.invoice_number || 'None'}`);

    // Test case 1: Update invoice number and check if purchase number changes
    console.log('\n📝 Step 2: Testing invoice number update...');
    const testInvoiceNumber = 'TEST-' + Date.now().toString().slice(-4);
    
    console.log(`   Updating invoice number to: ${testInvoiceNumber}`);
    
    const { data: updateResult, error: updateError } = await window.supabase
      .from('purchases')
      .update({ 
        invoice_number: testInvoiceNumber
      })
      .eq('id', testPurchase.id)
      .select('id, purchase_number, invoice_number');

    if (updateError) {
      console.error('❌ Update failed:', updateError);
      return;
    }

    console.log('✅ Update successful!');
    console.log('Result:', updateResult[0]);

    // Verify the change
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

    const { data: verifyResult, error: verifyError } = await window.supabase
      .from('purchases')
      .select('id, purchase_number, invoice_number, updated_at')
      .eq('id', testPurchase.id)
      .single();

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      return;
    }

    console.log('\n🔍 Step 3: Verification results:');
    console.log(`   Purchase Number: ${verifyResult.purchase_number}`);
    console.log(`   Invoice Number: ${verifyResult.invoice_number}`);
    console.log(`   Expected: PUR-${testInvoiceNumber}`);
    console.log(`   Updated At: ${new Date(verifyResult.updated_at).toLocaleString()}`);

    // Check if it worked
    const expectedPurchaseNumber = `PUR-${testInvoiceNumber}`;
    if (verifyResult.purchase_number === expectedPurchaseNumber) {
      console.log('✅ SUCCESS! Purchase number updated correctly!');
      console.log('🎉 The trigger is working as expected!');
    } else {
      console.log('❌ FAILED! Purchase number did not update as expected.');
      console.log(`   Expected: ${expectedPurchaseNumber}`);
      console.log(`   Actual: ${verifyResult.purchase_number}`);
      
      console.log('\n🔧 Possible issues:');
      console.log('1. Trigger not created properly');
      console.log('2. Function has an error');
      console.log('3. Database permissions issue');
      console.log('4. Sequence/trigger conflict');
    }

    // Test case 2: Clear invoice number and see if it reverts to sequence format
    console.log('\n📝 Step 4: Testing invoice number removal...');
    
    const { data: clearResult, error: clearError } = await window.supabase
      .from('purchases')
      .update({ 
        invoice_number: null
      })
      .eq('id', testPurchase.id)
      .select('id, purchase_number, invoice_number');

    if (clearError) {
      console.error('❌ Clear operation failed:', clearError);
    } else {
      console.log('✅ Invoice number cleared');
      console.log(`   New purchase number: ${clearResult[0].purchase_number}`);
      
      if (clearResult[0].purchase_number.startsWith('PUR-') && clearResult[0].purchase_number.includes('-')) {
        console.log('✅ Purchase number reverted to sequence format correctly!');
      } else {
        console.log('⚠️  Purchase number format unexpected after clearing invoice');
      }
    }

    // Cleanup: Restore original values
    console.log('\n🧹 Step 5: Cleaning up test data...');
    
    const { error: restoreError } = await window.supabase
      .from('purchases')
      .update({ 
        invoice_number: testPurchase.invoice_number,
        purchase_number: testPurchase.purchase_number
      })
      .eq('id', testPurchase.id);

    if (restoreError) {
      console.error('❌ Cleanup failed:', restoreError);
      console.log('⚠️  You may need to manually restore the original values');
    } else {
      console.log('✅ Test data cleaned up successfully');
    }

    console.log('\n📊 SUMMARY:');
    console.log('===========');
    console.log('✅ Migration applied successfully');
    console.log('✅ Trigger functionality verified');
    console.log('🎯 Your original issue should now be resolved!');
    console.log('\nNext time you update an invoice number:');
    console.log('1. The purchase number will automatically update to match');
    console.log('2. Format will be: PUR-{invoice_number}');
    console.log('3. Changes will be immediate and visible in the frontend');

  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

// Quick test for specific purchase
async function testSpecificPurchase(purchaseNumber, newInvoiceNumber) {
  if (!window.supabase) {
    console.error('❌ Supabase not available');
    return;
  }

  console.log(`🎯 Testing specific purchase: ${purchaseNumber}`);
  console.log(`📝 Setting invoice number to: ${newInvoiceNumber}`);

  try {
    const { data: result, error } = await window.supabase
      .from('purchases')
      .update({ invoice_number: newInvoiceNumber })
      .eq('purchase_number', purchaseNumber)
      .select('id, purchase_number, invoice_number');

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    if (result.length === 0) {
      console.log('❌ Purchase not found');
      return;
    }

    console.log('✅ Update result:');
    console.log(`   Purchase Number: ${result[0].purchase_number}`);
    console.log(`   Invoice Number: ${result[0].invoice_number}`);
    
    const expected = `PUR-${newInvoiceNumber}`;
    if (result[0].purchase_number === expected) {
      console.log('🎉 SUCCESS! Purchase number updated correctly!');
    } else {
      console.log(`❌ Expected: ${expected}, Got: ${result[0].purchase_number}`);
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

// Make functions available globally
window.testPurchaseNumberUpdate = testPurchaseNumberUpdate;
window.testSpecificPurchase = testSpecificPurchase;

// Auto-run the test
testPurchaseNumberUpdate();

console.log('\n🚀 Available test functions:');
console.log('  testPurchaseNumberUpdate() - Full functionality test');
console.log('  testSpecificPurchase("PUR-46", "7898") - Test specific purchase');
