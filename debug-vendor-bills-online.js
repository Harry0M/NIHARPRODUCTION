// Debug script for vendor bills issue with online Supabase
// Run this in your browser console at your application URL

console.log('🔍 VENDOR BILLS ONLINE DEBUG SCRIPT');
console.log('=====================================');

// Check if we're using the right Supabase instance
async function checkSupabaseConfig() {
  console.log('\n📡 CHECKING SUPABASE CONFIGURATION');
  
  if (typeof supabase === 'undefined') {
    console.error('❌ Supabase client not found. Make sure you are on the application page.');
    return false;
  }
  
  // Try to access Supabase client URL to see which instance we're connected to
  console.log('✅ Supabase client found');
  
  // Test connection with a simple query
  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('id, name')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
    
    console.log('✅ Connection successful');
    console.log('📊 Sample vendor data:', data);
    return true;
  } catch (err) {
    console.error('❌ Connection error:', err);
    return false;
  }
}

// Check what jobs exist in the system
async function analyzeJobs() {
  console.log('\n🔍 ANALYZING JOBS IN SYSTEM');
  
  try {
    // Check all job types with basic queries
    const [cutting, printing, stitching] = await Promise.all([
      supabase.from('cutting_jobs').select('*'),
      supabase.from('printing_jobs').select('*'),
      supabase.from('stitching_jobs').select('*')
    ]);
    
    console.log('📊 TOTAL JOBS IN SYSTEM:');
    console.log(`- Cutting jobs: ${cutting.data?.length || 0}`);
    console.log(`- Printing jobs: ${printing.data?.length || 0}`);
    console.log(`- Stitching jobs: ${stitching.data?.length || 0}`);
    
    if (cutting.error) console.error('❌ Cutting error:', cutting.error);
    if (printing.error) console.error('❌ Printing error:', printing.error);
    if (stitching.error) console.error('❌ Stitching error:', stitching.error);
    
    // Check vendor-related jobs (is_internal = false)
    const [externalCutting, externalPrinting, externalStitching] = await Promise.all([
      supabase.from('cutting_jobs').select('*').eq('is_internal', false),
      supabase.from('printing_jobs').select('*').eq('is_internal', false),
      supabase.from('stitching_jobs').select('*').eq('is_internal', false)
    ]);
    
    console.log('\n📊 EXTERNAL VENDOR JOBS (is_internal = false):');
    console.log(`- External cutting jobs: ${externalCutting.data?.length || 0}`);
    console.log(`- External printing jobs: ${externalPrinting.data?.length || 0}`);
    console.log(`- External stitching jobs: ${externalStitching.data?.length || 0}`);
    
    // Check completed vendor jobs
    const [completedCutting, completedPrinting, completedStitching] = await Promise.all([
      supabase.from('cutting_jobs').select('*').eq('is_internal', false).eq('status', 'completed'),
      supabase.from('printing_jobs').select('*').eq('is_internal', false).eq('status', 'completed'),
      supabase.from('stitching_jobs').select('*').eq('is_internal', false).eq('status', 'completed')
    ]);
    
    console.log('\n📊 COMPLETED EXTERNAL VENDOR JOBS:');
    console.log(`- Completed cutting jobs: ${completedCutting.data?.length || 0}`);
    console.log(`- Completed printing jobs: ${completedPrinting.data?.length || 0}`);
    console.log(`- Completed stitching jobs: ${completedStitching.data?.length || 0}`);
    
    // Show sample data
    if (completedCutting.data?.[0]) {
      console.log('\n🔶 SAMPLE COMPLETED CUTTING JOB:');
      console.log(completedCutting.data[0]);
    }
    if (completedPrinting.data?.[0]) {
      console.log('\n🔷 SAMPLE COMPLETED PRINTING JOB:');
      console.log(completedPrinting.data[0]);
    }
    if (completedStitching.data?.[0]) {
      console.log('\n🔸 SAMPLE COMPLETED STITCHING JOB:');
      console.log(completedStitching.data[0]);
    }
    
    return {
      cutting: cutting.data?.length || 0,
      printing: printing.data?.length || 0,
      stitching: stitching.data?.length || 0,
      externalCutting: externalCutting.data?.length || 0,
      externalPrinting: externalPrinting.data?.length || 0,
      externalStitching: externalStitching.data?.length || 0,
      completedCutting: completedCutting.data?.length || 0,
      completedPrinting: completedPrinting.data?.length || 0,
      completedStitching: completedStitching.data?.length || 0
    };
    
  } catch (error) {
    console.error('❌ Error analyzing jobs:', error);
    return null;
  }
}

// Check job_cards and their relationships
async function analyzeJobCards() {
  console.log('\n🔍 ANALYZING JOB CARDS AND RELATIONSHIPS');
  
  try {
    // Check job_cards table
    const { data: jobCards, error: jobCardsError } = await supabase
      .from('job_cards')
      .select('*');
    
    if (jobCardsError) {
      console.error('❌ Job cards error:', jobCardsError);
      return;
    }
    
    console.log(`📊 Total job cards: ${jobCards?.length || 0}`);
    
    // Check if job cards have vendor_id
    const jobCardsWithVendors = jobCards?.filter(jc => jc.vendor_id) || [];
    console.log(`📊 Job cards with vendor_id: ${jobCardsWithVendors.length}`);
    
    if (jobCardsWithVendors.length > 0) {
      console.log('\n🔗 SAMPLE JOB CARD WITH VENDOR:');
      console.log(jobCardsWithVendors[0]);
    }
    
    // Check if jobs have job_card_id
    const [cuttingWithJobCards, printingWithJobCards, stitchingWithJobCards] = await Promise.all([
      supabase.from('cutting_jobs').select('id, job_card_id, worker_name, is_internal, status').not('job_card_id', 'is', null),
      supabase.from('printing_jobs').select('id, job_card_id, worker_name, is_internal, status').not('job_card_id', 'is', null),
      supabase.from('stitching_jobs').select('id, job_card_id, worker_name, is_internal, status').not('job_card_id', 'is', null)
    ]);
    
    console.log('\n📊 JOBS WITH JOB_CARD_ID:');
    console.log(`- Cutting jobs with job_card_id: ${cuttingWithJobCards.data?.length || 0}`);
    console.log(`- Printing jobs with job_card_id: ${printingWithJobCards.data?.length || 0}`);
    console.log(`- Stitching jobs with job_card_id: ${stitchingWithJobCards.data?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Error analyzing job cards:', error);
  }
}

// Check existing vendor bills
async function analyzeVendorBills() {
  console.log('\n🔍 ANALYZING EXISTING VENDOR BILLS');
  
  try {
    const { data: bills, error } = await supabase
      .from('vendor_bills')
      .select('*');
    
    if (error) {
      console.error('❌ Vendor bills error:', error);
      return;
    }
    
    console.log(`📊 Total vendor bills: ${bills?.length || 0}`);
    
    if (bills?.length > 0) {
      console.log('\n📋 SAMPLE VENDOR BILL:');
      console.log(bills[0]);
      
      const billsByType = bills.reduce((acc, bill) => {
        acc[bill.job_type] = (acc[bill.job_type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📊 BILLS BY JOB TYPE:');
      Object.entries(billsByType).forEach(([type, count]) => {
        console.log(`- ${type}: ${count}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error analyzing vendor bills:', error);
  }
}

// Main diagnostic function
async function runDiagnostic() {
  console.log('🚀 STARTING VENDOR BILLS DIAGNOSTIC');
  
  const configOk = await checkSupabaseConfig();
  if (!configOk) {
    console.log('❌ Cannot proceed - Supabase configuration issue');
    return;
  }
  
  const jobStats = await analyzeJobs();
  await analyzeJobCards();
  await analyzeVendorBills();
  
  console.log('\n🎯 DIAGNOSTIC SUMMARY');
  console.log('=====================');
  
  if (jobStats) {
    if (jobStats.completedCutting === 0 && jobStats.completedPrinting === 0 && jobStats.completedStitching === 0) {
      console.log('❌ ISSUE FOUND: No completed external vendor jobs');
      console.log('🔧 SOLUTION: You need to:');
      console.log('   1. Create jobs with is_internal = false');
      console.log('   2. Set status = "completed"');
      console.log('   3. Add received_quantity value');
      console.log('   4. For printing/stitching: Add rate value');
      console.log('   5. Link jobs to job_cards with vendor_id');
    } else {
      console.log('✅ Found completed external vendor jobs');
      console.log('🔍 If vendor bills page is still empty, check:');
      console.log('   1. Job cards have vendor_id set');
      console.log('   2. Jobs have job_card_id linking to job_cards');
      console.log('   3. Job cards are linked to orders');
    }
  }
  
  console.log('\n💡 NEXT STEPS:');
  console.log('1. If no jobs exist: Create test jobs using the admin interface');
  console.log('2. If jobs exist but no vendor bills show: Check job_card relationships');
  console.log('3. If you need help creating test data, let me know!');
}

// Auto-run the diagnostic
runDiagnostic().catch(console.error);

// Make functions available globally for manual testing
window.vendorBillsDebug = {
  runDiagnostic,
  checkSupabaseConfig,
  analyzeJobs,
  analyzeJobCards,
  analyzeVendorBills
};

console.log('\n🛠️ DEBUG FUNCTIONS AVAILABLE:');
console.log('- vendorBillsDebug.runDiagnostic()');
console.log('- vendorBillsDebug.analyzeJobs()');
console.log('- vendorBillsDebug.analyzeJobCards()');
console.log('- vendorBillsDebug.analyzeVendorBills()');
