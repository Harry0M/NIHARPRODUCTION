// Comprehensive Vendor Selection Functionality Test
// Run this in the browser console on the application page (localhost:8083)

window.vendorSelectionTest = {
  // Initialize test environment
  async init() {
    console.log('🚀 Initializing Vendor Selection Test Suite...');
    
    // Check if Supabase is available
    if (typeof window.supabase === 'undefined') {
      console.error('❌ Supabase client not available. Make sure you are on the application page.');
      return false;
    }
    
    console.log('✅ Supabase client available');
    return true;
  },
  
  // Step 1: Check current database state
  async checkCurrentState() {
    console.log('\n📊 STEP 1: Checking current database state...');
    
    try {
      // Check vendors
      const { data: vendors, error: vendorError } = await window.supabase
        .from('vendors')
        .select('id, name, phone')
        .limit(10);
      
      if (vendorError) {
        console.error('❌ Error fetching vendors:', vendorError);
        return false;
      }
      
      console.log(`✅ Found ${vendors?.length || 0} vendors`);
      if (vendors && vendors.length > 0) {
        console.log('📋 Sample vendors:', vendors.slice(0, 3));
      }
      
      // Check existing jobs with vendor_id
      const jobQueries = [
        { table: 'cutting_jobs', name: 'Cutting' },
        { table: 'printing_jobs', name: 'Printing' },
        { table: 'stitching_jobs', name: 'Stitching' }
      ];
      
      for (const jobType of jobQueries) {
        const { data: jobs, count } = await window.supabase
          .from(jobType.table)
          .select('id, worker_name, vendor_id', { count: 'exact' })
          .not('vendor_id', 'is', null);
        
        console.log(`📈 ${jobType.name} jobs with vendor_id: ${count || 0}`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error checking current state:', error);
      return false;
    }
  },
  
  // Step 2: Ensure test vendor exists
  async ensureTestVendor() {
    console.log('\n🏭 STEP 2: Ensuring test vendor exists...');
    
    try {
      // Check if test vendor exists
      const { data: existingVendor } = await window.supabase
        .from('vendors')
        .select('id, name')
        .eq('name', 'Test Vendor - Job Testing')
        .single();
      
      if (existingVendor) {
        console.log('✅ Test vendor already exists:', existingVendor);
        return existingVendor;
      }
      
      // Create test vendor
      const { data: newVendor, error } = await window.supabase
        .from('vendors')
        .insert([{
          name: 'Test Vendor - Job Testing',
          phone: '9999999999',
          email: 'test.vendor@example.com',
          address: 'Test Address',
          payment_terms: 'Test Terms'
        }])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error creating test vendor:', error);
        return null;
      }
      
      console.log('✅ Created test vendor:', newVendor);
      return newVendor;
    } catch (error) {
      console.error('❌ Error ensuring test vendor:', error);
      return null;
    }
  },
  
  // Step 3: Test cutting job creation with vendor_id
  async testCuttingJobCreation(vendor) {
    console.log('\n✂️ STEP 3: Testing cutting job creation with vendor_id...');
    
    try {
      // Get a job card to use
      const { data: jobCards } = await window.supabase
        .from('job_cards')
        .select('id, job_name, order_id')
        .limit(1);
      
      if (!jobCards || jobCards.length === 0) {
        console.log('⚠️ No job cards found. Skipping cutting job test.');
        return false;
      }
      
      const jobCard = jobCards[0];
      console.log('🎯 Using job card:', jobCard.job_name);
      
      // Create cutting job with vendor_id
      const cuttingJobData = {
        job_card_id: jobCard.id,
        worker_name: vendor.name,
        vendor_id: vendor.id, // Key field we're testing
        roll_width: 150,
        consumption_meters: 75,
        received_quantity: 1200,
        is_internal: false,
        status: 'pending'
      };
      
      const { data: newCuttingJob, error } = await window.supabase
        .from('cutting_jobs')
        .insert([cuttingJobData])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error creating cutting job:', error);
        return false;
      }
      
      console.log('✅ Created cutting job:', newCuttingJob);
      
      // Verify vendor_id was saved correctly
      if (newCuttingJob.vendor_id === vendor.id) {
        console.log('🎉 SUCCESS: vendor_id correctly saved in cutting job!');
        return true;
      } else {
        console.log('❌ FAILURE: vendor_id not saved correctly');
        return false;
      }
    } catch (error) {
      console.error('❌ Error testing cutting job creation:', error);
      return false;
    }
  },
  
  // Step 4: Test printing job creation with vendor_id
  async testPrintingJobCreation(vendor) {
    console.log('\n🖨️ STEP 4: Testing printing job creation with vendor_id...');
    
    try {
      // Get a job card to use
      const { data: jobCards } = await window.supabase
        .from('job_cards')
        .select('id, job_name, order_id')
        .limit(1);
      
      if (!jobCards || jobCards.length === 0) {
        console.log('⚠️ No job cards found. Skipping printing job test.');
        return false;
      }
      
      const jobCard = jobCards[0];
      
      // Create printing job with vendor_id
      const printingJobData = {
        job_card_id: jobCard.id,
        worker_name: vendor.name,
        vendor_id: vendor.id, // Key field we're testing
        received_quantity: 1000,
        rate: 5.50,
        is_internal: false,
        status: 'pending'
      };
      
      const { data: newPrintingJob, error } = await window.supabase
        .from('printing_jobs')
        .insert([printingJobData])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error creating printing job:', error);
        return false;
      }
      
      console.log('✅ Created printing job:', newPrintingJob);
      
      // Verify vendor_id was saved correctly
      if (newPrintingJob.vendor_id === vendor.id) {
        console.log('🎉 SUCCESS: vendor_id correctly saved in printing job!');
        return true;
      } else {
        console.log('❌ FAILURE: vendor_id not saved correctly');
        return false;
      }
    } catch (error) {
      console.error('❌ Error testing printing job creation:', error);
      return false;
    }
  },
  
  // Step 5: Test stitching job creation with vendor_id
  async testStitchingJobCreation(vendor) {
    console.log('\n🧵 STEP 5: Testing stitching job creation with vendor_id...');
    
    try {
      // Get a job card to use
      const { data: jobCards } = await window.supabase
        .from('job_cards')
        .select('id, job_name, order_id')
        .limit(1);
      
      if (!jobCards || jobCards.length === 0) {
        console.log('⚠️ No job cards found. Skipping stitching job test.');
        return false;
      }
      
      const jobCard = jobCards[0];
      
      // Create stitching job with vendor_id
      const stitchingJobData = {
        job_card_id: jobCard.id,
        worker_name: vendor.name,
        vendor_id: vendor.id, // Key field we're testing
        received_quantity: 800,
        part_quantity: 800,
        border_quantity: 1600,
        handle_quantity: 800,
        rate: 2.25,
        is_internal: false,
        status: 'pending'
      };
      
      const { data: newStitchingJob, error } = await window.supabase
        .from('stitching_jobs')
        .insert([stitchingJobData])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error creating stitching job:', error);
        return false;
      }
      
      console.log('✅ Created stitching job:', newStitchingJob);
      
      // Verify vendor_id was saved correctly
      if (newStitchingJob.vendor_id === vendor.id) {
        console.log('🎉 SUCCESS: vendor_id correctly saved in stitching job!');
        return true;
      } else {
        console.log('❌ FAILURE: vendor_id not saved correctly');
        return false;
      }
    } catch (error) {
      console.error('❌ Error testing stitching job creation:', error);
      return false;
    }
  },
  
  // Step 6: Test vendor bills functionality
  async testVendorBills() {
    console.log('\n💰 STEP 6: Testing vendor bills functionality...');
    
    try {
      // Count jobs with vendor_id across all job types
      const jobTypes = ['cutting_jobs', 'printing_jobs', 'stitching_jobs'];
      let totalJobsWithVendor = 0;
      const jobSummary = {};
      
      for (const jobType of jobTypes) {
        const { count } = await window.supabase
          .from(jobType)
          .select('*', { count: 'exact', head: true })
          .not('vendor_id', 'is', null);
        
        jobSummary[jobType] = count || 0;
        totalJobsWithVendor += count || 0;
      }
      
      console.log('📊 Jobs with vendor_id summary:');
      console.log('  - Cutting jobs:', jobSummary.cutting_jobs);
      console.log('  - Printing jobs:', jobSummary.printing_jobs);
      console.log('  - Stitching jobs:', jobSummary.stitching_jobs);
      console.log('  - Total:', totalJobsWithVendor);
      
      if (totalJobsWithVendor > 0) {
        console.log('🎉 SUCCESS: Vendor bills should now show available jobs!');
        console.log('💡 Navigate to /accounts/vendor-bills to see the results');
        
        // Test the actual vendor bills query
        const { data: vendorBillsData, error } = await window.supabase
          .from('vendors')
          .select(`
            id,
            name,
            cutting_jobs:cutting_jobs!vendor_id(id, worker_name, rate, created_at),
            printing_jobs:printing_jobs!vendor_id(id, worker_name, rate, created_at),
            stitching_jobs:stitching_jobs!vendor_id(id, worker_name, rate, created_at)
          `);
        
        if (error) {
          console.error('❌ Error testing vendor bills query:', error);
        } else {
          const vendorsWithJobs = vendorBillsData?.filter(vendor => 
            (vendor.cutting_jobs?.length > 0) || 
            (vendor.printing_jobs?.length > 0) || 
            (vendor.stitching_jobs?.length > 0)
          );
          
          console.log(`✅ Vendors with jobs: ${vendorsWithJobs?.length || 0}`);
          if (vendorsWithJobs && vendorsWithJobs.length > 0) {
            console.log('📋 Sample vendor with jobs:', vendorsWithJobs[0]);
          }
        }
        
        return true;
      } else {
        console.log('⚠️ No jobs with vendor_id found. The tests above should have created some.');
        return false;
      }
    } catch (error) {
      console.error('❌ Error testing vendor bills:', error);
      return false;
    }
  },
  
  // Run all tests
  async runCompleteTest() {
    console.log('🎯 Starting Complete Vendor Selection Functionality Test\n');
    console.log('=' * 60);
    
    // Initialize
    if (!(await this.init())) return;
    
    // Check current state
    await this.checkCurrentState();
    
    // Ensure test vendor exists
    const vendor = await this.ensureTestVendor();
    if (!vendor) {
      console.error('❌ Could not create/find test vendor. Aborting tests.');
      return;
    }
    
    // Test job creation with vendor_id
    const cuttingSuccess = await this.testCuttingJobCreation(vendor);
    const printingSuccess = await this.testPrintingJobCreation(vendor);
    const stitchingSuccess = await this.testStitchingJobCreation(vendor);
    
    // Test vendor bills
    const vendorBillsSuccess = await this.testVendorBills();
    
    // Summary
    console.log('\n' + '=' * 60);
    console.log('📋 TEST SUMMARY:');
    console.log('✅ Cutting job creation:', cuttingSuccess ? 'PASSED' : 'FAILED');
    console.log('✅ Printing job creation:', printingSuccess ? 'PASSED' : 'FAILED');
    console.log('✅ Stitching job creation:', stitchingSuccess ? 'PASSED' : 'FAILED');
    console.log('✅ Vendor bills functionality:', vendorBillsSuccess ? 'PASSED' : 'FAILED');
    
    const allTestsPassed = cuttingSuccess && printingSuccess && stitchingSuccess && vendorBillsSuccess;
    
    if (allTestsPassed) {
      console.log('\n🎉 ALL TESTS PASSED! Vendor selection functionality is working correctly.');
      console.log('💡 Next steps:');
      console.log('   1. Navigate to /production/cutting to test the UI forms');
      console.log('   2. Navigate to /production/printing to test the UI forms');
      console.log('   3. Navigate to /production/stitching to test the UI forms');
      console.log('   4. Navigate to /accounts/vendor-bills to see the results');
    } else {
      console.log('\n❌ SOME TESTS FAILED. Check the logs above for details.');
    }
    
    return allTestsPassed;
  }
};

console.log('🔧 Vendor Selection Test Suite Loaded Successfully!');
console.log('💡 Run: window.vendorSelectionTest.runCompleteTest()');
