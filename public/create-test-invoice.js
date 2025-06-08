// Test script to create a sales invoice for testing edit functionality
// Run this in browser console at http://localhost:8097/

async function createTestInvoice() {
  console.log('🏗️ Creating test sales invoice...');
  
  try {
    // Import supabase - adjust path as needed
    let supabase;
    try {
      const module = await import('./src/integrations/supabase/client.js');
      supabase = module.supabase;
    } catch (e) {
      console.log('Trying alternative import...');
      // For production/built apps
      supabase = window.supabase;
    }
    
    if (!supabase) {
      console.error('❌ Could not access Supabase client');
      return;
    }
    
    console.log('✅ Supabase client loaded');
    
    // First, let's check if we have any completed orders to link to
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, company_name, quantity, rate')
      .eq('status', 'completed')
      .limit(1);
      
    let orderId = null;
    let orderData = {
      company_name: 'Test Company',
      quantity: 100,
      rate: 50
    };
    
    if (orders && orders.length > 0) {
      orderId = orders[0].id;
      orderData = {
        company_name: orders[0].company_name || 'Test Company',
        quantity: orders[0].quantity || 100,
        rate: orders[0].rate || 50
      };
      console.log('✅ Found completed order to link to:', orders[0]);
    } else {
      console.log('⚠️ No completed orders found, creating standalone invoice');
    }
    
    // Create test invoice data
    const testInvoice = {
      order_id: orderId,
      invoice_number: `TEST-${Date.now()}`,
      company_name: orderData.company_name,
      product_name: 'Test Product',
      quantity: orderData.quantity,
      rate: orderData.rate,
      transport_included: false,
      transport_charge: 0,
      gst_percentage: 18,
      gst_amount: (orderData.quantity * orderData.rate * 18) / 100,
      other_expenses: 0,
      subtotal: orderData.quantity * orderData.rate,
      total_amount: (orderData.quantity * orderData.rate) + ((orderData.quantity * orderData.rate * 18) / 100),
      notes: 'Test invoice created for debugging edit functionality'
    };
    
    console.log('📋 Creating invoice with data:', testInvoice);
    
    // Insert the test invoice
    const { data: invoice, error } = await supabase
      .from('sales_invoices')
      .insert(testInvoice)
      .select()
      .single();
      
    if (error) {
      console.error('❌ Error creating test invoice:', error);
      return;
    }
    
    console.log('✅ Test invoice created successfully:', invoice);
    
    // Navigate to the edit page
    const editUrl = `/sells/invoice/${invoice.id}/edit`;
    console.log(`🎯 Navigating to edit page: ${editUrl}`);
    
    window.location.href = editUrl;
    
    return invoice;
    
  } catch (error) {
    console.error('❌ Error in createTestInvoice:', error);
  }
}

// Also create a function to check existing invoices
async function checkExistingInvoices() {
  console.log('🔍 Checking for existing sales invoices...');
  
  try {
    let supabase;
    try {
      const module = await import('./src/integrations/supabase/client.js');
      supabase = module.supabase;
    } catch (e) {
      supabase = window.supabase;
    }
    
    if (!supabase) {
      console.error('❌ Could not access Supabase client');
      return;
    }
    
    const { data: invoices, error } = await supabase
      .from('sales_invoices')
      .select('id, invoice_number, company_name, total_amount, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (error) {
      console.error('❌ Error fetching invoices:', error);
      return;
    }
    
    if (!invoices || invoices.length === 0) {
      console.log('📝 No existing sales invoices found');
      console.log('💡 Running createTestInvoice() to create one...');
      return createTestInvoice();
    }
    
    console.log('✅ Found existing invoices:', invoices);
    
    const firstInvoice = invoices[0];
    const editUrl = `/sells/invoice/${firstInvoice.id}/edit`;
    console.log(`🎯 Navigating to edit page for: ${firstInvoice.invoice_number}`);
    console.log(`📍 URL: ${editUrl}`);
    
    window.location.href = editUrl;
    
    return invoices;
    
  } catch (error) {
    console.error('❌ Error in checkExistingInvoices:', error);
  }
}

console.log('🎯 Available functions:');
console.log('- checkExistingInvoices() - Check for existing invoices and navigate to edit');
console.log('- createTestInvoice() - Create a new test invoice and navigate to edit');
console.log('');
console.log('🚀 Running checkExistingInvoices() automatically...');

// Auto-run the check
checkExistingInvoices();
