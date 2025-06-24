// Test vendor selection functionality by creating a job with vendor_id
// Run this in the browser console on the application page

window.testVendorSelection = {
  // Test creating a cutting job with vendor selection
  async testCuttingJobWithVendor() {
    console.log('🧪 Testing cutting job creation with vendor selection...');
    
    try {
      // First check if we have vendors available
      const { data: vendors, error: vendorError } = await window.supabase
        .from('vendors')
        .select('id, name')
        .limit(5);
      
      if (vendorError) {
        console.error('❌ Error fetching vendors:', vendorError);
        return;
      }
      
      if (!vendors || vendors.length === 0) {
        console.log('⚠️ No vendors found. Creating a test vendor first...');
        
        // Create a test vendor
        const { data: newVendor, error: createError } = await window.supabase
          .from('vendors')
          .insert([{
            name: 'Test Vendor for Jobs',
            phone: '9876543210',
            email: 'testvendor@example.com'
          }])
          .select()
          .single();
        
        if (createError) {
          console.error('❌ Error creating test vendor:', createError);
          return;
        }
        
        console.log('✅ Created test vendor:', newVendor);
        vendors.push(newVendor);
      }
      
      console.log('✅ Available vendors:', vendors);
      
      // Check if we have job cards available
      const { data: jobCards, error: jobCardError } = await window.supabase
        .from('job_cards')
        .select('id, job_name, order_id')
        .limit(1);
      
      if (jobCardError) {
        console.error('❌ Error fetching job cards:', jobCardError);
        return;
      }
      
      if (!jobCards || jobCards.length === 0) {
        console.log('⚠️ No job cards found. Please create an order and job card first.');
        return;
      }
      
      const testJobCard = jobCards[0];
      const testVendor = vendors[0];
      
      console.log('🎯 Using job card:', testJobCard.job_name);
      console.log('🎯 Using vendor:', testVendor.name);
      
      // Create a cutting job with vendor_id
      const cuttingJobData = {
        job_card_id: testJobCard.id,
        worker_name: testVendor.name,
        vendor_id: testVendor.id, // This is the key field we're testing
        roll_width: 100,
        consumption_meters: 50,
        received_quantity: 1000,
        is_internal: false, // External vendor
        status: 'pending'
      };
      
      console.log('📝 Creating cutting job with data:', cuttingJobData);
      
      const { data: newJob, error: jobError } = await window.supabase
        .from('cutting_jobs')
        .insert([cuttingJobData])
        .select()
        .single();
      
      if (jobError) {
        console.error('❌ Error creating cutting job:', jobError);
        return;
      }
      
      console.log('✅ Successfully created cutting job with vendor_id:', newJob);
      
      // Verify the vendor_id was saved correctly
      if (newJob.vendor_id === testVendor.id) {
        console.log('🎉 SUCCESS: vendor_id was correctly saved!');
        console.log('🔍 Job ID:', newJob.id);
        console.log('🔍 Vendor ID:', newJob.vendor_id);
        console.log('🔍 Worker Name:', newJob.worker_name);
      } else {
        console.log('❌ FAILURE: vendor_id was not saved correctly');
      }
      
      return newJob;
      
    } catch (error) {
      console.error('❌ Test failed with error:', error);
    }
  },
  
  // Test the vendor bills functionality
  async testVendorBills() {
    console.log('🧪 Testing vendor bills functionality...');
    
    try {
      // Check jobs with vendor_id
      const cuttingJobsQuery = window.supabase
        .from('cutting_jobs')
        .select('id, worker_name, vendor_id, job_card_id, created_at')
        .not('vendor_id', 'is', null);
      
      const printingJobsQuery = window.supabase
        .from('printing_jobs')
        .select('id, worker_name, vendor_id, job_card_id, created_at')
        .not('vendor_id', 'is', null);
      
      const stitchingJobsQuery = window.supabase
        .from('stitching_jobs')
        .select('id, worker_name, vendor_id, job_card_id, created_at')
        .not('vendor_id', 'is', null);
      
      const [cuttingResult, printingResult, stitchingResult] = await Promise.all([
        cuttingJobsQuery,
        printingJobsQuery,
        stitchingJobsQuery
      ]);
      
      console.log('🔍 Cutting jobs with vendor_id:', cuttingResult.data?.length || 0);
      console.log('🔍 Printing jobs with vendor_id:', printingResult.data?.length || 0);
      console.log('🔍 Stitching jobs with vendor_id:', stitchingResult.data?.length || 0);
      
      const totalJobsWithVendor = (cuttingResult.data?.length || 0) + 
                                 (printingResult.data?.length || 0) + 
                                 (stitchingResult.data?.length || 0);
      
      console.log('📊 Total jobs with vendor_id:', totalJobsWithVendor);
      
      if (totalJobsWithVendor > 0) {
        console.log('🎉 SUCCESS: Vendor bills should now show available jobs!');
        console.log('💡 Navigate to /accounts/vendor-bills to see the results');
      } else {
        console.log('⚠️ No jobs with vendor_id found. Create some jobs with vendor selection first.');
      }
      
      return {
        cutting: cuttingResult.data || [],
        printing: printingResult.data || [],
        stitching: stitchingResult.data || []
      };
      
    } catch (error) {
      console.error('❌ Vendor bills test failed:', error);
    }
  },
  
  // Run all tests
  async runAllTests() {
    console.log('🚀 Running all vendor selection tests...');
    
    await this.testCuttingJobWithVendor();
    await this.testVendorBills();
    
    console.log('✅ All tests completed! Check the results above.');
  }
};

console.log('🔧 Vendor Selection Test Suite Loaded');
console.log('💡 Run window.testVendorSelection.runAllTests() to test the functionality');
console.log('💡 Or run individual tests:');
console.log('   - window.testVendorSelection.testCuttingJobWithVendor()');
console.log('   - window.testVendorSelection.testVendorBills()');
