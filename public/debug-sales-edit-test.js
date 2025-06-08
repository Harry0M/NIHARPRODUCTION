// Debug script for testing sales invoice edit functionality
// Load this in browser console at http://localhost:8097/

console.log('🔧 Sales Invoice Edit Debug Toolkit Loaded');

window.debugSalesEdit = {
  // Navigate to sells page to find invoices
  goToSells: function() {
    console.log('📍 Navigating to Sells page...');
    window.location.href = '/sells';
  },
  
  // Find and navigate to first available invoice
  findFirstInvoice: async function() {
    console.log('🔍 Looking for existing sales invoices...');
    
    try {
      // Check if we have access to supabase
      if (typeof window.supabase === 'undefined') {
        console.log('⚠️ Supabase not accessible. Try running: window.supabase = supabase');
        return;
      }
      
      const { data: invoices, error } = await window.supabase
        .from('sales_invoices')
        .select('id, invoice_number, company_name, total_amount')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (error) {
        console.error('❌ Error fetching invoices:', error);
        return;
      }
      
      if (!invoices || invoices.length === 0) {
        console.log('📝 No sales invoices found. Need to create one first.');
        console.log('💡 Go to /sells and create an invoice from a completed order');
        return;
      }
      
      console.log('✅ Found invoices:', invoices);
      const firstInvoice = invoices[0];
      console.log(`🎯 Navigating to edit page for invoice: ${firstInvoice.invoice_number}`);
      
      window.location.href = `/sells/invoice/${firstInvoice.id}/edit`;
      
    } catch (error) {
      console.error('❌ Error:', error);
    }
  },
  
  // Test the edit form functionality
  testEditForm: function() {
    console.log('🧪 Testing edit form functionality...');
    
    // Check if form exists
    const form = document.querySelector('form');
    if (!form) {
      console.log('❌ Edit form not found on this page');
      return;
    }
    
    console.log('✅ Edit form found');
    
    // Test form fields
    const fields = {
      invoiceNumber: document.querySelector('input[name="invoiceNumber"], #invoiceNumber'),
      companyName: document.querySelector('input[name="companyName"], #companyName'),
      quantity: document.querySelector('input[name="quantity"], #quantity'),
      rate: document.querySelector('input[name="rate"], #rate'),
      gstPercentage: document.querySelector('input[name="gstPercentage"], #gstPercentage'),
      otherExpenses: document.querySelector('input[name="otherExpenses"], #otherExpenses')
    };
    
    console.log('📋 Form fields found:', Object.fromEntries(
      Object.entries(fields).map(([key, element]) => [key, !!element])
    ));
    
    // Test form data access
    console.log('📊 Current form values:');
    Object.entries(fields).forEach(([key, element]) => {
      if (element) {
        console.log(`  ${key}: ${element.value}`);
      }
    });
    
    return fields;
  },
  
  // Test making small changes to trigger save
  testFormChanges: function() {
    console.log('✏️ Testing form changes...');
    
    const fields = this.testEditForm();
    if (!fields.otherExpenses) {
      console.log('❌ Could not find otherExpenses field to test with');
      return;
    }
    
    // Save original value
    const originalValue = fields.otherExpenses.value;
    console.log(`💾 Original other expenses: ${originalValue}`);
    
    // Make a small change
    const testValue = originalValue ? (parseFloat(originalValue) + 1).toString() : '1';
    fields.otherExpenses.value = testValue;
    fields.otherExpenses.dispatchEvent(new Event('input', { bubbles: true }));
    fields.otherExpenses.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log(`✏️ Changed other expenses to: ${testValue}`);
    console.log('🎯 Now try clicking Save to test the update functionality');
    
    // Return function to restore original value
    return {
      restore: () => {
        fields.otherExpenses.value = originalValue;
        fields.otherExpenses.dispatchEvent(new Event('input', { bubbles: true }));
        console.log(`↩️ Restored other expenses to: ${originalValue}`);
      }
    };
  },
  
  // Test the save button
  testSaveButton: function() {
    console.log('💾 Testing save button...');
    
    const saveButton = document.querySelector('button[type="submit"], button:contains("Save"), button:contains("Update")');
    if (!saveButton) {
      console.log('❌ Save button not found');
      return;
    }
    
    console.log('✅ Save button found:', saveButton.textContent);
    console.log('🎯 Clicking save button...');
    
    // Add click event listener to monitor the save process
    const originalConsoleLog = console.log;
    console.log = function(...args) {
      if (args[0] && typeof args[0] === 'string') {
        if (args[0].includes('Form submitted') || 
            args[0].includes('Updating invoice') || 
            args[0].includes('Update result')) {
          originalConsoleLog.apply(console, ['🔍 CAPTURED:', ...args]);
        }
      }
      originalConsoleLog.apply(console, args);
    };
    
    // Click the save button
    saveButton.click();
    
    // Restore console.log after a short delay
    setTimeout(() => {
      console.log = originalConsoleLog;
    }, 5000);
  },
  
  // Direct database test
  testDirectUpdate: async function(invoiceId) {
    console.log('🔧 Testing direct database update...');
    
    if (!invoiceId) {
      console.log('❌ Please provide an invoice ID. Example: debugSalesEdit.testDirectUpdate("your-invoice-id")');
      return;
    }
    
    if (typeof window.supabase === 'undefined') {
      console.log('⚠️ Supabase not accessible');
      return;
    }
    
    try {
      // First fetch the current invoice
      const { data: currentInvoice, error: fetchError } = await window.supabase
        .from('sales_invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();
        
      if (fetchError) {
        console.error('❌ Error fetching invoice:', fetchError);
        return;
      }
      
      console.log('✅ Current invoice data:', currentInvoice);
      
      // Try a simple update
      const { data, error } = await window.supabase
        .from('sales_invoices')
        .update({ 
          other_expenses: (currentInvoice.other_expenses || 0) + 0.01,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .select();
        
      if (error) {
        console.error('❌ Update error:', error);
        return;
      }
      
      console.log('✅ Direct update successful:', data);
      
    } catch (error) {
      console.error('❌ Direct update failed:', error);
    }
  },
  
  // Run complete test suite
  runCompleteTest: async function() {
    console.log('🚀 Running complete edit functionality test...');
    
    // Step 1: Find an invoice to edit
    await this.findFirstInvoice();
    
    // Give some time for navigation and page load
    setTimeout(() => {
      console.log('⏱️ Page should have loaded. Run the following commands manually:');
      console.log('1. debugSalesEdit.testEditForm()');
      console.log('2. debugSalesEdit.testFormChanges()');
      console.log('3. debugSalesEdit.testSaveButton()');
    }, 2000);
  }
};

// Also make supabase available globally for debugging
if (typeof supabase !== 'undefined') {
  window.supabase = supabase;
  console.log('✅ Supabase client made available globally');
}

console.log('🎯 Available commands:');
console.log('- debugSalesEdit.goToSells()');
console.log('- debugSalesEdit.findFirstInvoice()');
console.log('- debugSalesEdit.testEditForm()');
console.log('- debugSalesEdit.testFormChanges()');
console.log('- debugSalesEdit.testSaveButton()');
console.log('- debugSalesEdit.testDirectUpdate(invoiceId)');
console.log('- debugSalesEdit.runCompleteTest()');
