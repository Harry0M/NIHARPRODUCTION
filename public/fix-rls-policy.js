// RLS Policy Fix Script
// Run this in browser console at http://localhost:8097/ to fix the sales invoice update issue
// This will make the RLS policy more permissive so authenticated users can update sales invoices

console.log('🔧 RLS Policy Fix Script Loaded');

window.fixRLSPolicy = {
  // Apply the RLS policy fix using Supabase client
  applyFix: async function() {
    console.log('🔨 Applying RLS policy fix for sales_invoices...');
    
    try {
      // Check if we have access to supabase
      if (typeof window.supabase === 'undefined') {
        console.log('⚠️ Supabase not accessible. Making it available...');
        // Try to get supabase from the global scope
        if (typeof supabase !== 'undefined') {
          window.supabase = supabase;
        } else {
          console.error('❌ Cannot access Supabase client. Make sure you are on the application page.');
          return;
        }
      }
      
      console.log('✅ Supabase client accessible');
      
      // First, let's check current policies
      console.log('🔍 Checking current RLS policies...');
      
      const { data: policies, error: policyError } = await window.supabase
        .rpc('exec_sql', { 
          sql: `SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
                FROM pg_policies 
                WHERE tablename = 'sales_invoices' AND cmd = 'UPDATE';`
        });
        
      if (policyError) {
        console.log('⚠️ Could not check policies directly (expected):', policyError.message);
        console.log('📝 This is normal - we will proceed with the fix via direct SQL execution');
      } else {
        console.log('📋 Current UPDATE policies:', policies);
      }
      
      // Apply the fix using SQL
      console.log('🔨 Dropping restrictive policy and creating permissive one...');
      
      const fixSQL = `
        -- Drop the restrictive policy
        DROP POLICY IF EXISTS "Users can update their own sales invoices" ON sales_invoices;
        
        -- Create a more permissive policy
        CREATE POLICY "Authenticated users can update sales invoices" ON sales_invoices
          FOR UPDATE USING (auth.uid() IS NOT NULL);
      `;
      
      // Since we can't execute raw SQL directly through the client, 
      // we'll use the rpc function if available, or provide manual instructions
      try {
        const { data: result, error: sqlError } = await window.supabase
          .rpc('exec_sql', { sql: fixSQL });
          
        if (sqlError) {
          throw sqlError;
        }
        
        console.log('✅ RLS policy fix applied successfully!');
        console.log('📋 Result:', result);
        
      } catch (sqlError) {
        console.log('⚠️ Could not apply fix via RPC (this is expected)');
        console.log('📝 Please apply this SQL manually in your Supabase SQL editor:');
        console.log('='.repeat(60));
        console.log(fixSQL);
        console.log('='.repeat(60));
        
        console.log('🔗 To apply the fix:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Paste the SQL above and run it');
        console.log('4. Return here and test the edit functionality');
        
        return { needsManualFix: true, sql: fixSQL };
      }
      
    } catch (error) {
      console.error('❌ Error applying RLS policy fix:', error);
      return { error: error.message };
    }
  },
  
  // Test if the fix worked by attempting a test update
  testFix: async function() {
    console.log('🧪 Testing if RLS policy fix worked...');
    
    try {
      if (typeof window.supabase === 'undefined') {
        console.error('❌ Supabase not accessible');
        return;
      }
      
      // Get current user
      const { data: { user }, error: authError } = await window.supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('⚠️ User not authenticated. Please log in first.');
        return;
      }
      
      console.log('👤 Current user:', user.email);
      
      // Try to find an existing invoice to test with
      const { data: invoices, error: fetchError } = await window.supabase
        .from('sales_invoices')
        .select('id, invoice_number, company_name, created_by, updated_at')
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (fetchError) {
        console.error('❌ Error fetching invoices:', fetchError);
        return;
      }
      
      if (!invoices || invoices.length === 0) {
        console.log('📝 No sales invoices found to test with');
        console.log('💡 Create an invoice first, then run this test');
        return;
      }
      
      const testInvoice = invoices[0];
      console.log('🎯 Testing with invoice:', testInvoice.invoice_number);
      console.log('👤 Invoice created by:', testInvoice.created_by);
      console.log('👤 Current user ID:', user.id);
      
      if (testInvoice.created_by === user.id) {
        console.log('✅ This invoice was created by current user - should work regardless');
      } else {
        console.log('🧪 This invoice was created by different user - perfect for testing RLS fix');
      }
      
      // Try a harmless update (just touch the updated_at field)
      const { data: updateResult, error: updateError } = await window.supabase
        .from('sales_invoices')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', testInvoice.id)
        .select();
        
      if (updateError) {
        console.error('❌ Update failed - RLS policy still blocking:', updateError);
        console.log('🔧 The RLS policy fix may not have been applied correctly');
        return { success: false, error: updateError.message };
      }
      
      console.log('✅ Update successful! RLS policy fix is working');
      console.log('📋 Updated invoice:', updateResult);
      
      return { success: true, invoice: updateResult[0] };
      
    } catch (error) {
      console.error('❌ Error testing RLS fix:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Quick helper to check authentication status
  checkAuth: async function() {
    console.log('🔐 Checking authentication status...');
    
    try {
      if (typeof window.supabase === 'undefined') {
        console.error('❌ Supabase not accessible');
        return;
      }
      
      const { data: { user }, error: authError } = await window.supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ Auth error:', authError);
        return;
      }
      
      if (!user) {
        console.log('⚠️ User not authenticated');
        console.log('📝 Please log in to test the functionality');
        return;
      }
      
      console.log('✅ User authenticated:', {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      });
      
      return user;
      
    } catch (error) {
      console.error('❌ Error checking auth:', error);
    }
  }
};

console.log('🎯 Available commands:');
console.log('  window.fixRLSPolicy.checkAuth() - Check if user is logged in');
console.log('  window.fixRLSPolicy.applyFix() - Apply the RLS policy fix');
console.log('  window.fixRLSPolicy.testFix() - Test if the fix worked');
console.log('');
console.log('💡 Start with: window.fixRLSPolicy.checkAuth()');
