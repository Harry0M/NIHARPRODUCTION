// Simple debug script for vendor bills
// Open browser console and paste this on the vendor bills page

console.log('=== VENDOR BILLS SCHEMA-AWARE DEBUG ===');

(async () => {
  if (!window.supabase) {
    console.log('❌ Supabase not available');
    return;
  }

  console.log('✅ Starting schema-aware debugging...');

  // 1. Check cutting jobs (no rate field expected)
  const cuttingResult = await window.supabase
    .from('cutting_jobs')
    .select('id, worker_name, is_internal, status, received_quantity, created_at')
    .limit(5);
    
  console.log('\n📊 CUTTING JOBS:');
  console.log('Total found:', cuttingResult.data?.length || 0);
  console.log('Error:', cuttingResult.error?.message || 'None');
  
  if (cuttingResult.data?.length > 0) {
    const statuses = [...new Set(cuttingResult.data.map(j => j.status))];
    const isInternalValues = [...new Set(cuttingResult.data.map(j => j.is_internal))];
    const withReceivedQty = cuttingResult.data.filter(j => j.received_quantity !== null).length;
    
    console.log('Statuses available:', statuses);
    console.log('is_internal values:', isInternalValues);
    console.log('Jobs with received_quantity:', withReceivedQty);
    console.log('Sample job:', cuttingResult.data[0]);
    
    // Test external completed cutting jobs
    const externalCompleted = await window.supabase
      .from('cutting_jobs')
      .select('id, worker_name, is_internal, status, received_quantity')
      .eq('status', 'completed')
      .eq('is_internal', false)
      .not('received_quantity', 'is', null);
      
    console.log('🎯 External completed cutting jobs:', externalCompleted.data?.length || 0);
    if (externalCompleted.data?.length > 0) {
      console.log('Sample external completed:', externalCompleted.data[0]);
    }
  }

  // 2. Check printing jobs (has rate field)
  const printingResult = await window.supabase
    .from('printing_jobs')
    .select('id, worker_name, is_internal, status, received_quantity, rate, created_at')
    .limit(5);
    
  console.log('\n📊 PRINTING JOBS:');
  console.log('Total found:', printingResult.data?.length || 0);
  console.log('Error:', printingResult.error?.message || 'None');
  
  if (printingResult.data?.length > 0) {
    const statuses = [...new Set(printingResult.data.map(j => j.status))];
    const isInternalValues = [...new Set(printingResult.data.map(j => j.is_internal))];
    const withReceivedQty = printingResult.data.filter(j => j.received_quantity !== null).length;
    const withRate = printingResult.data.filter(j => j.rate !== null).length;
    
    console.log('Statuses available:', statuses);
    console.log('is_internal values:', isInternalValues);
    console.log('Jobs with received_quantity:', withReceivedQty);
    console.log('Jobs with rate:', withRate);
    console.log('Sample job:', printingResult.data[0]);
  }

  // 3. Check stitching jobs (has rate field)
  const stitchingResult = await window.supabase
    .from('stitching_jobs')
    .select('id, worker_name, is_internal, status, received_quantity, rate, created_at')
    .limit(5);
    
  console.log('\n📊 STITCHING JOBS:');
  console.log('Total found:', stitchingResult.data?.length || 0);
  console.log('Error:', stitchingResult.error?.message || 'None');
  
  if (stitchingResult.data?.length > 0) {
    const statuses = [...new Set(stitchingResult.data.map(j => j.status))];
    const isInternalValues = [...new Set(stitchingResult.data.map(j => j.is_internal))];
    const withReceivedQty = stitchingResult.data.filter(j => j.received_quantity !== null).length;
    const withRate = stitchingResult.data.filter(j => j.rate !== null).length;
    
    console.log('Statuses available:', statuses);
    console.log('is_internal values:', isInternalValues);
    console.log('Jobs with received_quantity:', withReceivedQty);
    console.log('Jobs with rate:', withRate);
    console.log('Sample job:', stitchingResult.data[0]);
  }

  // 4. Check vendors
  const vendorsResult = await window.supabase
    .from('vendors')
    .select('id, name, service_type, contact_person')
    .limit(5);
    
  console.log('\n📊 VENDORS:');
  console.log('Total found:', vendorsResult.data?.length || 0);
  console.log('Error:', vendorsResult.error?.message || 'None');
  if (vendorsResult.data?.length > 0) {
    console.log('Sample vendor:', vendorsResult.data[0]);
  }

  // 5. Check existing vendor bills
  const billsResult = await window.supabase
    .from('vendor_bills')
    .select('id, job_id, job_type, bill_number')
    .limit(5);
    
  console.log('\n📊 EXISTING VENDOR BILLS:');
  console.log('Total found:', billsResult.data?.length || 0);
  console.log('Error:', billsResult.error?.message || 'None');
  if (billsResult.data?.length > 0) {
    console.log('Sample bill:', billsResult.data[0]);
  }

  console.log('\n=== DEBUG COMPLETE ===');
  console.log('💡 Next steps:');
  console.log('1. If jobs exist but none are external (is_internal=false), you need to mark some jobs as external');
  console.log('2. If jobs exist but none are completed, you need to update job status to "completed"');
  console.log('3. If jobs exist but missing received_quantity, you need to fill in received quantities');
  console.log('4. For printing/stitching jobs, rate field must also be filled');
  console.log('5. Make sure vendors table has records');
})();
