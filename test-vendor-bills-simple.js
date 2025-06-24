// Simple test for vendor bills functionality
// This will use the same configuration as the app

import { createClient } from '@supabase/supabase-js';

// Use same configuration as the app
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 
                     process.env.NEXT_PUBLIC_SUPABASE_URL || 
                     "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 
                         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                         "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testVendorBills() {
  console.log('🧪 TESTING VENDOR BILLS FUNCTIONALITY');
  console.log('======================================');
  console.log('Using Supabase URL:', SUPABASE_URL);
  console.log();

  try {
    // Test 1: Check if we can connect and fetch vendors
    console.log('📋 Test 1: Checking vendor connection...');
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, name, service_type')
      .limit(5);

    if (vendorsError) {
      console.error('❌ Cannot connect to vendors table:', vendorsError.message);
      console.log('💡 This is expected if using local Supabase and it\'s not running');
      console.log('💡 To start local Supabase: npx supabase start');
    } else {
      console.log(`✅ Connected! Found ${vendors.length} vendors`);
      vendors.forEach((vendor, i) => {
        console.log(`   ${i + 1}. ${vendor.name} (${vendor.service_type})`);
      });
    }
    console.log();

    // Test 2: Check cutting jobs schema
    console.log('📋 Test 2: Checking cutting jobs...');
    const { data: cuttingJobs, error: cuttingError } = await supabase
      .from('cutting_jobs')
      .select('id, vendor_id, worker_name, status')
      .limit(3);

    if (cuttingError) {
      console.error('❌ Cannot fetch cutting jobs:', cuttingError.message);
    } else {
      console.log(`✅ Cutting jobs table accessible! Found ${cuttingJobs.length} jobs`);
      cuttingJobs.forEach((job, i) => {
        console.log(`   ${i + 1}. Vendor ID: ${job.vendor_id || 'None'} - Status: ${job.status} - Worker: ${job.worker_name || 'N/A'}`);
      });
    }
    console.log();

    // Test 3: Check printing jobs schema
    console.log('📋 Test 3: Checking printing jobs...');
    const { data: printingJobs, error: printingError } = await supabase
      .from('printing_jobs')
      .select('id, vendor_id, worker_name, status, rate')
      .limit(3);

    if (printingError) {
      console.error('❌ Cannot fetch printing jobs:', printingError.message);
    } else {
      console.log(`✅ Printing jobs table accessible! Found ${printingJobs.length} jobs`);
      printingJobs.forEach((job, i) => {
        console.log(`   ${i + 1}. Vendor ID: ${job.vendor_id || 'None'} - Status: ${job.status} - Rate: ${job.rate || 'N/A'}`);
      });
    }
    console.log();

    // Test 4: Check stitching jobs schema
    console.log('📋 Test 4: Checking stitching jobs...');
    const { data: stitchingJobs, error: stitchingError } = await supabase
      .from('stitching_jobs')
      .select('id, vendor_id, worker_name, status, rate')
      .limit(3);

    if (stitchingError) {
      console.error('❌ Cannot fetch stitching jobs:', stitchingError.message);
    } else {
      console.log(`✅ Stitching jobs table accessible! Found ${stitchingJobs.length} jobs`);
      stitchingJobs.forEach((job, i) => {
        console.log(`   ${i + 1}. Vendor ID: ${job.vendor_id || 'None'} - Status: ${job.status} - Rate: ${job.rate || 'N/A'}`);
      });
    }
    console.log();

    // Test 5: Check vendor bills table
    console.log('📋 Test 5: Checking vendor bills...');
    const { data: vendorBills, error: billsError } = await supabase
      .from('vendor_bills')
      .select('id, bill_number, vendor_name, job_type, total_amount')
      .limit(3);

    if (billsError) {
      console.error('❌ Cannot fetch vendor bills:', billsError.message);
    } else {
      console.log(`✅ Vendor bills table accessible! Found ${vendorBills.length} bills`);
      vendorBills.forEach((bill, i) => {
        console.log(`   ${i + 1}. ${bill.bill_number} - ${bill.vendor_name} - ${bill.job_type} - ₹${bill.total_amount}`);
      });
    }
    console.log();

    // Summary
    console.log('🎯 SUMMARY');
    console.log('==========');
    console.log('✅ Schema test complete!');
    console.log('📝 The updated VendorBillsList component should now:');
    console.log('1. Fetch completed jobs with vendor_id directly from job tables');
    console.log('2. Display vendor names using the vendors lookup');
    console.log('3. Show "Create Bill" buttons for unbilled vendor jobs');
    console.log();
    console.log('🚀 Next steps:');
    console.log('1. Navigate to the Vendor Bills page in your app');
    console.log('2. Check the browser console for debug logs');
    console.log('3. Look for jobs in the "Available for Billing" section');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the test
testVendorBills().then(() => {
  console.log('\n✅ Test complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
