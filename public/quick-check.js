// Quick database check and test script
// Run this in browser console

async function quickCheck() {
    console.log('🔍 Quick database check...');
    
    try {
        // Import supabase if available
        const { supabase } = await import('/src/integrations/supabase/client.js');
        window.supabase = supabase;
        
        // Check for existing sales invoices
        const { data: invoices, error: invoiceError } = await supabase
            .from('sales_invoices')
            .select('id, invoice_number, company_name, total_amount, created_at')
            .order('created_at', { ascending: false })
            .limit(3);
            
        if (invoiceError) {
            console.error('Error fetching invoices:', invoiceError);
        } else {
            console.log('📄 Existing sales invoices:', invoices);
            
            if (invoices && invoices.length > 0) {
                const firstInvoice = invoices[0];
                console.log(`🎯 Found invoice to test with: ${firstInvoice.invoice_number}`);
                console.log(`📍 Edit URL: /sells/invoice/${firstInvoice.id}/edit`);
                
                // Navigate to edit page
                window.location.href = `/sells/invoice/${firstInvoice.id}/edit`;
                return;
            }
        }
        
        // If no invoices, check for completed orders to create one
        const { data: orders, error: orderError } = await supabase
            .from('orders')
            .select('id, order_number, company_name, status')
            .eq('status', 'completed')
            .limit(3);
            
        if (orderError) {
            console.error('Error fetching orders:', orderError);
        } else {
            console.log('📋 Completed orders:', orders);
            
            if (orders && orders.length > 0) {
                const firstOrder = orders[0];
                console.log(`🏗️ No invoices found. Creating one from order: ${firstOrder.order_number}`);
                console.log(`📍 Create URL: /sells/create/${firstOrder.id}`);
                
                // Navigate to create page
                window.location.href = `/sells/create/${firstOrder.id}`;
                return;
            }
        }
        
        console.log('❌ No completed orders or sales invoices found');
        console.log('💡 You may need to:');
        console.log('   1. Create some orders');
        console.log('   2. Mark them as completed');
        console.log('   3. Create sales invoices from them');
        
    } catch (error) {
        console.error('Error in quick check:', error);
    }
}

// Load the debug script as well
const script = document.createElement('script');
script.src = '/debug-sales-edit-test.js';
document.head.appendChild(script);

// Run the quick check
quickCheck();
