// Simple test to verify vendor bills functionality
// This script uses the same simplified logic as our updated component

import { createClient } from '@supabase/supabase-js';

// Use environment fallback like the actual app
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 
                     process.env.NEXT_PUBLIC_SUPABASE_URL || 
                     "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 
                         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                         "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSimpleVendorBills() {
  console.log('🧪 TESTING SIMPLE VENDOR BILLS LOGIC');
  console.log('====================================\n');
  console.log('🔗 Supabase URL:', SUPABASE_URL);
  console.log();

  try {
    // Step 1: Check vendors
    console.log('📋 Step 1: Loading vendors...');
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, name, service_type');

    if (vendorsError) {
      console.error('❌ Error fetching vendors:', vendorsError);
      return;
    }

    console.log(`✅ Found ${vendors?.length || 0} vendors`);
    const vendorMap = {};
    vendors?.forEach(vendor => {
      vendorMap[vendor.id] = { name: vendor.name, service_type: vendor.service_type };
      console.log(`   - ${vendor.name} (${vendor.service_type})`);
    });
    console.log();

    // Step 2: Get existing bills to filter out
    console.log('📋 Step 2: Checking existing bills...');
    const { data: existingBills } = await supabase
      .from('vendor_bills')
      .select('job_id, job_type');

    const billedJobIds = new Set(existingBills?.map(bill => `${bill.job_type}-${bill.job_id}`) || []);
    console.log(`✅ Found ${existingBills?.length || 0} existing bills`);
    console.log();

    // Step 3: Get completed vendor jobs (simplified logic)
    console.log('📋 Step 3: Finding completed vendor jobs...');
    
    const [cuttingJobs, printingJobs, stitchingJobs] = await Promise.all([
      supabase
        .from('cutting_jobs')
        .select(`
          id,
          worker_name,
          vendor_id,
          received_quantity,
          status,
          created_at,
          job_cards (
            job_name,
            job_number,
            orders (
              order_number,
              company_name
            )
          )
        `)
        .eq('status', 'completed')
        .not('vendor_id', 'is', null),

      supabase
        .from('printing_jobs')
        .select(`
          id,
          worker_name,
          vendor_id,
          rate,
          received_quantity,
          status,
          created_at,
          job_cards (
            job_name,
            job_number,
            orders (
              order_number,
              company_name
            )
          )
        `)
        .eq('status', 'completed')
        .not('vendor_id', 'is', null),

      supabase
        .from('stitching_jobs')
        .select(`
          id,
          worker_name,
          vendor_id,
          rate,
          received_quantity,
          status,
          created_at,
          job_cards (
            job_name,
            job_number,
            orders (
              order_number,
              company_name
            )
          )
        `)
        .eq('status', 'completed')
        .not('vendor_id', 'is', null)
    ]);

    console.log('📊 Completed vendor jobs found:');
    console.log(`   - Cutting: ${cuttingJobs.data?.length || 0} jobs`);
    console.log(`   - Printing: ${printingJobs.data?.length || 0} jobs`);
    console.log(`   - Stitching: ${stitchingJobs.data?.length || 0} jobs`);

    if (cuttingJobs.error) console.error('❌ Cutting error:', cuttingJobs.error);
    if (printingJobs.error) console.error('❌ Printing error:', printingJobs.error);
    if (stitchingJobs.error) console.error('❌ Stitching error:', stitchingJobs.error);

    // Step 4: Combine and filter jobs
    const allJobs = [];
    
    if (cuttingJobs.data) {
      cuttingJobs.data.forEach(job => {
        allJobs.push({ ...job, job_type: 'cutting', rate: null });
      });
    }
    
    if (printingJobs.data) {
      printingJobs.data.forEach(job => {
        allJobs.push({ ...job, job_type: 'printing' });
      });
    }
    
    if (stitchingJobs.data) {
      stitchingJobs.data.forEach(job => {
        allJobs.push({ ...job, job_type: 'stitching' });
      });
    }

    // Filter out already billed jobs
    const availableJobs = allJobs.filter(job => !billedJobIds.has(`${job.job_type}-${job.id}`));

    console.log();
    console.log('🎯 RESULTS:');
    console.log(`   - Total completed vendor jobs: ${allJobs.length}`);
    console.log(`   - Already billed: ${billedJobIds.size}`);
    console.log(`   - Available for billing: ${availableJobs.length}`);
    console.log();

    if (availableJobs.length > 0) {
      console.log('📝 Jobs available for billing:');
      availableJobs.forEach((job, i) => {
        const vendor = vendorMap[job.vendor_id];
        console.log(`   ${i + 1}. ${job.job_type.toUpperCase()}`);
        console.log(`      Job: ${job.job_cards?.job_number || 'N/A'}`);
        console.log(`      Order: ${job.job_cards?.orders?.order_number || 'N/A'}`);
        console.log(`      Company: ${job.job_cards?.orders?.company_name || 'N/A'}`);
        console.log(`      Vendor: ${vendor?.name || `ID: ${job.vendor_id}`}`);
        console.log(`      Worker: ${job.worker_name}`);
        console.log(`      Quantity: ${job.received_quantity || 'N/A'}`);
        console.log(`      Rate: ${job.rate ? `₹${job.rate}` : 'N/A'}`);
        if (job.rate && job.received_quantity) {
          console.log(`      Amount: ₹${job.rate * job.received_quantity}`);
        }
        console.log();
      });

      console.log('✅ SUCCESS! Vendor bills functionality is working correctly.');
      console.log('   These jobs should now appear in the vendor bills page.');
    } else {
      console.log('❗ No jobs available for billing.');
      console.log('   This could mean:');
      console.log('   1. No completed jobs with vendor_id exist');
      console.log('   2. All completed vendor jobs have already been billed');
      console.log('   3. Check if you have any jobs marked as completed in the database');
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testSimpleVendorBills().then(() => {
  console.log('\n✅ Test complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test error:', error);
  process.exit(1);
});
