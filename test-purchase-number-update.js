/**
 * Test script to verify the purchase number update functionality
 * This script tests the new trigger that updates purchase number when invoice number changes
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://localhost:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPurchaseNumberUpdate() {
  console.log('🧪 Testing Purchase Number Update on Invoice Change');
  console.log('=' .repeat(60));

  try {
    // Step 1: Create a test purchase without invoice number
    console.log('\n1. Creating test purchase without invoice number...');
    const { data: newPurchase, error: createError } = await supabase
      .from('purchases')
      .insert({
        supplier_id: null, // We'll use null for testing
        purchase_date: new Date().toISOString().split('T')[0],
        subtotal: 1000,
        total_amount: 1000,
        status: 'pending',
        notes: 'Test purchase for invoice number update testing'
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating test purchase:', createError);
      return;
    }

    console.log('✅ Created test purchase:', {
      id: newPurchase.id,
      purchase_number: newPurchase.purchase_number,
      invoice_number: newPurchase.invoice_number
    });

    // Step 2: Update the purchase to add an invoice number
    console.log('\n2. Updating purchase to add invoice number "7898"...');
    const { data: updatedPurchase, error: updateError } = await supabase
      .from('purchases')
      .update({
        invoice_number: '7898'
      })
      .eq('id', newPurchase.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating purchase:', updateError);
      return;
    }

    console.log('✅ Updated purchase:', {
      id: updatedPurchase.id,
      purchase_number: updatedPurchase.purchase_number,
      invoice_number: updatedPurchase.invoice_number
    });

    // Verify the purchase number was updated correctly
    const expectedPurchaseNumber = 'PUR-7898';
    if (updatedPurchase.purchase_number === expectedPurchaseNumber) {
      console.log('✅ SUCCESS: Purchase number correctly updated to:', expectedPurchaseNumber);
    } else {
      console.log('❌ FAILURE: Purchase number should be', expectedPurchaseNumber, 'but got:', updatedPurchase.purchase_number);
    }

    // Step 3: Change invoice number to a different value
    console.log('\n3. Changing invoice number to "9999"...');
    const { data: changedPurchase, error: changeError } = await supabase
      .from('purchases')
      .update({
        invoice_number: '9999'
      })
      .eq('id', newPurchase.id)
      .select()
      .single();

    if (changeError) {
      console.error('❌ Error changing invoice number:', changeError);
      return;
    }

    console.log('✅ Changed purchase:', {
      id: changedPurchase.id,
      purchase_number: changedPurchase.purchase_number,
      invoice_number: changedPurchase.invoice_number
    });

    // Verify the purchase number was updated correctly
    const expectedPurchaseNumber2 = 'PUR-9999';
    if (changedPurchase.purchase_number === expectedPurchaseNumber2) {
      console.log('✅ SUCCESS: Purchase number correctly updated to:', expectedPurchaseNumber2);
    } else {
      console.log('❌ FAILURE: Purchase number should be', expectedPurchaseNumber2, 'but got:', changedPurchase.purchase_number);
    }

    // Step 4: Clear the invoice number
    console.log('\n4. Clearing invoice number...');
    const { data: clearedPurchase, error: clearError } = await supabase
      .from('purchases')
      .update({
        invoice_number: null
      })
      .eq('id', newPurchase.id)
      .select()
      .single();

    if (clearError) {
      console.error('❌ Error clearing invoice number:', clearError);
      return;
    }

    console.log('✅ Cleared invoice number:', {
      id: clearedPurchase.id,
      purchase_number: clearedPurchase.purchase_number,
      invoice_number: clearedPurchase.invoice_number
    });

    // Verify the purchase number was updated to default format
    if (clearedPurchase.purchase_number.startsWith('PUR-20')) {
      console.log('✅ SUCCESS: Purchase number reverted to default format:', clearedPurchase.purchase_number);
    } else {
      console.log('❌ FAILURE: Purchase number should revert to PUR-YYYY-NNNN format, but got:', clearedPurchase.purchase_number);
    }

    // Step 5: Test with existing purchases (find one with invoice number)
    console.log('\n5. Testing with existing purchases...');
    const { data: existingPurchases, error: existingError } = await supabase
      .from('purchases')
      .select('id, purchase_number, invoice_number')
      .not('invoice_number', 'is', null)
      .limit(1);

    if (existingError) {
      console.error('❌ Error fetching existing purchases:', existingError);
    } else if (existingPurchases && existingPurchases.length > 0) {
      const existing = existingPurchases[0];
      console.log('📋 Found existing purchase:', {
        id: existing.id,
        purchase_number: existing.purchase_number,
        invoice_number: existing.invoice_number
      });

      // Check if it follows the correct format
      const expectedFormat = 'PUR-' + existing.invoice_number;
      if (existing.purchase_number === expectedFormat) {
        console.log('✅ Existing purchase already has correct format');
      } else {
        console.log('⚠️  Existing purchase has different format - migration may be needed');
      }
    } else {
      console.log('ℹ️  No existing purchases with invoice numbers found');
    }

    // Clean up: Delete the test purchase
    console.log('\n6. Cleaning up test purchase...');
    const { error: deleteError } = await supabase
      .from('purchases')
      .delete()
      .eq('id', newPurchase.id);

    if (deleteError) {
      console.error('❌ Error deleting test purchase:', deleteError);
    } else {
      console.log('✅ Test purchase cleaned up');
    }

    console.log('\n' + '=' .repeat(60));
    console.log('🎉 Purchase Number Update Test Complete!');
    console.log('   The trigger should now update purchase numbers when invoice numbers change.');
    console.log('   Format: PUR-{invoice_number} when invoice is present');
    console.log('   Format: PUR-YYYY-NNNN when invoice is cleared');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testPurchaseNumberUpdate();
