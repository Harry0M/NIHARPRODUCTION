// Browser Debug Script for Purchase Invoice Number Update Issue
// Paste this in the browser console on any purchase page

console.log('🔍 PURCHASE INVOICE DEBUG SCRIPT LOADED');
console.log('========================================');

// Main debug function
async function debugPurchaseInvoiceUpdate() {
  if (!window.supabase) {
    console.error('❌ Supabase not available in window. Make sure you\'re on a page with Supabase loaded.');
    return;
  }

  console.log('🔍 Starting purchase invoice update debugging...\n');

  try {
    // Step 1: Get recent purchases
    console.log('📋 Step 1: Fetching recent purchases...');
    const { data: purchases, error: purchasesError } = await window.supabase
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
      console.log(`   ${index + 1}. ${purchase.purchase_number} - ${purchase.suppliers?.name || 'Unknown'}`);
      console.log(`      Invoice: ${purchase.invoice_number || 'Not set'}`);
      console.log(`      Status: ${purchase.status}`);
      console.log(`      Updated: ${new Date(purchase.updated_at).toLocaleString()}`);
    });

    // Step 2: Check if there's a purchase currently loaded in the page
    const currentUrl = window.location.pathname;
    const purchaseIdMatch = currentUrl.match(/\/purchases\/([^\/]+)/);
    
    if (purchaseIdMatch) {
      const currentPurchaseId = purchaseIdMatch[1];
      console.log(`\n🎯 Current page purchase ID: ${currentPurchaseId}`);
      
      // Check current purchase details
      const { data: currentPurchase, error: currentError } = await window.supabase
        .from('purchases')
        .select(`
          id,
          purchase_number,
          invoice_number,
          status,
          updated_at,
          suppliers (name)
        `)
        .eq('id', currentPurchaseId)
        .single();

      if (currentError) {
        console.error('❌ Error fetching current purchase:', currentError);
      } else {
        console.log('✅ Current purchase details:');
        console.log(`   Purchase: ${currentPurchase.purchase_number}`);
        console.log(`   Invoice: ${currentPurchase.invoice_number || 'Not set'}`);
        console.log(`   Status: ${currentPurchase.status}`);
        console.log(`   Updated: ${new Date(currentPurchase.updated_at).toLocaleString()}`);
      }
    }

    // Step 3: Provide debugging tools
    console.log('\n🛠️  Available Debug Functions:');
    console.log('================================');
    console.log('1. testInvoiceUpdate(purchaseId, newInvoiceNumber) - Test updating an invoice number');
    console.log('2. checkPurchaseData(purchaseId) - Check specific purchase data');
    console.log('3. simulateRefresh() - Simulate page data refresh');
    console.log('4. checkReactQueryCache() - Check React Query cache status');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Test invoice update function
async function testInvoiceUpdate(purchaseId, newInvoiceNumber) {
  if (!window.supabase) {
    console.error('❌ Supabase not available');
    return;
  }

  console.log(`\n🧪 TESTING INVOICE UPDATE`);
  console.log(`Purchase ID: ${purchaseId}`);
  console.log(`New Invoice Number: ${newInvoiceNumber}`);
  console.log('========================');

  try {
    // Get current data
    const { data: beforeData, error: beforeError } = await window.supabase
      .from('purchases')
      .select('id, purchase_number, invoice_number, updated_at')
      .eq('id', purchaseId)
      .single();

    if (beforeError) {
      console.error('❌ Error fetching before data:', beforeError);
      return;
    }

    console.log('📋 Before update:');
    console.log(`   Invoice: ${beforeData.invoice_number || 'Not set'}`);
    console.log(`   Updated: ${new Date(beforeData.updated_at).toLocaleString()}`);

    // Perform update
    console.log('\n📝 Performing update...');
    const { data: updateResult, error: updateError } = await window.supabase
      .from('purchases')
      .update({ 
        invoice_number: newInvoiceNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', purchaseId)
      .select();

    if (updateError) {
      console.error('❌ Update failed:', updateError);
      return;
    }

    console.log('✅ Update successful:', updateResult);

    // Verify update
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait a bit
    
    const { data: afterData, error: afterError } = await window.supabase
      .from('purchases')
      .select('id, purchase_number, invoice_number, updated_at')
      .eq('id', purchaseId)
      .single();

    if (afterError) {
      console.error('❌ Error fetching after data:', afterError);
      return;
    }

    console.log('\n📋 After update:');
    console.log(`   Invoice: ${afterData.invoice_number || 'Not set'}`);
    console.log(`   Updated: ${new Date(afterData.updated_at).toLocaleString()}`);

    // Check if update was successful
    if (afterData.invoice_number === newInvoiceNumber) {
      console.log('✅ Database update confirmed!');
      
      // Now check if frontend shows the change
      setTimeout(() => {
        const invoiceElements = document.querySelectorAll('[data-testid="invoice-number"], .invoice-number, [class*="invoice"]');
        console.log('\n🔍 Frontend elements that might show invoice number:');
        invoiceElements.forEach((element, index) => {
          console.log(`   ${index + 1}. ${element.tagName}: "${element.textContent?.trim()}" (class: ${element.className})`);
        });
        
        if (invoiceElements.length === 0) {
          console.log('   ⚠️  No invoice-related elements found in DOM');
        }
      }, 1000);
      
    } else {
      console.log('❌ Database update failed or reverted');
    }

  } catch (error) {
    console.error('💥 Error during test:', error);
  }
}

// Check specific purchase data
async function checkPurchaseData(purchaseId) {
  if (!window.supabase) {
    console.error('❌ Supabase not available');
    return;
  }

  console.log(`\n🔍 CHECKING PURCHASE DATA: ${purchaseId}`);
  console.log('=====================================');

  try {
    const { data, error } = await window.supabase
      .from('purchases')
      .select(`
        id,
        purchase_number,
        invoice_number,
        status,
        updated_at,
        created_at,
        suppliers (name)
      `)
      .eq('id', purchaseId)
      .single();

    if (error) {
      console.error('❌ Error fetching purchase:', error);
      return;
    }

    console.log('✅ Purchase data:');
    console.log(`   ID: ${data.id}`);
    console.log(`   Purchase Number: ${data.purchase_number}`);
    console.log(`   Invoice Number: ${data.invoice_number || 'Not set'}`);
    console.log(`   Status: ${data.status}`);
    console.log(`   Supplier: ${data.suppliers?.name || 'Unknown'}`);
    console.log(`   Created: ${new Date(data.created_at).toLocaleString()}`);
    console.log(`   Updated: ${new Date(data.updated_at).toLocaleString()}`);

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

// Simulate refresh by invalidating React Query cache
function simulateRefresh() {
  console.log('\n🔄 SIMULATING PAGE REFRESH...');
  
  // Try to find React Query client and invalidate
  if (window.queryClient) {
    console.log('✅ Found React Query client, invalidating purchases cache...');
    window.queryClient.invalidateQueries(['purchases']);
    window.queryClient.invalidateQueries(['purchase']);
  } else {
    console.log('⚠️  React Query client not found in window.queryClient');
  }
  
  // Alternative: force page reload
  console.log('🔄 As fallback, you can manually refresh the page');
}

// Check React Query cache
function checkReactQueryCache() {
  console.log('\n🗄️  CHECKING REACT QUERY CACHE...');
  
  if (window.queryClient) {
    const cache = window.queryClient.getQueryCache();
    const purchaseQueries = cache.findAll(['purchase']);
    const purchasesQueries = cache.findAll(['purchases']);
    
    console.log(`✅ Found ${purchaseQueries.length} purchase queries in cache`);
    console.log(`✅ Found ${purchasesQueries.length} purchases queries in cache`);
    
    purchaseQueries.forEach((query, index) => {
      console.log(`   Purchase Query ${index + 1}:`, query.queryKey, query.state.status);
    });
    
    purchasesQueries.forEach((query, index) => {
      console.log(`   Purchases Query ${index + 1}:`, query.queryKey, query.state.status);
    });
  } else {
    console.log('❌ React Query client not found');
  }
}

// Auto-run main debug function
debugPurchaseInvoiceUpdate();

// Make functions globally available
window.debugPurchaseInvoiceUpdate = debugPurchaseInvoiceUpdate;
window.testInvoiceUpdate = testInvoiceUpdate;
window.checkPurchaseData = checkPurchaseData;
window.simulateRefresh = simulateRefresh;
window.checkReactQueryCache = checkReactQueryCache;

console.log('\n🚀 Debug functions are now available in the console!');
console.log('Usage examples:');
console.log('  testInvoiceUpdate("purchase-id-here", "NEW-INV-123")');
console.log('  checkPurchaseData("purchase-id-here")');
console.log('  simulateRefresh()');
console.log('  checkReactQueryCache()');
