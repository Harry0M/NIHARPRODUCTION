// Simple CommonJS version of vendor-job check
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function simpleVendorJobCheck() {
  console.log('🔍 SIMPLE VENDOR-JOB RELATIONSHIP CHECK');
  console.log('========================================\n');

  try {
    // Check cutting jobs with vendor_id
    console.log('Checking cutting jobs...');
    const { data: cuttingWithVendors, error: cuttingError } = await supabase
      .from('cutting_jobs')
      .select('id, vendor_id, worker_name')
      .not('vendor_id', 'is', null);

    if (cuttingError) {
      console.error('❌ Error checking cutting jobs:', cuttingError);
    } else {
      console.log(`📋 Cutting jobs with vendor_id: ${cuttingWithVendors?.length || 0}`);
      if (cuttingWithVendors && cuttingWithVendors.length > 0) {
        cuttingWithVendors.slice(0, 3).forEach((job, i) => {
          console.log(`   ${i + 1}. Job ID: ${job.id}, Vendor ID: ${job.vendor_id}, Worker: ${job.worker_name}`);
        });
      }
    }

    // Check printing jobs with vendor_id
    console.log('Checking printing jobs...');
    const { data: printingWithVendors, error: printingError } = await supabase
      .from('printing_jobs')
      .select('id, vendor_id, worker_name')
      .not('vendor_id', 'is', null);

    if (printingError) {
      console.error('❌ Error checking printing jobs:', printingError);
    } else {
      console.log(`🖨️ Printing jobs with vendor_id: ${printingWithVendors?.length || 0}`);
      if (printingWithVendors && printingWithVendors.length > 0) {
        printingWithVendors.slice(0, 3).forEach((job, i) => {
          console.log(`   ${i + 1}. Job ID: ${job.id}, Vendor ID: ${job.vendor_id}, Worker: ${job.worker_name}`);
        });
      }
    }

    // Check stitching jobs with vendor_id
    console.log('Checking stitching jobs...');
    const { data: stitchingWithVendors, error: stitchingError } = await supabase
      .from('stitching_jobs')
      .select('id, vendor_id, worker_name')
      .not('vendor_id', 'is', null);

    if (stitchingError) {
      console.error('❌ Error checking stitching jobs:', stitchingError);
    } else {
      console.log(`🪡 Stitching jobs with vendor_id: ${stitchingWithVendors?.length || 0}`);
      if (stitchingWithVendors && stitchingWithVendors.length > 0) {
        stitchingWithVendors.slice(0, 3).forEach((job, i) => {
          console.log(`   ${i + 1}. Job ID: ${job.id}, Vendor ID: ${job.vendor_id}, Worker: ${job.worker_name}`);
        });
      }
    }

    // Summary
    const totalJobsWithVendors = (cuttingWithVendors?.length || 0) + 
                                (printingWithVendors?.length || 0) + 
                                (stitchingWithVendors?.length || 0);

    console.log('\n🎯 SUMMARY');
    console.log('===========');
    if (totalJobsWithVendors > 0) {
      console.log(`✅ Found ${totalJobsWithVendors} total jobs with vendor relationships`);
      console.log('   - Vendors ARE linked to job cards in your database');
    } else {
      console.log('❌ No jobs found with vendor relationships');
      console.log('   - No vendors are currently linked to any job cards');
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

// Run the check
simpleVendorJobCheck().then(() => {
  console.log('\n✅ Check complete');
}).catch(error => {
  console.error('💥 Check failed:', error);
});
