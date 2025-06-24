// Simple test to verify vendor bills functionality
// Copy and paste this in your browser console to test

console.log('🧪 Testing Vendor Bills Functionality');
console.log('====================================');

// Test the vendor bills queries directly
async function testVendorBillsQueries() {
  // This will use the same supabase client as your app
  const { supabase } = window;
  
  if (!supabase) {
    console.error('❌ Supabase client not found. Make sure you\'re on the vendor bills page.');
    return;
  }

  try {
    console.log('1️⃣ Testing vendor query...');
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, name, service_type')
      .limit(5);
    
    if (vendorsError) {
      console.error('❌ Vendors error:', vendorsError);
    } else {
      console.log('✅ Vendors loaded:', vendors?.length || 0);
      vendors?.forEach((v, i) => {
        console.log(`   ${i + 1}. ${v.name} (${v.service_type})`);
      });
    }

    console.log('\n2️⃣ Testing cutting jobs with vendor_id...');
    const { data: cuttingJobs, error: cuttingError } = await supabase
      .from('cutting_jobs')
      .select(`
        id,
        vendor_id,
        worker_name,
        status,
        created_at
      `)
      .eq('status', 'completed')
      .not('vendor_id', 'is', null)
      .limit(5);
    
    if (cuttingError) {
      console.error('❌ Cutting jobs error:', cuttingError);
    } else {
      console.log('✅ Cutting jobs with vendor_id:', cuttingJobs?.length || 0);
      cuttingJobs?.forEach((job, i) => {
        console.log(`   ${i + 1}. ID: ${job.id}, Vendor: ${job.vendor_id}, Worker: ${job.worker_name}`);
      });
    }

    console.log('\n3️⃣ Testing printing jobs with vendor_id...');
    const { data: printingJobs, error: printingError } = await supabase
      .from('printing_jobs')
      .select(`
        id,
        vendor_id,
        worker_name,
        rate,
        status,
        created_at
      `)
      .eq('status', 'completed')
      .not('vendor_id', 'is', null)
      .limit(5);
    
    if (printingError) {
      console.error('❌ Printing jobs error:', printingError);
    } else {
      console.log('✅ Printing jobs with vendor_id:', printingJobs?.length || 0);
      printingJobs?.forEach((job, i) => {
        console.log(`   ${i + 1}. ID: ${job.id}, Vendor: ${job.vendor_id}, Worker: ${job.worker_name}, Rate: ${job.rate}`);
      });
    }

    console.log('\n4️⃣ Testing stitching jobs with vendor_id...');
    const { data: stitchingJobs, error: stitchingError } = await supabase
      .from('stitching_jobs')
      .select(`
        id,
        vendor_id,
        worker_name,
        rate,
        status,
        created_at
      `)
      .eq('status', 'completed')
      .not('vendor_id', 'is', null)
      .limit(5);
    
    if (stitchingError) {
      console.error('❌ Stitching jobs error:', stitchingError);
    } else {
      console.log('✅ Stitching jobs with vendor_id:', stitchingJobs?.length || 0);
      stitchingJobs?.forEach((job, i) => {
        console.log(`   ${i + 1}. ID: ${job.id}, Vendor: ${job.vendor_id}, Worker: ${job.worker_name}, Rate: ${job.rate}`);
      });
    }

    console.log('\n5️⃣ Testing existing vendor bills...');
    const { data: existingBills, error: billsError } = await supabase
      .from('vendor_bills')
      .select('id, bill_number, vendor_name, job_type, total_amount')
      .limit(5);
    
    if (billsError) {
      console.error('❌ Vendor bills error:', billsError);
    } else {
      console.log('✅ Existing vendor bills:', existingBills?.length || 0);
      existingBills?.forEach((bill, i) => {
        console.log(`   ${i + 1}. ${bill.bill_number} - ${bill.vendor_name} - ${bill.job_type} - ₹${bill.total_amount}`);
      });
    }

    const totalJobs = (cuttingJobs?.length || 0) + (printingJobs?.length || 0) + (stitchingJobs?.length || 0);
    console.log('\n🎯 SUMMARY');
    console.log('==========');
    console.log(`✅ Total vendors: ${vendors?.length || 0}`);
    console.log(`✅ Total completed jobs with vendor_id: ${totalJobs}`);
    console.log(`✅ Existing bills: ${existingBills?.length || 0}`);
    
    if (totalJobs === 0) {
      console.log('\n❗ To test vendor bills, you need:');
      console.log('1. Create some jobs (cutting/printing/stitching)');
      console.log('2. Assign vendor_id to those jobs');
      console.log('3. Set job status to "completed"');
      console.log('4. Then refresh the vendor bills page');
    } else {
      console.log('\n🎉 Great! You have vendor jobs that should appear in the vendor bills list.');
      console.log('If they\'re not showing up, check the browser console for any errors.');
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testVendorBillsQueries();
