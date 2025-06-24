// Debug script to check available jobs data
import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'https://lhwzmrssktlkkdttfxvo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxod3ptcnNza3Rsa2tkdHRmeHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1MDc1NDksImV4cCI6MjA1MDA4MzU0OX0.YQWV49VZWjMD7-F5P1uTtmzJqrGZjrOj6JKr35aeM-g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugJobs() {
  console.log('=== DEBUGGING AVAILABLE JOBS ===\n');
  
  // Check cutting jobs
  console.log('1. CHECKING CUTTING JOBS:');
  const { data: allCuttingJobs, error: cuttingError } = await supabase
    .from('cutting_jobs')
    .select('id, worker_name, is_internal, received_quantity, status, created_at');
    
  console.log('- Total cutting jobs:', allCuttingJobs?.length || 0);
  console.log('- Cutting jobs error:', cuttingError);
  if (allCuttingJobs) {
    console.log('- Sample cutting job:', allCuttingJobs[0]);
    console.log('- Jobs by status:', allCuttingJobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {}));
    console.log('- Jobs by is_internal:', allCuttingJobs.reduce((acc, job) => {
      acc[job.is_internal ? 'internal' : 'external'] = (acc[job.is_internal ? 'internal' : 'external'] || 0) + 1;
      return acc;
    }, {}));
    console.log('- Jobs with received_quantity:', allCuttingJobs.filter(job => job.received_quantity !== null).length);
  }
  
  // Check completed, external cutting jobs
  const { data: filteredCuttingJobs, error: filteredCuttingError } = await supabase
    .from('cutting_jobs')
    .select('id, worker_name, is_internal, received_quantity, status')
    .eq('status', 'completed')
    .eq('is_internal', false)
    .not('received_quantity', 'is', null);
    
  console.log('- Filtered cutting jobs (completed, external, with received_quantity):', filteredCuttingJobs?.length || 0);
  console.log('- Filtered cutting jobs error:', filteredCuttingError);
  if (filteredCuttingJobs?.length > 0) {
    console.log('- Sample filtered cutting job:', filteredCuttingJobs[0]);
  }
  
  console.log('\n2. CHECKING PRINTING JOBS:');
  const { data: allPrintingJobs, error: printingError } = await supabase
    .from('printing_jobs')
    .select('id, worker_name, is_internal, rate, received_quantity, status, created_at');
    
  console.log('- Total printing jobs:', allPrintingJobs?.length || 0);
  console.log('- Printing jobs error:', printingError);
  if (allPrintingJobs) {
    console.log('- Sample printing job:', allPrintingJobs[0]);
    console.log('- Jobs by status:', allPrintingJobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {}));
    console.log('- Jobs by is_internal:', allPrintingJobs.reduce((acc, job) => {
      acc[job.is_internal ? 'internal' : 'external'] = (acc[job.is_internal ? 'internal' : 'external'] || 0) + 1;
      return acc;
    }, {}));
    console.log('- Jobs with rate:', allPrintingJobs.filter(job => job.rate !== null).length);
    console.log('- Jobs with received_quantity:', allPrintingJobs.filter(job => job.received_quantity !== null).length);
  }
  
  console.log('\n3. CHECKING STITCHING JOBS:');
  const { data: allStitchingJobs, error: stitchingError } = await supabase
    .from('stitching_jobs')
    .select('id, worker_name, is_internal, rate, received_quantity, status, created_at');
    
  console.log('- Total stitching jobs:', allStitchingJobs?.length || 0);
  console.log('- Stitching jobs error:', stitchingError);
  if (allStitchingJobs) {
    console.log('- Sample stitching job:', allStitchingJobs[0]);
    console.log('- Jobs by status:', allStitchingJobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {}));
    console.log('- Jobs by is_internal:', allStitchingJobs.reduce((acc, job) => {
      acc[job.is_internal ? 'internal' : 'external'] = (acc[job.is_internal ? 'internal' : 'external'] || 0) + 1;
      return acc;
    }, {}));
    console.log('- Jobs with rate:', allStitchingJobs.filter(job => job.rate !== null).length);
    console.log('- Jobs with received_quantity:', allStitchingJobs.filter(job => job.received_quantity !== null).length);
  }
  
  console.log('\n4. CHECKING EXISTING VENDOR BILLS:');
  const { data: existingBills, error: billsError } = await supabase
    .from('vendor_bills')
    .select('id, job_id, job_type, bill_number, vendor_name');
    
  console.log('- Total existing vendor bills:', existingBills?.length || 0);
  console.log('- Vendor bills error:', billsError);
  if (existingBills?.length > 0) {
    console.log('- Sample vendor bill:', existingBills[0]);
  }
  
  console.log('\n5. CHECKING VENDORS:');
  const { data: vendors, error: vendorsError } = await supabase
    .from('vendors')
    .select('id, name, service_type, contact_person');
    
  console.log('- Total vendors:', vendors?.length || 0);
  console.log('- Vendors error:', vendorsError);
  if (vendors?.length > 0) {
    console.log('- Sample vendor:', vendors[0]);
    console.log('- Vendors by service type:', vendors.reduce((acc, vendor) => {
      acc[vendor.service_type] = (acc[vendor.service_type] || 0) + 1;
      return acc;
    }, {}));
  }
}

debugJobs().then(() => {
  console.log('\n=== DEBUG COMPLETE ===');
  process.exit(0);
}).catch(console.error);
