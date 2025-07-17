// Test database connection and check vendor_id functionality
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://trvwcetavifpeorkwixo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRydndjZXRhdmlmcGVvcmt3aXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NTM3ODEsImV4cCI6MjA2ODMyOTc4MX0.IH7vsTXK-QbH4Fv8HzFe38vTFvuAbV-WrpIkrZ0JGEw";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDatabaseConnection() {
  try {
    console.log('=== Testing Database Connection ===');
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('vendors')
      .select('id, name')
      .limit(1);
    
    if (testError) {
      console.error('Connection error:', testError);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    console.log('\n=== Checking Current Job Data ===');
    
    // Check cutting jobs
    const { data: cuttingJobs, error: cuttingError } = await supabase
      .from('cutting_jobs')
      .select('id, worker_name, vendor_id')
      .limit(5);
    
    console.log('\nCutting Jobs (first 5):');
    console.log(cuttingJobs);
    if (cuttingError) console.error('Cutting jobs error:', cuttingError);
    
    // Check printing jobs
    const { data: printingJobs, error: printingError } = await supabase
      .from('printing_jobs')
      .select('id, worker_name, vendor_id')
      .limit(5);
    
    console.log('\nPrinting Jobs (first 5):');
    console.log(printingJobs);
    if (printingError) console.error('Printing jobs error:', printingError);
    
    // Check stitching jobs
    const { data: stitchingJobs, error: stitchingError } = await supabase
      .from('stitching_jobs')
      .select('id, worker_name, vendor_id')
      .limit(5);
    
    console.log('\nStitching Jobs (first 5):');
    console.log(stitchingJobs);
    if (stitchingError) console.error('Stitching jobs error:', stitchingError);
    
    // Check vendors
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, name')
      .limit(10);
    
    console.log('\nVendors (first 10):');
    console.log(vendors);
    if (vendorsError) console.error('Vendors error:', vendorsError);
    
    // Count total jobs with vendor_id
    const { count: cuttingWithVendor } = await supabase
      .from('cutting_jobs')
      .select('*', { count: 'exact', head: true })
      .not('vendor_id', 'is', null);
    
    const { count: printingWithVendor } = await supabase
      .from('printing_jobs')
      .select('*', { count: 'exact', head: true })
      .not('vendor_id', 'is', null);
    
    const { count: stitchingWithVendor } = await supabase
      .from('stitching_jobs')
      .select('*', { count: 'exact', head: true })
      .not('vendor_id', 'is', null);
    
    console.log('\n=== Jobs with vendor_id ===');
    console.log('Cutting jobs with vendor_id:', cuttingWithVendor || 0);
    console.log('Printing jobs with vendor_id:', printingWithVendor || 0);
    console.log('Stitching jobs with vendor_id:', stitchingWithVendor || 0);
    
    // Check total jobs
    const { count: totalCutting } = await supabase
      .from('cutting_jobs')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalPrinting } = await supabase
      .from('printing_jobs')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalStitching } = await supabase
      .from('stitching_jobs')
      .select('*', { count: 'exact', head: true });
    
    console.log('\n=== Total Jobs ===');
    console.log('Total cutting jobs:', totalCutting || 0);
    console.log('Total printing jobs:', totalPrinting || 0);
    console.log('Total stitching jobs:', totalStitching || 0);
    
  } catch (error) {
    console.error('Error testing database:', error);
  }
}

testDatabaseConnection();
