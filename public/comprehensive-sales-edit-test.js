// Comprehensive Sales Invoice Edit Test & Fix Script
// Load this in browser console at http://localhost:8097/
// This script will diagnose the issue, test the fix, and verify the solution

console.log('🚀 Sales Invoice Edit Comprehensive Test Suite Loaded');

window.salesInvoiceTest = {
  // Step 1: Check current environment
  checkEnvironment: async function() {
    console.log('🔍 Step 1: Checking environment...');
    
    try {
      // Check if Supabase is available
      if (typeof supabase === 'undefined') {
        console.error('❌ Supabase client not available');
        console.log('💡 Make sure you are on the application page (http://localhost:8097)');
        return false;
      }
      
      window.supabase = supabase;
      console.log('✅ Supabase client available');
      
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ Authentication error:', authError);
        return false;
      }
      
      if (!user) {
        console.log('⚠️ User not authenticated');
        console.log('📝 Please log in first');
        return false;
      }
      
      console.log('✅ User authenticated:', user.email);
      this.currentUser = user;
      
      return true;
      
    } catch (error) {
      console.error('❌ Environment check failed:', error);
      return false;
    }
  },
  
  // Step 2: Find or create test data
  findTestInvoice: async function() {
    console.log('🔍 Step 2: Finding test invoice...');
    
    try {
      // Look for existing sales invoices
      const { data: invoices, error } = await supabase
        .from('sales_invoices')
        .select('id, invoice_number, company_name, created_by, total_amount, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (error) {
        console.error('❌ Error fetching invoices:', error);
        return null;
      }
      
      if (!invoices || invoices.length === 0) {
        console.log('📝 No sales invoices found');
        console.log('💡 You need to create a sales invoice first:');
        console.log('   1. Go to /sells');
        console.log('   2. Find a completed order');
        console.log('   3. Click "Create Invoice"');
        return null;
      }
      
      console.log(`✅ Found ${invoices.length} sales invoices:`);
      invoices.forEach((invoice, index) => {
        const ownership = invoice.created_by === this.currentUser?.id ? '(YOURS)' : '(OTHER USER)';
        console.log(`  ${index + 1}. ${invoice.invoice_number} - ${invoice.company_name} - ₹${invoice.total_amount} ${ownership}`);
      });
      
      // Use the first invoice for testing
      this.testInvoice = invoices[0];
      console.log('🎯 Selected for testing:', this.testInvoice.invoice_number);
      
      return this.testInvoice;
      
    } catch (error) {
      console.error('❌ Error finding test invoice:', error);
      return null;
    }
  },
  
  // Step 3: Test the current edit functionality
  testCurrentEdit: async function() {
    console.log('🧪 Step 3: Testing current edit functionality...');
    
    if (!this.testInvoice) {
      console.log('❌ No test invoice available');
      return false;
    }
    
    try {
      console.log('📋 Testing update on invoice:', this.testInvoice.invoice_number);
      console.log('👤 Invoice created by:', this.testInvoice.created_by);
      console.log('👤 Current user:', this.currentUser?.id);
      
      const isOwner = this.testInvoice.created_by === this.currentUser?.id;
      console.log(`🔐 Ownership check: ${isOwner ? 'OWNER' : 'NOT OWNER'}`);
      
      if (isOwner) {
        console.log('💡 This invoice belongs to you - update should work regardless of RLS policy');
      } else {
        console.log('🧪 This invoice belongs to another user - perfect for testing RLS policy issue');
      }
      
      // Attempt a harmless update (just touch updated_at)
      const testUpdateData = {
        updated_at: new Date().toISOString(),
        // Add a tiny change to notes to ensure update happens
        notes: this.testInvoice.notes ? this.testInvoice.notes + ' [test]' : 'Test update'
      };
      
      console.log('🔄 Attempting test update...');
      
      const { data, error } = await supabase
        .from('sales_invoices')
        .update(testUpdateData)
        .eq('id', this.testInvoice.id)
        .select();
        
      if (error) {
        console.error('❌ Update failed:', error.message);
        
        if (error.message.includes('row-level security') || 
            error.message.includes('policy') ||
            error.message.includes('permission') ||
            error.code === '42501') {
          console.error('🔒 CONFIRMED: This is an RLS (Row Level Security) policy issue');
          console.log('💡 The RLS policy is preventing updates to invoices not created by current user');
          this.rlsIssueConfirmed = true;
          return false;
        } else {
          console.error('❌ Different error:', error);
          return false;
        }
      }
      
      console.log('✅ Update successful:', data);
      console.log('🎉 No RLS issue detected - the edit functionality is working');
      
      // Revert the test change
      const revertData = {
        notes: this.testInvoice.notes
      };
      
      await supabase
        .from('sales_invoices')
        .update(revertData)
        .eq('id', this.testInvoice.id);
        
      console.log('↩️ Test changes reverted');
      
      return true;
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      return false;
    }
  },
  
  // Step 4: Guide through manual RLS fix
  guideThroughFix: function() {
    console.log('🛠️ Step 4: Guide to fix RLS policy...');
    
    if (!this.rlsIssueConfirmed) {
      console.log('❌ RLS issue not confirmed. Run the test first.');
      return;
    }
    
    console.log('🔧 RLS Policy Fix Required');
    console.log('='.repeat(60));
    
    const fixSQL = `-- Fix for sales invoice edit RLS policy issue
-- Run this in your Supabase SQL Editor

-- 1. Drop the restrictive policy
DROP POLICY IF EXISTS "Users can update their own sales invoices" ON sales_invoices;

-- 2. Create a more permissive policy
CREATE POLICY "Authenticated users can update sales invoices" ON sales_invoices
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- 3. Verify the policy was created
SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'sales_invoices' AND cmd = 'UPDATE';`;
    
    console.log(fixSQL);
    console.log('='.repeat(60));
    
    console.log('📋 Instructions:');
    console.log('1. Copy the SQL above');
    console.log('2. Go to your Supabase dashboard');
    console.log('3. Navigate to SQL Editor');
    console.log('4. Paste and run the SQL');
    console.log('5. Return here and run: salesInvoiceTest.verifyFix()');
    
    // Also copy to clipboard if possible
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fixSQL).then(() => {
        console.log('📋 SQL copied to clipboard!');
      }).catch(() => {
        console.log('⚠️ Could not copy to clipboard - please copy manually');
      });
    }
  },
  
  // Step 5: Verify the fix worked
  verifyFix: async function() {
    console.log('✅ Step 5: Verifying RLS fix...');
    
    if (!this.testInvoice) {
      console.log('❌ No test invoice available');
      return false;
    }
    
    try {
      console.log('🔄 Testing update after RLS fix...');
      
      const testUpdateData = {
        updated_at: new Date().toISOString(),
        notes: this.testInvoice.notes ? this.testInvoice.notes + ' [fix verified]' : 'Fix verified'
      };
      
      const { data, error } = await supabase
        .from('sales_invoices')
        .update(testUpdateData)
        .eq('id', this.testInvoice.id)
        .select();
        
      if (error) {
        console.error('❌ Update still failing:', error.message);
        console.log('🔧 The RLS fix may not have been applied correctly');
        console.log('💡 Please double-check the SQL was executed successfully');
        return false;
      }
      
      console.log('🎉 SUCCESS! Update worked after RLS fix');
      console.log('📋 Updated invoice:', data[0]);
      
      // Revert the test change
      const revertData = {
        notes: this.testInvoice.notes
      };
      
      await supabase
        .from('sales_invoices')
        .update(revertData)
        .eq('id', this.testInvoice.id);
        
      console.log('↩️ Test changes reverted');
      console.log('✅ Sales invoice edit functionality is now working!');
      
      return true;
      
    } catch (error) {
      console.error('❌ Verification failed:', error);
      return false;
    }
  },
  
  // Step 6: Test the actual edit form
  testEditForm: function() {
    console.log('🖥️ Step 6: Testing the edit form interface...');
    
    if (!this.testInvoice) {
      console.log('❌ No test invoice available');
      return;
    }
    
    const editUrl = `/sells/invoice/${this.testInvoice.id}/edit`;
    console.log(`🔗 Opening edit form: ${editUrl}`);
    
    // Navigate to the edit page
    window.location.href = editUrl;
    
    // Instructions for manual testing
    setTimeout(() => {
      console.log('📋 Manual testing instructions:');
      console.log('1. Make a small change (e.g., modify "Other Expenses")');
      console.log('2. Click "Save Changes"');
      console.log('3. Check console for detailed debug output');
      console.log('4. Verify the success message appears');
      console.log('5. Check that changes are actually saved to database');
    }, 2000);
  },
  
  // Run complete test suite
  runFullTest: async function() {
    console.log('🚀 Running complete test suite...');
    console.log('='.repeat(60));
    
    // Step 1: Environment check
    const envOk = await this.checkEnvironment();
    if (!envOk) {
      console.log('❌ Environment check failed. Cannot continue.');
      return;
    }
    
    // Step 2: Find test invoice
    const invoice = await this.findTestInvoice();
    if (!invoice) {
      console.log('❌ No test invoice available. Create one first.');
      return;
    }
    
    // Step 3: Test current functionality
    const editWorks = await this.testCurrentEdit();
    if (editWorks) {
      console.log('🎉 Edit functionality is already working!');
      console.log('💡 You can test the form manually with: salesInvoiceTest.testEditForm()');
      return;
    }
    
    if (this.rlsIssueConfirmed) {
      console.log('🔧 RLS issue confirmed. Providing fix instructions...');
      this.guideThroughFix();
    }
    
    console.log('='.repeat(60));
    console.log('🎯 Next steps:');
    console.log('1. Apply the SQL fix shown above');
    console.log('2. Run: salesInvoiceTest.verifyFix()');
    console.log('3. Run: salesInvoiceTest.testEditForm()');
  }
};

console.log('🎯 Available commands:');
console.log('  salesInvoiceTest.runFullTest() - Run complete diagnostic and fix');
console.log('  salesInvoiceTest.verifyFix() - Test after applying SQL fix');
console.log('  salesInvoiceTest.testEditForm() - Open edit form for manual testing');
console.log('');
console.log('💡 Start with: salesInvoiceTest.runFullTest()');
