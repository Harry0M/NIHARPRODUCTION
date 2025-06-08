// Debug file for testing sales invoice edit functionality
// Run this in the browser console on a sales invoice edit page

window.debugSalesEdit = {
  // Test the supabase connection
  async testConnection() {
    try {
      const { data, error } = await window.supabase
        .from('sales_invoices')
        .select('id, invoice_number, company_name')
        .limit(1);
      
      console.log('Connection test:', { data, error });
      return { success: !error, data, error };
    } catch (err) {
      console.error('Connection error:', err);
      return { success: false, error: err };
    }
  },

  // Test a simple update operation
  async testUpdate(invoiceId) {
    if (!invoiceId) {
      console.error('Invoice ID is required');
      return;
    }

    try {
      console.log('Testing update for invoice:', invoiceId);
      
      // First get the current data
      const { data: current, error: fetchError } = await window.supabase
        .from('sales_invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (fetchError) throw fetchError;
      
      console.log('Current invoice data:', current);

      // Try a simple update (just updating the updated_at field)
      const { data: updated, error: updateError } = await window.supabase
        .from('sales_invoices')
        .update({
          updated_at: new Date().toISOString(),
          notes: (current.notes || '') + ' [Debug test]'
        })
        .eq('id', invoiceId)
        .select();

      console.log('Update result:', { updated, updateError });
      
      if (updateError) {
        console.error('Update failed:', updateError);
        return { success: false, error: updateError };
      } else {
        console.log('✅ Update successful!');
        return { success: true, data: updated };
      }
    } catch (err) {
      console.error('Test update failed:', err);
      return { success: false, error: err };
    }
  },

  // Get all sales invoices
  async getAllInvoices() {
    try {
      const { data, error } = await window.supabase
        .from('sales_invoices')
        .select('id, invoice_number, company_name, total_amount, created_at')
        .order('created_at', { ascending: false });
      
      console.log('All invoices:', data);
      return { data, error };
    } catch (err) {
      console.error('Error fetching invoices:', err);
      return { error: err };
    }
  },

  // Check current user auth
  async checkAuth() {
    try {
      const { data: { user }, error } = await window.supabase.auth.getUser();
      console.log('Current user:', user);
      console.log('Auth error:', error);
      return { user, error };
    } catch (err) {
      console.error('Auth check failed:', err);
      return { error: err };
    }
  }
};

console.log('Debug tools loaded. Available functions:');
console.log('- debugSalesEdit.testConnection()');
console.log('- debugSalesEdit.testUpdate(invoiceId)');
console.log('- debugSalesEdit.getAllInvoices()');
console.log('- debugSalesEdit.checkAuth()');
