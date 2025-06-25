/**
 * Verification script for job card consumption transaction order date implementation
 * This script verifies that job card transactions now include order creation dates
 * similar to how purchase transactions show purchase dates
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://agilfkhwcaxqtdvnzumx.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnaWxma2h3Y2F4cXRkdm56dW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MzM4NDEsImV4cCI6MjA1MDUwOTg0MX0.1t7K1qVeJH4wOyHkeFu7jbFPpd5CnCIZRlM04oaOygo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyImplementation() {
  console.log('🔍 VERIFYING JOB CARD ORDER DATE IMPLEMENTATION');
  console.log('='.repeat(60));

  try {
    // Step 1: Check recent job card consumption transactions
    console.log('\n📋 Step 1: Checking recent job card consumption transactions...');
    
    const { data: transactions, error: transError } = await supabase
      .from('inventory_transaction_log')
      .select(`
        id,
        material_id,
        transaction_type,
        quantity,
        reference_type,
        reference_id,
        reference_number,
        transaction_date,
        metadata,
        inventory (
          material_name
        )
      `)
      .eq('reference_type', 'JobCard')
      .eq('transaction_type', 'consumption')
      .order('transaction_date', { ascending: false })
      .limit(5);

    if (transError) {
      console.error('❌ Error fetching transactions:', transError);
      return;
    }

    console.log(`✅ Found ${transactions?.length || 0} recent job card consumption transactions`);

    if (transactions && transactions.length > 0) {
      console.log('\n📊 Transaction Details:');
      transactions.forEach((trans, index) => {
        console.log(`\n${index + 1}. Transaction ID: ${trans.id}`);
        console.log(`   Material: ${trans.inventory?.material_name || 'Unknown'}`);
        console.log(`   Reference: ${trans.reference_number}`);
        console.log(`   Transaction Date: ${new Date(trans.transaction_date).toLocaleDateString()}`);
        
        // Check if order_date is in metadata
        if (trans.metadata && typeof trans.metadata === 'object') {
          const metadata = trans.metadata;
          console.log(`   Metadata keys: ${Object.keys(metadata).join(', ')}`);
          
          if (metadata.order_date) {
            console.log(`   ✅ Order Creation Date: ${new Date(metadata.order_date).toLocaleDateString()}`);
          } else {
            console.log(`   ⚠️  Order date missing from metadata`);
          }
          
          if (metadata.order_number) {
            console.log(`   Order Number: ${metadata.order_number}`);
          }
        } else {
          console.log(`   ❌ No metadata found`);
        }
      });
    }

    // Step 2: Check recent job card reversal transactions
    console.log('\n📋 Step 2: Checking recent job card reversal transactions...');
    
    const { data: reversals, error: revError } = await supabase
      .from('inventory_transaction_log')
      .select(`
        id,
        material_id,
        transaction_type,
        quantity,
        reference_type,
        reference_id,
        reference_number,
        transaction_date,
        metadata,
        inventory (
          material_name
        )
      `)
      .eq('reference_type', 'JobCard')
      .eq('transaction_type', 'job-card-reversal')
      .order('transaction_date', { ascending: false })
      .limit(3);

    if (revError) {
      console.error('❌ Error fetching reversals:', revError);
      return;
    }

    console.log(`✅ Found ${reversals?.length || 0} recent job card reversal transactions`);

    if (reversals && reversals.length > 0) {
      console.log('\n📊 Reversal Details:');
      reversals.forEach((rev, index) => {
        console.log(`\n${index + 1}. Reversal ID: ${rev.id}`);
        console.log(`   Material: ${rev.inventory?.material_name || 'Unknown'}`);
        console.log(`   Reference: ${rev.reference_number}`);
        console.log(`   Transaction Date: ${new Date(rev.transaction_date).toLocaleDateString()}`);
        
        // Check if order_date is in metadata
        if (rev.metadata && typeof rev.metadata === 'object') {
          const metadata = rev.metadata;
          
          if (metadata.order_date) {
            console.log(`   ✅ Order Creation Date: ${new Date(metadata.order_date).toLocaleDateString()}`);
          } else {
            console.log(`   ⚠️  Order date missing from metadata`);
          }
        }
      });
    }

    // Step 3: Check sample order for reference
    console.log('\n📋 Step 3: Checking sample order data...');
    
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, order_date, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

    if (orderError) {
      console.error('❌ Error fetching orders:', orderError);
      return;
    }

    if (orders && orders.length > 0) {
      console.log('\n📊 Recent Orders:');
      orders.forEach((order, index) => {
        console.log(`${index + 1}. ${order.order_number}`);
        console.log(`   Order Date: ${new Date(order.order_date).toLocaleDateString()}`);
        console.log(`   Created: ${new Date(order.created_at).toLocaleDateString()}`);
      });
    }

    // Step 4: Summary
    console.log('\n🎯 IMPLEMENTATION STATUS SUMMARY:');
    console.log('='.repeat(60));

    const hasConsumptions = transactions && transactions.length > 0;
    const hasOrderDatesInConsumptions = hasConsumptions && 
      transactions.some(t => t.metadata && t.metadata.order_date);
    
    const hasReversals = reversals && reversals.length > 0;
    const hasOrderDatesInReversals = hasReversals && 
      reversals.some(r => r.metadata && r.metadata.order_date);

    console.log(`✅ Job card consumption transactions: ${hasConsumptions ? 'Found' : 'None found'}`);
    console.log(`${hasOrderDatesInConsumptions ? '✅' : '❌'} Order dates in consumption metadata: ${hasOrderDatesInConsumptions ? 'Present' : 'Missing'}`);
    console.log(`✅ Job card reversal transactions: ${hasReversals ? 'Found' : 'None found'}`);
    console.log(`${hasOrderDatesInReversals ? '✅' : '❌'} Order dates in reversal metadata: ${hasOrderDatesInReversals ? 'Present' : 'Missing'}`);

    if (hasOrderDatesInConsumptions && hasOrderDatesInReversals) {
      console.log('\n🎉 SUCCESS: Order dates are being included in both consumption and reversal transactions!');
      console.log('📱 The TransactionHistory component should now display order creation dates for job card transactions.');
    } else if (!hasConsumptions && !hasReversals) {
      console.log('\n📝 NOTE: No recent job card transactions found. Create a new job card to test the implementation.');
    } else {
      console.log('\n⚠️  PARTIAL: Some transactions missing order dates. Check recent implementations.');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run verification
verifyImplementation().then(() => {
  console.log('\n✅ Verification complete.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Verification error:', error);
  process.exit(1);
});
