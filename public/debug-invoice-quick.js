// Simple Invoice Number Debug Script
// Paste this in the browser console on a purchase detail or edit page

console.log('🔍 INVOICE NUMBER TROUBLESHOOTER');
console.log('================================');

async function quickInvoiceDebug() {
  if (!window.supabase) {
    console.error('❌ Supabase not available. Make sure you\'re on a purchase page.');
    return;
  }

  // Get purchase ID from URL
  const currentUrl = window.location.pathname;
  const purchaseIdMatch = currentUrl.match(/\/purchases\/([^\/]+)/);
  
  if (!purchaseIdMatch) {
    console.error('❌ No purchase ID found in URL. Navigate to a purchase page first.');
    return;
  }

  const purchaseId = purchaseIdMatch[1];
  console.log(`🎯 Found purchase ID: ${purchaseId}`);

  try {
    // Check database directly
    console.log('\n📊 Database Check:');
    const { data: dbData, error: dbError } = await window.supabase
      .from('purchases')
      .select('id, purchase_number, invoice_number, updated_at')
      .eq('id', purchaseId)
      .single();

    if (dbError) {
      console.error('❌ Database error:', dbError);
      return;
    }

    console.log('✅ Database result:');
    console.log(`   Purchase: ${dbData.purchase_number}`);
    console.log(`   Invoice: ${dbData.invoice_number || 'NOT SET'}`);
    console.log(`   Updated: ${new Date(dbData.updated_at).toLocaleString()}`);

    // Check what's displayed on page
    console.log('\n🖥️  Frontend Display Check:');
    
    // Look for invoice in title
    const titleElement = document.querySelector('h1, .text-2xl');
    if (titleElement) {
      console.log(`   Title shows: "${titleElement.textContent?.trim()}"`);
      if (titleElement.textContent?.includes('Invoice:')) {
        console.log('   ✅ Invoice visible in title');
      } else {
        console.log('   ❌ Invoice NOT visible in title');
      }
    }

    // Look for invoice in details section
    const invoiceElements = document.querySelectorAll('*');
    let foundInvoiceDisplay = false;
    
    for (const element of invoiceElements) {
      if (element.textContent?.includes('Invoice Number:')) {
        foundInvoiceDisplay = true;
        console.log(`   Details section: "${element.textContent?.trim()}"`);
        break;
      }
    }
    
    if (!foundInvoiceDisplay) {
      console.log('   ❌ Invoice details section not found');
    }

    // Compare database vs display
    console.log('\n📋 Analysis:');
    if (dbData.invoice_number) {
      console.log(`✅ Database HAS invoice number: "${dbData.invoice_number}"`);
      
      const titleText = titleElement?.textContent || '';
      if (titleText.includes(dbData.invoice_number)) {
        console.log('✅ Frontend SHOWS correct invoice number');
        console.log('🎉 Everything looks good!');
      } else {
        console.log('❌ Frontend does NOT show invoice number');
        console.log('🔧 ISSUE FOUND: Database has invoice but frontend doesn\'t show it');
        
        console.log('\n💡 Try these solutions:');
        console.log('1. Refresh the page (Ctrl+F5)');
        console.log('2. Run: window.location.reload(true)');
        console.log('3. Check React Query cache: checkReactQueryCache()');
        console.log('4. Force refetch: refetchPurchaseData()');
      }
    } else {
      console.log('ℹ️  Database does NOT have invoice number set');
      console.log('💡 This is normal if no invoice number was entered');
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

// Force refetch function
async function refetchPurchaseData() {
  if (window.queryClient) {
    console.log('🔄 Forcing React Query refetch...');
    
    const currentUrl = window.location.pathname;
    const purchaseIdMatch = currentUrl.match(/\/purchases\/([^\/]+)/);
    
    if (purchaseIdMatch) {
      const purchaseId = purchaseIdMatch[1];
      await window.queryClient.invalidateQueries(['purchase', purchaseId]);
      await window.queryClient.refetchQueries(['purchase', purchaseId]);
      console.log('✅ Refetch complete');
    }
  } else {
    console.log('❌ React Query not available');
  }
}

// Test update function
async function testQuickUpdate() {
  if (!window.supabase) {
    console.error('❌ Supabase not available');
    return;
  }

  const currentUrl = window.location.pathname;
  const purchaseIdMatch = currentUrl.match(/\/purchases\/([^\/]+)/);
  
  if (!purchaseIdMatch) {
    console.error('❌ No purchase ID found');
    return;
  }

  const purchaseId = purchaseIdMatch[1];
  const testInvoice = `TEST-${Date.now()}`;
  
  console.log(`🧪 Testing quick update with invoice: ${testInvoice}`);
  
  try {
    const { error } = await window.supabase
      .from('purchases')
      .update({ 
        invoice_number: testInvoice,
        updated_at: new Date().toISOString()
      })
      .eq('id', purchaseId);

    if (error) {
      console.error('❌ Update failed:', error);
      return;
    }

    console.log('✅ Update successful!');
    console.log('⏳ Waiting 2 seconds then checking...');
    
    setTimeout(async () => {
      await quickInvoiceDebug();
      console.log('\n🧹 Cleaning up test data...');
      
      // Clean up
      await window.supabase
        .from('purchases')
        .update({ 
          invoice_number: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', purchaseId);
        
      console.log('✅ Test data cleaned up');
    }, 2000);

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Make functions available globally
window.quickInvoiceDebug = quickInvoiceDebug;
window.refetchPurchaseData = refetchPurchaseData;
window.testQuickUpdate = testQuickUpdate;

// Auto-run
quickInvoiceDebug();

console.log('\n🚀 Available commands:');
console.log('  quickInvoiceDebug() - Check invoice display status');
console.log('  refetchPurchaseData() - Force refresh data');
console.log('  testQuickUpdate() - Test update and check result');
