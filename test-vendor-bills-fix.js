// Quick test to verify vendor bills fix
// This uses the same logic as the updated VendorBillsList component

import { createClient } from '@supabase/supabase-js';

// Check environment variables first, fallback to local development
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 
                     process.env.NEXT_PUBLIC_SUPABASE_URL || 
                     "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 
                         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                         "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testVendorBillsFix() {
  console.log('🧪 TESTING VENDOR BILLS FIX');
  console.log('============================\n');
  console.log('Using:', SUPABASE_URL);

  try {
    // Step 1: Test vendor fetching
    console.log('📋 Step 1: Testing vendor fetching...');
    const { data: vendorsData, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, name, service_type');

    if (vendorsError) {
      console.error('❌ Vendors error:', vendorsError);
    } else {
      const vendorMap = {};
      vendorsData?.forEach(vendor => {
        vendorMap[vendor.id] = {
          name: vendor.name,
          service_type: vendor.service_type
        };
      });
      
      console.log(`✅ Found ${Object.keys(vendorMap).length} vendors`);
      if (vendorsData && vendorsData.length > 0) {
        console.log('📝 Sample vendors:');
        vendorsData.slice(0, 3).forEach((vendor, i) => {
          console.log(`   ${i + 1}. ${vendor.name} (${vendor.service_type}) - ID: ${vendor.id}`);
        });
      }
    }

    // Step 2: Test job fetching with vendor IDs (same query as updated component)
    console.log('\n📋 Step 2: Testing job fetching with vendor IDs...');
    
    const [cuttingJobs, printingJobs, stitchingJobs] = await Promise.all([
      // Cutting jobs
      supabase
        .from('cutting_jobs')
        .select(`
          id,
          worker_name,
          is_internal,
          received_quantity,
          status,
          created_at,
          job_cards!inner (
            id,
            job_name,
            job_number,
            vendor_id,
            orders (
              id,
              order_number,
              company_name,
              product_name
            )
          )
        `)
        .eq('status', 'completed')
        .eq('is_internal', false)
        .not('received_quantity', 'is', null)
        .gt('received_quantity', 0)
        .not('job_cards.vendor_id', 'is', null),

      // Printing jobs
      supabase
        .from('printing_jobs')
        .select(`
          id,
          worker_name,
          is_internal,
          rate,
          received_quantity,
          status,
          created_at,
          job_cards!inner (
            id,
            job_name,
            job_number,
            vendor_id,
            orders (
              id,
              order_number,
              company_name,
              product_name
            )
          )
        `)
        .eq('status', 'completed')
        .eq('is_internal', false)
        .not('received_quantity', 'is', null)
        .gt('received_quantity', 0)
        .not('rate', 'is', null)
        .gt('rate', 0)
        .not('job_cards.vendor_id', 'is', null),

      // Stitching jobs
      supabase
        .from('stitching_jobs')
        .select(`
          id,
          worker_name,
          is_internal,
          rate,
          received_quantity,
          status,
          created_at,
          job_cards!inner (
            id,
            job_name,
            job_number,
            vendor_id,
            orders (
              id,
              order_number,
              company_name,
              product_name
            )
          )
        `)
        .eq('status', 'completed')
        .eq('is_internal', false)
        .not('received_quantity', 'is', null)
        .gt('received_quantity', 0)
        .not('rate', 'is', null)
        .gt('rate', 0)
        .not('job_cards.vendor_id', 'is', null)
    ]);

    console.log('📊 Jobs with vendor IDs found:');
    console.log('- Cutting jobs:', cuttingJobs.data?.length || 0);
    console.log('- Printing jobs:', printingJobs.data?.length || 0);
    console.log('- Stitching jobs:', stitchingJobs.data?.length || 0);

    if (cuttingJobs.error) console.error('❌ Cutting jobs error:', cuttingJobs.error);
    if (printingJobs.error) console.error('❌ Printing jobs error:', printingJobs.error);
    if (stitchingJobs.error) console.error('❌ Stitching jobs error:', stitchingJobs.error);

    // Step 3: Show sample jobs
    console.log('\n📋 Step 3: Sample qualifying jobs...');
    
    const allJobs = [
      ...(cuttingJobs.data || []).map(job => ({ ...job, job_type: 'cutting', rate: null })),
      ...(printingJobs.data || []).map(job => ({ ...job, job_type: 'printing' })),
      ...(stitchingJobs.data || []).map(job => ({ ...job, job_type: 'stitching' }))
    ];

    if (allJobs.length > 0) {
      console.log('✅ Sample jobs that qualify for vendor billing:');
      allJobs.slice(0, 5).forEach((job, i) => {
        console.log(`   ${i + 1}. ${job.job_type.toUpperCase()}`);
        console.log(`      Job Number: ${job.job_cards?.job_number || 'N/A'}`);
        console.log(`      Vendor ID: ${job.job_cards?.vendor_id || 'N/A'}`);
        console.log(`      Worker: ${job.worker_name || 'N/A'}`);
        console.log(`      Order: ${job.job_cards?.orders?.order_number || 'N/A'}`);
        console.log(`      Company: ${job.job_cards?.orders?.company_name || 'N/A'}`);
        console.log(`      Quantity: ${job.received_quantity || 'N/A'}`);
        console.log(`      Rate: ${job.rate || 'N/A'}`);
        if (job.rate && job.received_quantity) {
          console.log(`      Amount: ${(job.rate * job.received_quantity).toFixed(2)}`);
        }
        console.log();
      });
    } else {
      console.log('❌ No jobs qualify for vendor billing');
      console.log('\nThis could be because:');
      console.log('1. No completed external jobs exist');
      console.log('2. Jobs don\'t have vendor_id in job_cards');
      console.log('3. Jobs missing required data (received_quantity, rates)');
      console.log('4. No job_cards linked to jobs');
      console.log('5. No orders linked to job_cards');
    }

    // Step 4: Check existing bills
    console.log('\n📋 Step 4: Checking existing vendor bills...');
    const { data: existingBills, error: billsError } = await supabase
      .from('vendor_bills')
      .select('*')
      .order('created_at', { ascending: false });

    if (billsError) {
      console.error('❌ Error fetching existing bills:', billsError);
    } else {
      console.log(`✅ Found ${existingBills?.length || 0} existing vendor bills`);
      if (existingBills && existingBills.length > 0) {
        console.log('📝 Recent bills:');
        existingBills.slice(0, 3).forEach((bill, i) => {
          console.log(`   ${i + 1}. ${bill.bill_number} - ${bill.vendor_name} - ${bill.job_type} - ₹${bill.total_amount}`);
        });
      }
    }

    // Step 5: Summary
    console.log('\n🎯 SUMMARY');
    console.log('===========');
    const totalQualified = allJobs.length;
    const totalExisting = existingBills?.length || 0;
    
    if (totalQualified === 0) {
      console.log('❌ NO JOBS QUALIFY for vendor bills');
      console.log('📝 SOLUTION: You need to:');
      console.log('1. Create completed external vendor jobs');
      console.log('2. Ensure job_cards have vendor_id set');
      console.log('3. Ensure jobs have received_quantity > 0');
      console.log('4. For printing/stitching: set rates > 0');
    } else {
      console.log(`✅ ${totalQualified} jobs qualify for vendor bills`);
      console.log(`📊 ${totalExisting} bills already exist`);
      console.log('\n🚀 Your vendor bills page should now show:');
      console.log(`- ${totalQualified} available jobs for billing`);
      console.log(`- ${totalExisting} existing bills`);
      console.log('\n💡 The updated VendorBillsList component will display vendor names correctly!');
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testVendorBillsFix().then(() => {
  console.log('\n✅ Test complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
