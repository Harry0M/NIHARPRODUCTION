// Debug script to test specific Supabase queries
// Run this in the browser console on the vendor bills page

console.log('🔍 Starting specific query debugging...');

// Test each query individually
async function testQueries() {
  // Get Supabase client from the page
  const supabase = window.supabase || (window.React && window.React.createElement && 
    document.querySelector('[data-supabase]')?.supabase);
  
  if (!supabase) {
    console.error('❌ Supabase client not found. Make sure you are on the vendor bills page.');
    return;
  }

  console.log('✅ Supabase client found');

  try {
    // Test 1: Check basic cutting jobs without any filters
    console.log('\n📊 Test 1: All cutting jobs (no filters)');
    const allCutting = await supabase
      .from('cutting_jobs')
      .select('id, worker_name, is_internal, received_quantity, status, created_at');
    
    console.log('- Total cutting jobs:', allCutting.data?.length || 0);
    console.log('- Sample cutting job:', allCutting.data?.[0]);
    console.log('- Cutting jobs error:', allCutting.error);

    // Test 2: Check cutting jobs with status filter only
    console.log('\n📊 Test 2: Cutting jobs with status=completed');
    const completedCutting = await supabase
      .from('cutting_jobs')
      .select('id, worker_name, is_internal, received_quantity, status, created_at')
      .eq('status', 'completed');
    
    console.log('- Completed cutting jobs:', completedCutting.data?.length || 0);
    console.log('- Sample completed cutting job:', completedCutting.data?.[0]);

    // Test 3: Check cutting jobs with is_internal filter
    console.log('\n📊 Test 3: Cutting jobs with is_internal=false');
    const externalCutting = await supabase
      .from('cutting_jobs')
      .select('id, worker_name, is_internal, received_quantity, status, created_at')
      .eq('status', 'completed')
      .eq('is_internal', false);
    
    console.log('- External cutting jobs:', externalCutting.data?.length || 0);
    console.log('- Sample external cutting job:', externalCutting.data?.[0]);

    // Test 4: Check cutting jobs with received_quantity filter
    console.log('\n📊 Test 4: Cutting jobs with received_quantity not null');
    const receivedCutting = await supabase
      .from('cutting_jobs')
      .select('id, worker_name, is_internal, received_quantity, status, created_at')
      .eq('status', 'completed')
      .eq('is_internal', false)
      .not('received_quantity', 'is', null);
    
    console.log('- Cutting jobs with received_quantity:', receivedCutting.data?.length || 0);
    console.log('- Sample job with received_quantity:', receivedCutting.data?.[0]);

    // Test 5: Check job_cards relationship
    console.log('\n📊 Test 5: Cutting jobs with job_cards relationship');
    const cuttingWithJobCards = await supabase
      .from('cutting_jobs')
      .select(`
        id,
        worker_name,
        is_internal,
        received_quantity,
        status,
        created_at,
        job_cards (
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
      .not('received_quantity', 'is', null);
    
    console.log('- Cutting jobs with job_cards:', cuttingWithJobCards.data?.length || 0);
    console.log('- Sample job with job_cards:', cuttingWithJobCards.data?.[0]);
    console.log('- Job_cards error:', cuttingWithJobCards.error);

    // Test 6: Check vendors
    console.log('\n📊 Test 6: Available vendors');
    const vendors = await supabase
      .from('vendors')
      .select('id, name, service_type, contact_person');
    
    console.log('- Total vendors:', vendors.data?.length || 0);
    console.log('- Sample vendor:', vendors.data?.[0]);

    // Test 7: Check existing bills
    console.log('\n📊 Test 7: Existing vendor bills');
    const existingBills = await supabase
      .from('vendor_bills')
      .select('id, job_id, job_type, bill_number, vendor_name');
    
    console.log('- Existing bills:', existingBills.data?.length || 0);
    console.log('- Sample bill:', existingBills.data?.[0]);

    // Test 8: Test what statuses actually exist
    console.log('\n📊 Test 8: Actual job statuses in cutting_jobs');
    const statusCheck = await supabase
      .from('cutting_jobs')
      .select('status')
      .not('status', 'is', null);
    
    const uniqueStatuses = [...new Set(statusCheck.data?.map(job => job.status) || [])];
    console.log('- Unique cutting job statuses:', uniqueStatuses);

    // Test 9: Test is_internal values
    console.log('\n📊 Test 9: Actual is_internal values in cutting_jobs');
    const internalCheck = await supabase
      .from('cutting_jobs')
      .select('is_internal')
      .not('is_internal', 'is', null);
    
    const uniqueInternal = [...new Set(internalCheck.data?.map(job => job.is_internal) || [])];
    console.log('- Unique is_internal values:', uniqueInternal);

    console.log('\n✅ All tests completed!');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// Run the tests
testQueries();
