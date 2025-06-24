// Test script to validate vendor functionality
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';

async function testVendorFunctionality() {
  console.log('🚀 Testing Vendor Functionality...\n');
  
  try {
    // Read environment variables from .env file
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '.env');
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');
      
      for (const line of envLines) {
        if (line.includes('=')) {
          const [key, value] = line.split('=');
          if (key.trim() && value.trim()) {
            process.env[key.trim()] = value.trim();
          }
        }
      }
    }
    
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );
    
    console.log('✅ Supabase client initialized');
    
    // Test 1: Check vendors
    console.log('\n📊 Step 1: Checking vendors...');
    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .select('id, name, phone')
      .limit(5);
    
    if (vendorError) {
      console.error('❌ Error fetching vendors:', vendorError.message);
      return;
    }
    
    console.log(`✅ Found ${vendors?.length || 0} vendors`);
    if (vendors && vendors.length > 0) {
      console.log('📋 Sample vendors:');
      vendors.forEach((vendor, index) => {
        console.log(`   ${index + 1}. ${vendor.name} (ID: ${vendor.id})`);
      });
    }
    
    // Test 2: Check jobs with vendor_id
    console.log('\n📊 Step 2: Checking jobs with vendor_id...');
    const jobTables = ['cutting_jobs', 'printing_jobs', 'stitching_jobs'];
    
    for (const table of jobTables) {
      const { data: jobs, error: jobError } = await supabase
        .from(table)
        .select('id, worker_name, vendor_id')
        .not('vendor_id', 'is', null)
        .limit(5);
      
      if (jobError) {
        console.error(`❌ Error fetching ${table}:`, jobError.message);
        continue;
      }
      
      console.log(`✅ ${table}: ${jobs?.length || 0} jobs with vendor_id`);
      if (jobs && jobs.length > 0) {
        jobs.forEach((job, index) => {
          console.log(`   ${index + 1}. Worker: ${job.worker_name}, Vendor ID: ${job.vendor_id}`);
        });
      }
    }
    
    // Test 3: Check vendor bills availability
    console.log('\n📊 Step 3: Checking vendor bills...');
    
    // Query all jobs for vendor bills calculation
    const allJobsQueries = jobTables.map(async (table) => {
      const { data, error } = await supabase
        .from(table)
        .select(`
          id,
          worker_name,
          vendor_id,
          amount,
          created_at,
          vendors!inner(id, name, phone)
        `)
        .not('vendor_id', 'is', null);
      
      return { table, data: data || [], error };
    });
    
    const results = await Promise.all(allJobsQueries);
    let totalAvailableJobs = 0;
    
    results.forEach(({ table, data, error }) => {
      if (error) {
        console.error(`❌ Error querying ${table} for vendor bills:`, error.message);
        return;
      }
      
      console.log(`✅ ${table}: ${data.length} jobs available for vendor bills`);
      totalAvailableJobs += data.length;
      
      if (data.length > 0) {
        console.log(`   Sample from ${table}:`);
        data.slice(0, 2).forEach((job, index) => {
          console.log(`     ${index + 1}. ${job.worker_name} (${job.vendors.name}) - $${job.amount || 'N/A'}`);
        });
      }
    });
    
    console.log(`\n🎯 TOTAL AVAILABLE JOBS FOR VENDOR BILLS: ${totalAvailableJobs}`);
    
    if (totalAvailableJobs === 0) {
      console.log('\n⚠️  NO JOBS AVAILABLE FOR VENDOR BILLS!');
      console.log('   This means jobs were created without vendor_id.');
      console.log('   Solution: Create new jobs using the updated forms.');
    } else {
      console.log('\n🎉 SUCCESS! Vendor bills should show available jobs.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testVendorFunctionality().then(() => {
  console.log('\n✅ Vendor functionality test completed.');
}).catch(error => {
  console.error('❌ Test execution failed:', error.message);
});
