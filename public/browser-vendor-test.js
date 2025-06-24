// Simple browser console test for vendor functionality
// Open the application (localhost:8084) and run this in the console

window.testVendorFlow = async function() {
  console.log('🚀 Starting Vendor Flow Test...\n');
  
  if (!window.supabase) {
    console.error('❌ Supabase not available. Make sure you are on the application page.');
    return;
  }
  
  try {
    // Step 1: Create test vendors
    console.log('📊 Step 1: Creating test vendors...');
    
    const vendorsToCreate = [
      { name: 'Test Vendor A', phone: '1234567890' },
      { name: 'Test Vendor B', phone: '0987654321' },
      { name: 'Test Vendor C', phone: '5555555555' }
    ];
    
    for (const vendor of vendorsToCreate) {
      const { data, error } = await window.supabase
        .from('vendors')
        .upsert(vendor, { onConflict: 'name' })
        .select();
      
      if (error) {
        console.error(`❌ Error creating vendor ${vendor.name}:`, error.message);
      } else {
        console.log(`✅ Created/updated vendor: ${vendor.name} (ID: ${data[0]?.id})`);
      }
    }
    
    // Step 2: Verify vendors exist
    console.log('\n📊 Step 2: Verifying vendors...');
    const { data: vendors, error: vendorError } = await window.supabase
      .from('vendors')
      .select('id, name, phone');
    
    if (vendorError) {
      console.error('❌ Error fetching vendors:', vendorError.message);
      return;
    }
    
    console.log(`✅ Found ${vendors.length} vendors:`);
    vendors.forEach((vendor, index) => {
      console.log(`   ${index + 1}. ${vendor.name} (ID: ${vendor.id})`);
    });
    
    if (vendors.length === 0) {
      console.error('❌ No vendors found. Cannot proceed with job tests.');
      return;
    }
    
    // Step 3: Test job creation with vendor_id
    console.log('\n📊 Step 3: Testing job creation with vendor_id...');
    
    const testVendor = vendors[0];
    console.log(`Using test vendor: ${testVendor.name} (ID: ${testVendor.id})`);
    
    // Create test cutting job
    const cuttingJobData = {
      order_id: 'TEST-001',
      worker_name: testVendor.name,
      vendor_id: testVendor.id,
      quantity: 100,
      rate: 5.50,
      status: 'pending'
    };
    
    const { data: cuttingJob, error: cuttingError } = await window.supabase
      .from('cutting_jobs')
      .insert(cuttingJobData)
      .select();
    
    if (cuttingError) {
      console.error('❌ Error creating cutting job:', cuttingError.message);
    } else {
      console.log('✅ Created cutting job with vendor_id:', cuttingJob[0]?.id);
    }
    
    // Create test printing job
    const printingJobData = {
      order_id: 'TEST-002',
      worker_name: testVendor.name,
      vendor_id: testVendor.id,
      quantity: 50,
      rate: 3.25,
      status: 'pending'
    };
    
    const { data: printingJob, error: printingError } = await window.supabase
      .from('printing_jobs')
      .insert(printingJobData)
      .select();
    
    if (printingError) {
      console.error('❌ Error creating printing job:', printingError.message);
    } else {
      console.log('✅ Created printing job with vendor_id:', printingJob[0]?.id);
    }
    
    // Step 4: Verify vendor bills functionality
    console.log('\n📊 Step 4: Testing vendor bills query...');
    
    const { data: vendorBillsData, error: billsError } = await window.supabase
      .from('cutting_jobs')
      .select(`
        id,
        worker_name,
        vendor_id,
        quantity,
        rate,
        created_at,
        vendors!inner(id, name, phone)
      `)
      .not('vendor_id', 'is', null);
    
    if (billsError) {
      console.error('❌ Error querying vendor bills:', billsError.message);
    } else {
      console.log(`✅ Vendor bills query successful: ${vendorBillsData.length} jobs found`);
      
      if (vendorBillsData.length > 0) {
        console.log('📋 Sample vendor bill data:');
        vendorBillsData.forEach((job, index) => {
          const total = job.quantity * job.rate;
          console.log(`   ${index + 1}. ${job.vendors.name}: ${job.quantity} × $${job.rate} = $${total.toFixed(2)}`);
        });
      }
    }
    
    // Step 5: Check current vendor bills total
    console.log('\n📊 Step 5: Calculating total available jobs for vendor bills...');
    
    const jobTables = ['cutting_jobs', 'printing_jobs', 'stitching_jobs'];
    let totalJobs = 0;
    
    for (const table of jobTables) {
      const { count, error } = await window.supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .not('vendor_id', 'is', null);
      
      if (error) {
        console.error(`❌ Error counting ${table}:`, error.message);
      } else {
        console.log(`✅ ${table}: ${count} jobs with vendor_id`);
        totalJobs += count;
      }
    }
    
    console.log(`\n🎯 TOTAL AVAILABLE JOBS FOR VENDOR BILLS: ${totalJobs}`);
    
    if (totalJobs > 0) {
      console.log('\n🎉 SUCCESS! Vendor bills should now show available jobs.');
      console.log('📝 Next step: Navigate to /accounts/vendor-bills to verify the UI.');
    } else {
      console.log('\n⚠️  Still no jobs available. Check the job creation process.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

console.log('✅ Vendor flow test loaded!');
console.log('📝 Run: window.testVendorFlow() to execute the test');
