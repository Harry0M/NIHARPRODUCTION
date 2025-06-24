// Comprehensive test script for vendor bills data
// Run this in browser console on vendor bills page

console.log('🔍 Starting comprehensive vendor bills data test...');

async function testVendorBillsData() {
  // Get supabase client from window or react context
  const supabase = window?.supabase || 
    (typeof window !== 'undefined' && window.React && 
     document.querySelector('[data-supabase]')?.supabase);

  if (!supabase) {
    console.error('❌ Supabase client not found');
    return;
  }

  console.log('✅ Supabase client found');

  try {
    // Test 1: Check raw data counts
    console.log('\n📊 === RAW DATA COUNTS ===');
    
    const [cuttingCount, printingCount, stitchingCount, vendorCount, jobCardCount] = await Promise.all([
      supabase.from('cutting_jobs').select('id', { count: 'exact', head: true }),
      supabase.from('printing_jobs').select('id', { count: 'exact', head: true }),
      supabase.from('stitching_jobs').select('id', { count: 'exact', head: true }),
      supabase.from('vendors').select('id', { count: 'exact', head: true }),
      supabase.from('job_cards').select('id', { count: 'exact', head: true })
    ]);

    console.log('- Total cutting jobs:', cuttingCount.count);
    console.log('- Total printing jobs:', printingCount.count);
    console.log('- Total stitching jobs:', stitchingCount.count);
    console.log('- Total vendors:', vendorCount.count);
    console.log('- Total job cards:', jobCardCount.count);

    // Test 2: Check job statuses and internal flags
    console.log('\n📊 === JOB STATUS ANALYSIS ===');
    
    const [cuttingStatuses, printingStatuses, stitchingStatuses] = await Promise.all([
      supabase.from('cutting_jobs').select('status, is_internal, received_quantity'),
      supabase.from('printing_jobs').select('status, is_internal, received_quantity, rate'),
      supabase.from('stitching_jobs').select('status, is_internal, received_quantity, rate')
    ]);

    // Analyze cutting jobs
    const cuttingStats = {
      total: cuttingStatuses.data?.length || 0,
      completed: cuttingStatuses.data?.filter(j => j.status === 'completed').length || 0,
      external: cuttingStatuses.data?.filter(j => j.is_internal === false).length || 0,
      withQuantity: cuttingStatuses.data?.filter(j => j.received_quantity != null).length || 0,
      completedExternal: cuttingStatuses.data?.filter(j => 
        j.status === 'completed' && j.is_internal === false
      ).length || 0,
      completedExternalWithQuantity: cuttingStatuses.data?.filter(j => 
        j.status === 'completed' && j.is_internal === false && j.received_quantity != null
      ).length || 0
    };

    // Analyze printing jobs
    const printingStats = {
      total: printingStatuses.data?.length || 0,
      completed: printingStatuses.data?.filter(j => j.status === 'completed').length || 0,
      external: printingStatuses.data?.filter(j => j.is_internal === false).length || 0,
      withQuantity: printingStatuses.data?.filter(j => j.received_quantity != null).length || 0,
      withRate: printingStatuses.data?.filter(j => j.rate != null).length || 0,
      completedExternal: printingStatuses.data?.filter(j => 
        j.status === 'completed' && j.is_internal === false
      ).length || 0,
      completedExternalWithQuantityAndRate: printingStatuses.data?.filter(j => 
        j.status === 'completed' && j.is_internal === false && 
        j.received_quantity != null && j.rate != null
      ).length || 0
    };

    // Analyze stitching jobs
    const stitchingStats = {
      total: stitchingStatuses.data?.length || 0,
      completed: stitchingStatuses.data?.filter(j => j.status === 'completed').length || 0,
      external: stitchingStatuses.data?.filter(j => j.is_internal === false).length || 0,
      withQuantity: stitchingStatuses.data?.filter(j => j.received_quantity != null).length || 0,
      withRate: stitchingStatuses.data?.filter(j => j.rate != null).length || 0,
      completedExternal: stitchingStatuses.data?.filter(j => 
        j.status === 'completed' && j.is_internal === false
      ).length || 0,
      completedExternalWithQuantityAndRate: stitchingStatuses.data?.filter(j => 
        j.status === 'completed' && j.is_internal === false && 
        j.received_quantity != null && j.rate != null
      ).length || 0
    };

    console.log('🔶 Cutting Jobs Analysis:', cuttingStats);
    console.log('🔷 Printing Jobs Analysis:', printingStats);
    console.log('🔸 Stitching Jobs Analysis:', stitchingStats);

    // Test 3: Check job_cards relationships
    console.log('\n📊 === JOB CARDS RELATIONSHIP TEST ===');
    
    const [cuttingWithJobCards, printingWithJobCards, stitchingWithJobCards] = await Promise.all([
      supabase
        .from('cutting_jobs')
        .select(`
          id,
          status,
          is_internal,
          received_quantity,
          job_cards (
            id,
            job_name,
            job_number,
            vendor_id,
            orders (
              id,
              order_number,
              company_name
            )
          )
        `)
        .eq('status', 'completed')
        .eq('is_internal', false)
        .not('received_quantity', 'is', null),

      supabase
        .from('printing_jobs')
        .select(`
          id,
          status,
          is_internal,
          received_quantity,
          rate,
          job_cards (
            id,
            job_name,
            job_number,
            vendor_id,
            orders (
              id,
              order_number,
              company_name
            )
          )
        `)
        .eq('status', 'completed')
        .eq('is_internal', false)
        .not('received_quantity', 'is', null)
        .not('rate', 'is', null),

      supabase
        .from('stitching_jobs')
        .select(`
          id,
          status,
          is_internal,
          received_quantity,
          rate,
          job_cards (
            id,
            job_name,
            job_number,
            vendor_id,
            orders (
              id,
              order_number,
              company_name
            )
          )
        `)
        .eq('status', 'completed')
        .eq('is_internal', false)
        .not('received_quantity', 'is', null)
        .not('rate', 'is', null)
    ]);

    console.log('🔶 Cutting jobs with relationships:', cuttingWithJobCards.data?.length || 0);
    console.log('🔷 Printing jobs with relationships:', printingWithJobCards.data?.length || 0);
    console.log('🔸 Stitching jobs with relationships:', stitchingWithJobCards.data?.length || 0);

    // Check for errors
    if (cuttingWithJobCards.error) console.error('❌ Cutting jobs error:', cuttingWithJobCards.error);
    if (printingWithJobCards.error) console.error('❌ Printing jobs error:', printingWithJobCards.error);
    if (stitchingWithJobCards.error) console.error('❌ Stitching jobs error:', stitchingWithJobCards.error);

    // Show sample data
    if (cuttingWithJobCards.data?.[0]) {
      console.log('🔶 Sample cutting job with job_cards:', cuttingWithJobCards.data[0]);
    }
    if (printingWithJobCards.data?.[0]) {
      console.log('🔷 Sample printing job with job_cards:', printingWithJobCards.data[0]);
    }
    if (stitchingWithJobCards.data?.[0]) {
      console.log('🔸 Sample stitching job with job_cards:', stitchingWithJobCards.data[0]);
    }

    // Test 4: Check existing vendor bills
    console.log('\n📊 === EXISTING VENDOR BILLS ===');
    
    const existingBills = await supabase
      .from('vendor_bills')
      .select('id, job_id, job_type, bill_number, vendor_name');

    console.log('📋 Existing vendor bills:', existingBills.data?.length || 0);
    if (existingBills.data?.[0]) {
      console.log('📋 Sample vendor bill:', existingBills.data[0]);
    }

    // Test 5: Summary
    console.log('\n📊 === FINAL SUMMARY ===');
    const totalAvailableJobs = 
      (cuttingWithJobCards.data?.filter(job => job.job_cards).length || 0) +
      (printingWithJobCards.data?.filter(job => job.job_cards).length || 0) +
      (stitchingWithJobCards.data?.filter(job => job.job_cards).length || 0);

    console.log('✅ Total jobs available for billing:', totalAvailableJobs);
    console.log('✅ Jobs with job_cards relationships:');
    console.log('   - Cutting:', cuttingWithJobCards.data?.filter(job => job.job_cards).length || 0);
    console.log('   - Printing:', printingWithJobCards.data?.filter(job => job.job_cards).length || 0);
    console.log('   - Stitching:', stitchingWithJobCards.data?.filter(job => job.job_cards).length || 0);

    if (totalAvailableJobs === 0) {
      console.log('\n❗ DIAGNOSIS: No jobs available for billing');
      console.log('   This could be because:');
      console.log('   1. No jobs have status="completed"');
      console.log('   2. No jobs have is_internal=false');
      console.log('   3. No jobs have received_quantity set');
      console.log('   4. For printing/stitching: No jobs have rate set');
      console.log('   5. No jobs have associated job_cards');
      console.log('   6. Job_cards don\'t have associated orders');
    }

  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// Run the test
testVendorBillsData();
