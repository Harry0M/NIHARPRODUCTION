// Database verification script
// This can be run in Node.js to check database state

import { createClient } from '@supabase/supabase-js';

// You'll need to update these with your actual Supabase credentials
const supabaseUrl = 'your-supabase-url';
const supabaseKey = 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
    console.log('🔍 Checking database state...');
    
    try {
        // Check completed orders
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .eq('status', 'completed')
            .limit(5);
            
        if (ordersError) {
            console.error('Error fetching orders:', ordersError);
            return;
        }
        
        console.log(`📦 Found ${orders?.length || 0} completed orders:`);
        orders?.forEach((order, index) => {
            console.log(`  ${index + 1}. Order #${order.id} - ${order.company_name} - ${order.product_name}`);
        });
        
        // Check sales_invoices table
        const { data: invoices, error: invoicesError } = await supabase
            .from('sales_invoices')
            .select('*')
            .limit(5);
            
        if (invoicesError) {
            console.error('Error fetching invoices:', invoicesError);
        } else {
            console.log(`📄 Found ${invoices?.length || 0} sales invoices in database`);
        }
        
        // Check table structure
        console.log('\n📋 Checking table structure...');
        const { data: tableInfo } = await supabase
            .from('sales_invoices')
            .select('*')
            .limit(1);
            
        if (tableInfo && tableInfo.length > 0) {
            console.log('✓ sales_invoices table exists and is accessible');
            console.log('Columns:', Object.keys(tableInfo[0]));
        } else {
            console.log('✓ sales_invoices table exists (empty)');
        }
        
    } catch (error) {
        console.error('Database check failed:', error);
    }
}

// If you want to run this, update the Supabase credentials above
console.log('To run database check, update Supabase credentials and call checkDatabase()');

export { checkDatabase };
