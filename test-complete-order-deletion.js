// Test the complete order deletion functionality after applying the SQL fix
// This script will test the end-to-end order deletion process

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompleteOrderDeletion() {
    console.log('🧪 Testing Complete Order Deletion Functionality');
    console.log('================================================');

    try {
        // First, let's find an order that has related records to test with
        console.log('\n1. Finding orders with related records...');
        
        const { data: ordersWithRelations, error: findError } = await supabase
            .from('orders')
            .select(`
                id,
                order_number,
                job_cards:job_cards(
                    id,
                    cutting_jobs:cutting_jobs(id),
                    printing_jobs:printing_jobs(id),
                    stitching_jobs:stitching_jobs(id)
                ),
                order_dispatches:order_dispatches(
                    id,
                    dispatch_batches:dispatch_batches(id)
                ),
                order_components:order_components(id),
                transactions:transactions(id)
            `)
            .limit(5);

        if (findError) {
            console.error('❌ Error finding orders:', findError);
            return;
        }

        console.log('📋 Found orders with relations:', ordersWithRelations?.length || 0);
        
        // Display the first few orders and their relations
        ordersWithRelations?.slice(0, 3).forEach((order, index) => {
            const jobCardCount = order.job_cards?.length || 0;
            const dispatchCount = order.order_dispatches?.length || 0;
            const componentCount = order.order_components?.length || 0;
            const transactionCount = order.transactions?.length || 0;
            
            console.log(`\n📦 Order ${index + 1}: ${order.order_number} (ID: ${order.id})`);
            console.log(`   - Job Cards: ${jobCardCount}`);
            console.log(`   - Dispatches: ${dispatchCount}`);
            console.log(`   - Components: ${componentCount}`);
            console.log(`   - Transactions: ${transactionCount}`);
        });

        // Select the first order with relations for testing
        const testOrder = ordersWithRelations?.find(order => 
            (order.job_cards?.length > 0) || 
            (order.order_dispatches?.length > 0) || 
            (order.order_components?.length > 0) ||
            (order.transactions?.length > 0)
        );

        if (!testOrder) {
            console.log('\n⚠️  No orders with related records found for testing');
            console.log('   Creating a simple test by just checking function existence...');
            
            // Test function call with a non-existent order ID
            const { data: testResult, error: testError } = await supabase
                .rpc('delete_order_completely', { p_order_id: '00000000-0000-0000-0000-000000000000' });
            
            if (testError) {
                if (testError.message.includes('does not exist')) {
                    console.log('✅ Function is working - correctly detected non-existent order');
                } else {
                    console.error('❌ Unexpected error:', testError);
                }
            }
            return;
        }

        console.log(`\n🎯 Selected test order: ${testOrder.order_number} (ID: ${testOrder.id})`);
        
        // Before deletion, let's capture the current state
        console.log('\n2. Capturing pre-deletion state...');
        const preState = {
            jobCards: testOrder.job_cards?.length || 0,
            dispatches: testOrder.order_dispatches?.length || 0,
            components: testOrder.order_components?.length || 0,
            transactions: testOrder.transactions?.length || 0
        };
        
        console.log('📊 Pre-deletion counts:', preState);

        // Ask for confirmation before proceeding
        console.log('\n⚠️  WARNING: This will permanently delete the order and all related records!');
        console.log('   To proceed, uncomment the deletion code below and run again.');
        
        // UNCOMMENT THE FOLLOWING LINES TO ACTUALLY TEST DELETION
        /*
        console.log('\n3. Executing order deletion...');
        
        const { data: deleteResult, error: deleteError } = await supabase
            .rpc('delete_order_completely', { p_order_id: testOrder.id });

        if (deleteError) {
            console.error('❌ Order deletion failed:', deleteError);
            console.error('   Error details:', deleteError.details);
            console.error('   Error hint:', deleteError.hint);
            return;
        }

        console.log('✅ Order deletion result:', deleteResult);

        // Verify the order and related records are gone
        console.log('\n4. Verifying deletion...');
        
        const { data: verifyOrder, error: verifyError } = await supabase
            .from('orders')
            .select('id')
            .eq('id', testOrder.id)
            .single();

        if (verifyError && verifyError.code === 'PGRST116') {
            console.log('✅ Order successfully deleted');
        } else if (verifyOrder) {
            console.error('❌ Order still exists after deletion');
        } else {
            console.error('❌ Unexpected error verifying deletion:', verifyError);
        }

        // Check related records
        const { data: remainingJobCards } = await supabase
            .from('job_cards')
            .select('id')
            .eq('order_id', testOrder.id);

        const { data: remainingDispatches } = await supabase
            .from('order_dispatches')
            .select('id')
            .eq('order_id', testOrder.id);

        const { data: remainingComponents } = await supabase
            .from('order_components')
            .select('id')
            .eq('order_id', testOrder.id);

        const { data: remainingTransactions } = await supabase
            .from('transactions')
            .select('id')
            .eq('order_id', testOrder.id);

        console.log('\n📊 Post-deletion verification:');
        console.log(`   - Remaining job cards: ${remainingJobCards?.length || 0}`);
        console.log(`   - Remaining dispatches: ${remainingDispatches?.length || 0}`);
        console.log(`   - Remaining components: ${remainingComponents?.length || 0}`);
        console.log(`   - Remaining transactions: ${remainingTransactions?.length || 0}`);

        if ((remainingJobCards?.length || 0) === 0 &&
            (remainingDispatches?.length || 0) === 0 &&
            (remainingComponents?.length || 0) === 0 &&
            (remainingTransactions?.length || 0) === 0) {
            console.log('✅ All related records successfully deleted!');
        } else {
            console.log('⚠️  Some related records may still exist');
        }
        */

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

// Run the test
testCompleteOrderDeletion();
