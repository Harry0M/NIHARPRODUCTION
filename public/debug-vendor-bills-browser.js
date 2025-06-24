// Browser Debug Script for Vendor Bills Issue
// Open browser console at http://localhost:8084/sells/vendor-bills and run: debugVendorBillsIssue()

window.debugVendorBillsIssue = async function() {
  console.log('🔍 DEBUGGING VENDOR BILLS ISSUE');
  console.log('=====================================\n');

  if (!window.supabase) {
    console.error('❌ Supabase not available. Make sure you\'re on the app page.');
    return;
  }

  try {
    // Step 1: Check if we have vendors
    console.log('📋 Step 1: Checking vendors...');
    const { data: vendors, error: vendorsError } = await window.supabase
      .from('vendors')
      .select('*')
      .order('created_at', { ascending: false });

    if (vendorsError) {
      console.error('❌ Error fetching vendors:', vendorsError);
      return;
    }

    console.log(`✅ Found ${vendors?.length || 0} vendors`);
    if (vendors && vendors.length > 0) {
      console.log('📝 Vendor details:');
      vendors.forEach((vendor, i) => {
        console.log(`   ${i + 1}. ${vendor.name} (ID: ${vendor.id}, Service: ${vendor.service_type}, Status: ${vendor.status})`);
      });
    }
    console.log();

    // Step 2: Check cutting jobs
    console.log('📋 Step 2: Checking cutting jobs...');
    const { data: cuttingJobs, error: cuttingError } = await window.supabase
      .from('cutting_jobs')
      .select(`
        id,
        job_card_id,
        worker_name,
        vendor_id,
        is_internal,
        received_quantity,
        status,
        created_at,
        job_cards (
          id,
          job_name,
          job_number,
          order_id,
          orders (
            id,
            order_number,
            company_name,
            product_name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (cuttingError) {
      console.error('❌ Error fetching cutting jobs:', cuttingError);
    } else {
      console.log(`✅ Found ${cuttingJobs?.length || 0} cutting jobs`);
      if (cuttingJobs && cuttingJobs.length > 0) {
        console.log('📝 Recent cutting jobs:');
        cuttingJobs.slice(0, 5).forEach((job, i) => {
          console.log(`   ${i + 1}. Job Card: ${job.job_cards?.job_number || 'N/A'}`);
          console.log(`      Worker: ${job.worker_name || 'N/A'}`);
          console.log(`      Vendor ID: ${job.vendor_id || 'N/A'}`);
          console.log(`      Internal: ${job.is_internal}`);
          console.log(`      Status: ${job.status}`);
          console.log(`      Received Qty: ${job.received_quantity || 'N/A'}`);
          console.log(`      Order: ${job.job_cards?.orders?.order_number || 'N/A'} (${job.job_cards?.orders?.company_name || 'N/A'})`);
          console.log();
        });
      }
    }

    // Step 3: Check printing jobs
    console.log('📋 Step 3: Checking printing jobs...');
    const { data: printingJobs, error: printingError } = await window.supabase
      .from('printing_jobs')
      .select(`
        id,
        job_card_id,
        worker_name,
        vendor_id,
        is_internal,
        rate,
        received_quantity,
        status,
        created_at,
        job_cards (
          id,
          job_name,
          job_number,
          order_id,
          orders (
            id,
            order_number,
            company_name,
            product_name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (printingError) {
      console.error('❌ Error fetching printing jobs:', printingError);
    } else {
      console.log(`✅ Found ${printingJobs?.length || 0} printing jobs`);
      if (printingJobs && printingJobs.length > 0) {
        console.log('📝 Recent printing jobs:');
        printingJobs.slice(0, 5).forEach((job, i) => {
          console.log(`   ${i + 1}. Job Card: ${job.job_cards?.job_number || 'N/A'}`);
          console.log(`      Worker: ${job.worker_name || 'N/A'}`);
          console.log(`      Vendor ID: ${job.vendor_id || 'N/A'}`);
          console.log(`      Internal: ${job.is_internal}`);
          console.log(`      Status: ${job.status}`);
          console.log(`      Rate: ${job.rate || 'N/A'}`);
          console.log(`      Received Qty: ${job.received_quantity || 'N/A'}`);
          console.log(`      Order: ${job.job_cards?.orders?.order_number || 'N/A'} (${job.job_cards?.orders?.company_name || 'N/A'})`);
          console.log();
        });
      }
    }

    // Step 4: Check stitching jobs
    console.log('📋 Step 4: Checking stitching jobs...');
    const { data: stitchingJobs, error: stitchingError } = await window.supabase
      .from('stitching_jobs')
      .select(`
        id,
        job_card_id,
        worker_name,
        vendor_id,
        is_internal,
        rate,
        received_quantity,
        status,
        created_at,
        job_cards (
          id,
          job_name,
          job_number,
          order_id,
          orders (
            id,
            order_number,
            company_name,
            product_name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (stitchingError) {
      console.error('❌ Error fetching stitching jobs:', stitchingError);
    } else {
      console.log(`✅ Found ${stitchingJobs?.length || 0} stitching jobs`);
      if (stitchingJobs && stitchingJobs.length > 0) {
        console.log('📝 Recent stitching jobs:');
        stitchingJobs.slice(0, 5).forEach((job, i) => {
          console.log(`   ${i + 1}. Job Card: ${job.job_cards?.job_number || 'N/A'}`);
          console.log(`      Worker: ${job.worker_name || 'N/A'}`);
          console.log(`      Vendor ID: ${job.vendor_id || 'N/A'}`);
          console.log(`      Internal: ${job.is_internal}`);
          console.log(`      Status: ${job.status}`);
          console.log(`      Rate: ${job.rate || 'N/A'}`);
          console.log(`      Received Qty: ${job.received_quantity || 'N/A'}`);
          console.log(`      Order: ${job.job_cards?.orders?.order_number || 'N/A'} (${job.job_cards?.orders?.company_name || 'N/A'})`);
          console.log();
        });
      }
    }

    // Step 5: Apply vendor bills criteria and see what qualifies
    console.log('📋 Step 5: Checking jobs that qualify for vendor bills...');
    
    // Cutting jobs that qualify
    const qualifiedCutting = cuttingJobs?.filter(job => 
      job.status === 'completed' && 
      job.is_internal === false && 
      job.received_quantity != null &&
      job.received_quantity > 0
    ) || [];

    // Printing jobs that qualify
    const qualifiedPrinting = printingJobs?.filter(job => 
      job.status === 'completed' && 
      job.is_internal === false && 
      job.received_quantity != null &&
      job.received_quantity > 0 &&
      job.rate != null &&
      job.rate > 0
    ) || [];

    // Stitching jobs that qualify
    const qualifiedStitching = stitchingJobs?.filter(job => 
      job.status === 'completed' && 
      job.is_internal === false && 
      job.received_quantity != null &&
      job.received_quantity > 0 &&
      job.rate != null &&
      job.rate > 0
    ) || [];

    console.log(`🎯 Jobs that qualify for vendor bills:`);
    console.log(`   - Cutting: ${qualifiedCutting.length} jobs`);
    console.log(`   - Printing: ${qualifiedPrinting.length} jobs`);
    console.log(`   - Stitching: ${qualifiedStitching.length} jobs`);

    if (qualifiedCutting.length > 0) {
      console.log('\n✅ Qualified cutting jobs:');
      qualifiedCutting.forEach((job, i) => {
        console.log(`   ${i + 1}. ${job.job_cards?.job_number || 'N/A'} - Vendor ID: ${job.vendor_id} - Worker: ${job.worker_name}`);
      });
    }

    if (qualifiedPrinting.length > 0) {
      console.log('\n✅ Qualified printing jobs:');
      qualifiedPrinting.forEach((job, i) => {
        console.log(`   ${i + 1}. ${job.job_cards?.job_number || 'N/A'} - Vendor ID: ${job.vendor_id} - Worker: ${job.worker_name} - Rate: ${job.rate}`);
      });
    }

    if (qualifiedStitching.length > 0) {
      console.log('\n✅ Qualified stitching jobs:');
      qualifiedStitching.forEach((job, i) => {
        console.log(`   ${i + 1}. ${job.job_cards?.job_number || 'N/A'} - Vendor ID: ${job.vendor_id} - Worker: ${job.worker_name} - Rate: ${job.rate}`);
      });
    }

    // Step 6: Check existing vendor bills
    console.log('\n📋 Step 6: Checking existing vendor bills...');
    const { data: existingBills, error: billsError } = await window.supabase
      .from('vendor_bills')
      .select('*')
      .order('created_at', { ascending: false });

    if (billsError) {
      console.error('❌ Error fetching vendor bills:', billsError);
    } else {
      console.log(`✅ Found ${existingBills?.length || 0} existing vendor bills`);
      if (existingBills && existingBills.length > 0) {
        existingBills.slice(0, 5).forEach((bill, i) => {
          console.log(`   ${i + 1}. ${bill.bill_number} - ${bill.vendor_name} - ${bill.job_type} - ₹${bill.total_amount}`);
        });
      }
    }

    // Step 7: Check what the frontend VendorBillsList is actually seeing
    console.log('\n📋 Step 7: Testing the exact queries used by VendorBillsList...');
    
    // This is exactly what VendorBillsList.tsx uses for basic queries
    const [basicCutting, basicPrinting, basicStitching] = await Promise.all([
      window.supabase
        .from('cutting_jobs')
        .select('id, worker_name, is_internal, received_quantity, status, created_at')
        .eq('status', 'completed')
        .eq('is_internal', false)
        .not('received_quantity', 'is', null),
      
      window.supabase
        .from('printing_jobs')
        .select('id, worker_name, is_internal, rate, received_quantity, status, created_at')
        .eq('status', 'completed')
        .eq('is_internal', false)
        .not('received_quantity', 'is', null)
        .not('rate', 'is', null),
      
      window.supabase
        .from('stitching_jobs')
        .select('id, worker_name, is_internal, rate, received_quantity, status, created_at')
        .eq('status', 'completed')
        .eq('is_internal', false)
        .not('received_quantity', 'is', null)
        .not('rate', 'is', null)
    ]);

    console.log('📊 Frontend query results (what VendorBillsList sees):');
    console.log(`- Cutting jobs: ${basicCutting.data?.length || 0} (Error: ${basicCutting.error ? 'YES' : 'NO'})`);
    console.log(`- Printing jobs: ${basicPrinting.data?.length || 0} (Error: ${basicPrinting.error ? 'YES' : 'NO'})`);
    console.log(`- Stitching jobs: ${basicStitching.data?.length || 0} (Error: ${basicStitching.error ? 'YES' : 'NO'})`);

    if (basicCutting.error) console.error('❌ Cutting query error:', basicCutting.error);
    if (basicPrinting.error) console.error('❌ Printing query error:', basicPrinting.error);
    if (basicStitching.error) console.error('❌ Stitching query error:', basicStitching.error);

    // Step 8: Summary and recommendations
    console.log('\n🎯 DIAGNOSIS SUMMARY');
    console.log('====================');
    
    const totalQualified = qualifiedCutting.length + qualifiedPrinting.length + qualifiedStitching.length;
    const totalFrontendSees = (basicCutting.data?.length || 0) + (basicPrinting.data?.length || 0) + (basicStitching.data?.length || 0);
    
    if (totalQualified === 0) {
      console.log('❌ NO JOBS QUALIFY FOR VENDOR BILLS');
      console.log('\nPossible reasons:');
      console.log('1. Jobs are not marked as "completed"');
      console.log('2. Jobs are marked as internal (is_internal = true)');
      console.log('3. Jobs don\'t have received_quantity set');
      console.log('4. Printing/Stitching jobs don\'t have rates set');
      console.log('5. All qualifying jobs already have bills created');
    } else if (totalFrontendSees === 0) {
      console.log('❌ JOBS QUALIFY BUT FRONTEND CAN\'T SEE THEM');
      console.log('\nThis indicates a database query issue in the frontend.');
      console.log('Check the VendorBillsList component queries.');
    } else {
      console.log(`✅ ${totalQualified} JOBS QUALIFY FOR VENDOR BILLS`);
      console.log(`✅ Frontend can see ${totalFrontendSees} jobs`);
      console.log('\nIf these jobs are still not showing in the vendor bills page, check:');
      console.log('1. Frontend filtering logic');
      console.log('2. Vendor ID to Vendor name matching');
      console.log('3. React component state management');
    }

    // Store results globally for further inspection
    window.debugResults = {
      vendors,
      cuttingJobs,
      printingJobs, 
      stitchingJobs,
      qualifiedCutting,
      qualifiedPrinting,
      qualifiedStitching,
      existingBills,
      basicCutting: basicCutting.data,
      basicPrinting: basicPrinting.data,
      basicStitching: basicStitching.data
    };

    console.log('\n💾 Debug results stored in window.debugResults for further inspection');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
};

console.log('🔧 Debug script loaded! Run debugVendorBillsIssue() in the console.');
