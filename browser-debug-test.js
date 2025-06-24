// Simple test to check database availability
// Run this in the browser console on the vendor bills page

console.log('=== VENDOR BILLS DEBUG TEST ===');

// Test basic Supabase connection
if (window.supabase) {
  console.log('✓ Supabase client available');
  
  // Test simple query
  window.supabase
    .from('cutting_jobs')
    .select('id, worker_name, is_internal, status, received_quantity')
    .limit(5)
    .then(result => {
      console.log('=== CUTTING JOBS TEST ===');
      console.log('Count:', result.data?.length || 0);
      console.log('Error:', result.error);
      console.log('Sample data:', result.data);
      
      if (result.data && result.data.length > 0) {
        console.log('Available statuses:', [...new Set(result.data.map(job => job.status))]);
        console.log('is_internal values:', [...new Set(result.data.map(job => job.is_internal))]);
      }
    });
    
  // Test printing jobs
  window.supabase
    .from('printing_jobs')
    .select('id, worker_name, is_internal, status, received_quantity, rate')
    .limit(5)
    .then(result => {
      console.log('=== PRINTING JOBS TEST ===');
      console.log('Count:', result.data?.length || 0);
      console.log('Error:', result.error);
      console.log('Sample data:', result.data);
    });
    
  // Test stitching jobs
  window.supabase
    .from('stitching_jobs')
    .select('id, worker_name, is_internal, status, received_quantity, rate')
    .limit(5)
    .then(result => {
      console.log('=== STITCHING JOBS TEST ===');
      console.log('Count:', result.data?.length || 0);
      console.log('Error:', result.error);
      console.log('Sample data:', result.data);
    });
    
  // Test vendors
  window.supabase
    .from('vendors')
    .select('id, name, service_type, contact_person')
    .limit(5)
    .then(result => {
      console.log('=== VENDORS TEST ===');
      console.log('Count:', result.data?.length || 0);
      console.log('Error:', result.error);
      console.log('Sample data:', result.data);
    });
    
} else {
  console.log('✗ Supabase client not available');
}

console.log('=== END DEBUG TEST ===');
