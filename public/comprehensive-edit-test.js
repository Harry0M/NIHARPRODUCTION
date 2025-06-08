// Comprehensive test script for Sales Invoice Edit debugging
// Copy and paste this entire script into browser console at http://localhost:8097/

console.log('🧪 Sales Invoice Edit Debug Script Loaded');

window.salesEditDebug = {
  
  // Step 1: Check authentication status
  checkAuth: async function() {
    console.log('🔐 Checking authentication status...');
    
    try {
      // Try to get supabase from the global scope or import it
      let supabase;
      if (window.supabase) {
        supabase = window.supabase;
      } else {
        try {
          const module = await import('./src/integrations/supabase/client.js');
          supabase = module.supabase;
          window.supabase = supabase; // Make it globally available
        } catch (e) {
          console.error('❌ Could not import supabase client:', e);
          return null;
        }
      }
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Auth error:', error);
        return null;
      }
      
      if (user) {
        console.log('✅ User authenticated:', { id: user.id, email: user.email });
        return { supabase, user };
      } else {
        console.log('⚠️ User not authenticated');
        console.log('💡 This might cause RLS policy issues when updating invoices');
        return { supabase, user: null };
      }
      
    } catch (error) {
      console.error('❌ Error checking auth:', error);
      return null;
    }
  },
  
  // Step 2: Create a test invoice if none exists
  createTestInvoice: async function() {
    console.log('🏗️ Creating test invoice...');
    
    const authResult = await this.checkAuth();
    if (!authResult) return null;
    
    const { supabase, user } = authResult;
    
    try {
      // Create a test invoice with current user as created_by
      const testInvoice = {
        invoice_number: `TEST-EDIT-${Date.now()}`,
        company_name: 'Test Company for Edit',
        product_name: 'Test Product',
        quantity: 100,
        rate: 25.50,
        transport_included: false,
        transport_charge: 0,
        gst_percentage: 18,
        gst_amount: 459, // 100 * 25.50 * 0.18
        other_expenses: 50,
        subtotal: 2550, // 100 * 25.50
        total_amount: 3059, // 2550 + 459 + 50
        notes: 'Test invoice created for debugging edit functionality',
        created_by: user?.id // Important: set the created_by field
      };
      
      console.log('📋 Creating invoice with data:', testInvoice);
      
      const { data: invoice, error } = await supabase
        .from('sales_invoices')
        .insert(testInvoice)
        .select()
        .single();
        
      if (error) {
        console.error('❌ Error creating test invoice:', error);
        return null;
      }
      
      console.log('✅ Test invoice created successfully:', invoice);
      return invoice;
      
    } catch (error) {
      console.error('❌ Error in createTestInvoice:', error);
      return null;
    }
  },
  
  // Step 3: Find existing invoice or create one
  getTestInvoice: async function() {
    console.log('🔍 Looking for existing invoices...');
    
    const authResult = await this.checkAuth();
    if (!authResult) return null;
    
    const { supabase, user } = authResult;
    
    try {
      // First try to find existing invoices
      const { data: invoices, error } = await supabase
        .from('sales_invoices')
        .select('id, invoice_number, company_name, created_by, total_amount')
        .order('created_at', { ascending: false })
        .limit(3);
        
      if (error) {
        console.error('❌ Error fetching invoices:', error);
        return null;
      }
      
      if (invoices && invoices.length > 0) {
        console.log('✅ Found existing invoices:', invoices);
        
        // Check ownership if user is authenticated
        if (user) {
          const ownedInvoices = invoices.filter(inv => inv.created_by === user.id);
          if (ownedInvoices.length > 0) {
            console.log('✅ Found invoices owned by current user:', ownedInvoices);
            return ownedInvoices[0];
          } else {
            console.log('⚠️ Found invoices but none owned by current user');
            console.log('💡 Creating new invoice owned by current user...');
            return await this.createTestInvoice();
          }
        } else {
          console.log('⚠️ User not authenticated, using first available invoice');
          return invoices[0];
        }
      } else {
        console.log('📝 No existing invoices found, creating one...');
        return await this.createTestInvoice();
      }
      
    } catch (error) {
      console.error('❌ Error in getTestInvoice:', error);
      return null;
    }
  },
  
  // Step 4: Navigate to edit page
  navigateToEdit: async function(invoice) {
    if (!invoice) {
      console.log('❌ No invoice provided');
      return;
    }
    
    const editUrl = `/sells/invoice/${invoice.id}/edit`;
    console.log(`🎯 Navigating to edit page: ${editUrl}`);
    console.log(`📄 Invoice: ${invoice.invoice_number} - ${invoice.company_name}`);
    
    // Store invoice info for later reference
    window.testInvoice = invoice;
    
    window.location.href = editUrl;
  },
  
  // Step 5: Test the edit form (run after navigation)
  testEditForm: function() {
    console.log('🧪 Testing edit form...');
    
    // Check if we're on the edit page
    if (!window.location.pathname.includes('/edit')) {
      console.log('❌ Not on edit page. Current URL:', window.location.pathname);
      return false;
    }
    
    // Wait for form to load
    setTimeout(() => {
      const form = document.querySelector('form');
      if (!form) {
        console.log('❌ Form not found');
        return;
      }
      
      console.log('✅ Form found');
      
      // Find form fields
      const otherExpensesField = document.querySelector('input[id="otherExpenses"], input[name="otherExpenses"]');
      if (otherExpensesField) {
        console.log('✅ Other expenses field found');
        
        const originalValue = otherExpensesField.value;
        const newValue = (parseFloat(originalValue) || 0) + 1;
        
        console.log(`📝 Changing other expenses from ${originalValue} to ${newValue}`);
        
        otherExpensesField.value = newValue.toString();
        otherExpensesField.dispatchEvent(new Event('input', { bubbles: true }));
        otherExpensesField.dispatchEvent(new Event('change', { bubbles: true }));
        
        console.log('✅ Field updated');
        console.log('🎯 Now look for and click the Save button');
        
        // Look for save button
        const saveButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent?.includes('Save') || btn.textContent?.includes('Update')
        );
        
        if (saveButton) {
          console.log('✅ Save button found:', saveButton.textContent);
          console.log('🎯 Click it to test the save functionality');
          
          // Highlight the button
          saveButton.style.border = '3px solid red';
          saveButton.style.backgroundColor = 'yellow';
          
          return { saveButton, originalValue, newValue };
        } else {
          console.log('❌ Save button not found');
        }
      } else {
        console.log('❌ Other expenses field not found');
      }
    }, 1000);
    
    return true;
  },
  
  // Step 6: Run complete test
  runCompleteTest: async function() {
    console.log('🚀 Running complete edit test...');
    
    // Step 1: Check auth
    const authResult = await this.checkAuth();
    if (!authResult) {
      console.log('❌ Authentication check failed');
      return;
    }
    
    // Step 2: Get or create test invoice
    const invoice = await this.getTestInvoice();
    if (!invoice) {
      console.log('❌ Could not get or create test invoice');
      return;
    }
    
    // Step 3: Navigate to edit page
    this.navigateToEdit(invoice);
    
    // Step 4: Set up test form function to run after navigation
    setTimeout(() => {
      window.salesEditDebug.testEditForm();
    }, 2000);
  },
  
  // Utility: Fix RLS policies (run this if you have database access)
  generateRLSFix: function() {
    console.log('🔧 RLS Policy Fix SQL:');
    console.log('Copy and run this in your database:');
    console.log('');
    console.log('-- Fix RLS policy for sales invoice updates');
    console.log('DROP POLICY IF EXISTS "Users can update their own sales invoices" ON sales_invoices;');
    console.log('CREATE POLICY "Users can update sales invoices" ON sales_invoices FOR UPDATE USING (true);');
    console.log('');
    console.log('-- Or if you want to keep user restriction but handle null created_by:');
    console.log('-- CREATE POLICY "Users can update their invoices or unowned" ON sales_invoices');
    console.log('-- FOR UPDATE USING (created_by = auth.uid() OR created_by IS NULL);');
  }
};

// Auto-run the complete test
console.log('🎯 Available commands:');
console.log('- salesEditDebug.checkAuth()');
console.log('- salesEditDebug.createTestInvoice()');
console.log('- salesEditDebug.getTestInvoice()');
console.log('- salesEditDebug.runCompleteTest()');
console.log('- salesEditDebug.testEditForm() (run after navigating to edit page)');
console.log('- salesEditDebug.generateRLSFix()');
console.log('');
console.log('🚀 Starting automatic test in 2 seconds...');

setTimeout(() => {
  window.salesEditDebug.runCompleteTest();
}, 2000);
