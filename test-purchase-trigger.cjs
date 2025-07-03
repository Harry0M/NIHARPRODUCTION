// Test script to verify purchase number trigger functionality
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Use the environment variables from .env.local
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPurchaseNumberTrigger() {
  console.log('Testing purchase number trigger...');
  
  try {
    // Step 1: Get the most recent purchase
    const { data: purchases, error: fetchError } = await supabase
      .from('purchases')
      .select('id, purchase_number, invoice_number, status')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (fetchError) {
      console.error('Error fetching purchases:', fetchError);
      return;
    }
    
    if (!purchases || purchases.length === 0) {
      console.log('No purchases found to test with');
      return;
    }
    
    const purchase = purchases[0];
    console.log('Found purchase to test:', purchase);
    
    // Step 2: Update the invoice number
    const testInvoiceNumber = 'TEST-' + Date.now();
    console.log('Updating invoice number to:', testInvoiceNumber);
    
    const { data: updateData, error: updateError } = await supabase
      .from('purchases')
      .update({ invoice_number: testInvoiceNumber })
      .eq('id', purchase.id)
      .select();
    
    if (updateError) {
      console.error('Error updating purchase:', updateError);
      return;
    }
    
    console.log('Update result:', updateData);
    
    // Step 3: Wait a moment for the trigger to fire
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 4: Fetch the updated purchase to verify the trigger worked
    const { data: updatedPurchase, error: verifyError } = await supabase
      .from('purchases')
      .select('id, purchase_number, invoice_number, updated_at')
      .eq('id', purchase.id)
      .single();
    
    if (verifyError) {
      console.error('Error verifying purchase:', verifyError);
      return;
    }
    
    console.log('Updated purchase:', updatedPurchase);
    
    // Step 5: Verify the trigger worked
    const expectedPurchaseNumber = `PUR-${testInvoiceNumber}`;
    if (updatedPurchase.purchase_number === expectedPurchaseNumber) {
      console.log('✅ SUCCESS: Purchase number was updated correctly!');
      console.log(`   Invoice number: ${updatedPurchase.invoice_number}`);
      console.log(`   Purchase number: ${updatedPurchase.purchase_number}`);
    } else {
      console.log('❌ FAILURE: Purchase number was not updated correctly');
      console.log(`   Expected: ${expectedPurchaseNumber}`);
      console.log(`   Actual: ${updatedPurchase.purchase_number}`);
    }
    
    // Step 6: Clean up - restore original invoice number if it existed
    if (purchase.invoice_number) {
      await supabase
        .from('purchases')
        .update({ invoice_number: purchase.invoice_number })
        .eq('id', purchase.id);
      console.log('Restored original invoice number');
    }
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testPurchaseNumberTrigger();
