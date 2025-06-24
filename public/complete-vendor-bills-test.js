// Complete Vendor Bills Test - Run in Browser Console
// Navigate to http://localhost:8084/ and run this script

window.completeVendorBillsTest = async function() {
  console.log('🚀 Complete Vendor Bills Test Starting...\n');
  
  if (!window.supabase) {
    console.error('❌ Supabase not available. Make sure you are on the application page.');
    return;
  }
  
  try {
    // Step 1: Create test vendors via the API (should work with proper authentication)
    console.log('📊 Step 1: Creating test vendors...');
    
    const testVendors = [
      { name: 'ABC Cutting Works', service_type: 'cutting', phone: '9876543210' },
      { name: 'XYZ Printing House', service_type: 'printing', phone: '8765432109' },
      { name: 'DEF Stitching Unit', service_type: 'stitching', phone: '7654321098' }
    ];
    
    const createdVendors = [];
    
    for (const vendor of testVendors) {
      try {
        // First check if vendor already exists
        const { data: existing } = await window.supabase
          .from('vendors')
          .select('id, name')
          .eq('name', vendor.name)
          .single();
        
        if (existing) {
          console.log(`✅ Vendor exists: ${existing.name} (ID: ${existing.id})`);
          createdVendors.push(existing);
        } else {
          // Try to create the vendor
          const { data, error } = await window.supabase
            .from('vendors')
            .insert({
              ...vendor,
              status: 'active',
              contact_person: 'Test Contact'
            })
            .select()
            .single();
          
          if (error) {
            console.error(`❌ Error creating vendor ${vendor.name}:`, error.message);
          } else {
            console.log(`✅ Created vendor: ${data.name} (ID: ${data.id})`);
            createdVendors.push(data);
          }
        }
      } catch (error) {
        console.log(`⚠️  Could not create/find vendor ${vendor.name}, trying to find existing ones...`);
      }
    }
    
    // Step 2: If we couldn't create vendors, try to find any existing ones
    if (createdVendors.length === 0) {
      console.log('\n📊 Step 2: Looking for existing vendors...');
      
      const { data: existingVendors, error } = await window.supabase
        .from('vendors')
        .select('id, name, service_type, phone')
        .limit(10);
      
      if (error) {
        console.error('❌ Error fetching existing vendors:', error.message);
      } else {
        console.log(`✅ Found ${existingVendors?.length || 0} existing vendors`);
        if (existingVendors && existingVendors.length > 0) {
          createdVendors.push(...existingVendors);
          existingVendors.forEach((vendor, index) => {
            console.log(`   ${index + 1}. ${vendor.name} (${vendor.service_type}) - ID: ${vendor.id}`);
          });
        }
      }
    }
    
    if (createdVendors.length === 0) {
      console.log('\n⚠️  No vendors available. Please create vendors manually at /vendors/new');
      console.log('📝 Instructions:');
      console.log('1. Navigate to /vendors/new');
      console.log('2. Create at least one vendor');
      console.log('3. Then run this test again');
      return;
    }
    
    // Step 3: Check current jobs with vendor_id
    console.log('\n📊 Step 3: Checking current jobs with vendor_id...');
    
    const jobTables = [
      { table: 'cutting_jobs', columns: 'id, worker_name, vendor_id, created_at' },
      { table: 'printing_jobs', columns: 'id, worker_name, vendor_id, created_at' },
      { table: 'stitching_jobs', columns: 'id, worker_name, vendor_id, created_at' }
    ];
    
    let totalJobsWithVendor = 0;
    
    for (const { table, columns } of jobTables) {
      const { data: jobs, error } = await window.supabase
        .from(table)
        .select(columns)
        .not('vendor_id', 'is', null);
      
      if (error) {
        console.error(`❌ Error querying ${table}:`, error.message);
      } else {
        console.log(`✅ ${table}: ${jobs?.length || 0} jobs with vendor_id`);
        totalJobsWithVendor += jobs?.length || 0;
        
        if (jobs && jobs.length > 0) {
          jobs.slice(0, 2).forEach((job, index) => {
            console.log(`   ${index + 1}. Worker: ${job.worker_name}, Vendor ID: ${job.vendor_id}`);
          });
        }
      }
    }
    
    console.log(`\n📊 Total jobs with vendor_id: ${totalJobsWithVendor}`);
    
    // Step 4: Test vendor bills query (the actual query used by the vendor bills page)
    console.log('\n📊 Step 4: Testing vendor bills query...');
    
    const vendorBillsQueries = [
      {
        table: 'cutting_jobs',
        query: window.supabase
          .from('cutting_jobs')
          .select(`
            id,
            worker_name,
            vendor_id,
            created_at,
            vendors!inner(id, name, phone)
          `)
          .not('vendor_id', 'is', null)
      },
      {
        table: 'printing_jobs',
        query: window.supabase
          .from('printing_jobs')
          .select(`
            id,
            worker_name,
            vendor_id,
            rate,
            created_at,
            vendors!inner(id, name, phone)
          `)
          .not('vendor_id', 'is', null)
      },
      {
        table: 'stitching_jobs',
        query: window.supabase
          .from('stitching_jobs')
          .select(`
            id,
            worker_name,
            vendor_id,
            rate,
            created_at,
            vendors!inner(id, name, phone)
          `)
          .not('vendor_id', 'is', null)
      }
    ];
    
    const results = await Promise.all(
      vendorBillsQueries.map(async ({ table, query }) => {
        const { data, error } = await query;
        return { table, data: data || [], error };
      })
    );
    
    let totalBillableJobs = 0;
    const vendorBillsMap = new Map();
    
    results.forEach(({ table, data, error }) => {
      if (error) {
        console.error(`❌ Error in ${table} vendor bills query:`, error.message);
        return;
      }
      
      console.log(`✅ ${table}: ${data.length} jobs with valid vendor relationships`);
      totalBillableJobs += data.length;
      
      // Group by vendor
      data.forEach(job => {
        const vendorId = job.vendor_id;
        const vendorName = job.vendors.name;
        
        if (!vendorBillsMap.has(vendorId)) {
          vendorBillsMap.set(vendorId, {
            vendor_name: vendorName,
            vendor_phone: job.vendors.phone,
            job_count: 0,
            jobs: []
          });
        }
        
        const vendorBill = vendorBillsMap.get(vendorId);
        vendorBill.job_count += 1;
        vendorBill.jobs.push({
          table,
          job_id: job.id,
          worker_name: job.worker_name,
          created_at: job.created_at
        });
      });
    });
    
    // Step 5: Display results
    console.log(`\n🎯 VENDOR BILLS SUMMARY:`);
    console.log(`📊 Total billable jobs: ${totalBillableJobs}`);
    console.log(`👥 Vendors with bills: ${vendorBillsMap.size}`);
    
    if (vendorBillsMap.size > 0) {
      console.log('\n📋 Vendor Bills Breakdown:');
      
      vendorBillsMap.forEach((bill, vendorId) => {
        console.log(`\n   🏢 ${bill.vendor_name} (ID: ${vendorId})`);
        console.log(`      📞 Phone: ${bill.vendor_phone}`);
        console.log(`      💼 Jobs: ${bill.job_count}`);
        
        bill.jobs.forEach((job, index) => {
          console.log(`         ${index + 1}. ${job.table}: ${job.worker_name}`);
        });
      });
      
      console.log('\n🎉 SUCCESS! Vendor bills functionality is working!');
      console.log('✅ Jobs are properly linked to vendors');
      console.log('✅ Vendor relationships are resolved correctly');
      console.log('✅ The /accounts/vendor-bills page should now show these jobs');
      
      console.log('\n📝 Next Steps:');
      console.log('1. Navigate to /accounts/vendor-bills to see the results');
      console.log('2. Create new jobs through the production forms');
      console.log('3. Test vendor selection in job creation forms');
      
    } else {
      console.log('\n⚠️  No vendor bills found. This means:');
      console.log('   1. Jobs exist but are not linked to valid vendors');
      console.log('   2. Need to create new jobs with proper vendor selection');
      
      console.log('\n📝 To fix this:');
      console.log('1. Go to /production/cutting, /production/printing, or /production/stitching');
      console.log('2. Create new jobs and select vendors from the dropdown');
      console.log('3. Make sure the vendor_id is saved with the job');
    }
    
    // Step 6: Test the vendor creation UI instruction
    console.log('\n📊 Step 6: Vendor Management Instructions:');
    console.log('✅ Create vendors at: /vendors/new');
    console.log('✅ View vendors at: /vendors');
    console.log('✅ Test job creation at: /production/cutting, /production/printing, /production/stitching');
    console.log('✅ Check vendor bills at: /accounts/vendor-bills');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

console.log('✅ Complete Vendor Bills Test loaded!');
console.log('📝 Run: window.completeVendorBillsTest() to execute the test');
