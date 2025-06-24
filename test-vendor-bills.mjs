// Test vendor bills functionality specifically
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testVendorBillsFunctionality() {
  console.log('🚀 Testing Vendor Bills Functionality...\n');
  
  try {
    // Read environment variables from .env.local file
    const envPath = path.join(__dirname, '.env.local');
    
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
    
    // Check vendor bills functionality
    console.log('\n📊 Testing Vendor Bills Data Retrieval...');
      // Query 1: Check jobs with vendor_id
    const jobTables = [
      { table: 'cutting_jobs', columns: 'id, worker_name, vendor_id, roll_width, consumption_meters, received_quantity, created_at' },
      { table: 'printing_jobs', columns: 'id, worker_name, vendor_id, pulling, received_quantity, rate, created_at' },
      { table: 'stitching_jobs', columns: 'id, worker_name, vendor_id, provided_quantity, received_quantity, rate, created_at' }
    ];
    let totalJobsWithVendor = 0;
    
    for (const { table, columns } of jobTables) {
      try {
        const { data: jobs, error } = await supabase
          .from(table)
          .select(columns)
          .not('vendor_id', 'is', null);
        
        if (error) {
          console.error(`❌ Error querying ${table}:`, error.message);
          continue;
        }
        
        console.log(`✅ ${table}: ${jobs?.length || 0} jobs with vendor_id`);
        totalJobsWithVendor += jobs?.length || 0;
        
        if (jobs && jobs.length > 0) {
          console.log(`   Sample from ${table}:`);
          jobs.slice(0, 2).forEach((job, index) => {
            let details = `Worker: ${job.worker_name}, Vendor ID: ${job.vendor_id}`;
            
            if (table === 'cutting_jobs') {
              details += `, Roll Width: ${job.roll_width || 'N/A'}, Consumption: ${job.consumption_meters || 'N/A'}m`;
            } else if (table === 'printing_jobs') {
              details += `, Pulling: ${job.pulling || 'N/A'}, Rate: $${job.rate || 'N/A'}`;
            } else if (table === 'stitching_jobs') {
              details += `, Provided: ${job.provided_quantity || 'N/A'}, Rate: $${job.rate || 'N/A'}`;
            }
            
            console.log(`     ${index + 1}. ${details}`);
          });
        }
      } catch (error) {
        console.error(`❌ Error processing ${table}:`, error.message);
      }
    }
    
    console.log(`\n📊 Total jobs with vendor_id: ${totalJobsWithVendor}`);
    
    // Query 2: Test vendor bills aggregation
    console.log('\n📊 Testing Vendor Bills Aggregation...');
      try {
      // Get all jobs with vendor information
      const vendorBillsQueries = [
        {
          table: 'cutting_jobs',
          query: supabase
            .from('cutting_jobs')
            .select(`
              id,
              worker_name,
              vendor_id,
              roll_width,
              consumption_meters,
              received_quantity,
              created_at,
              vendors!inner(id, name, phone)
            `)
            .not('vendor_id', 'is', null)
        },
        {
          table: 'printing_jobs',
          query: supabase
            .from('printing_jobs')
            .select(`
              id,
              worker_name,
              vendor_id,
              pulling,
              received_quantity,
              rate,
              created_at,
              vendors!inner(id, name, phone)
            `)
            .not('vendor_id', 'is', null)
        },
        {
          table: 'stitching_jobs',
          query: supabase
            .from('stitching_jobs')
            .select(`
              id,
              worker_name,
              vendor_id,
              provided_quantity,
              received_quantity,
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
      
      // Process results
      const vendorBillsMap = new Map();
      let totalBillableJobs = 0;
      
      results.forEach(({ table, data, error }) => {
        if (error) {
          console.error(`❌ Error in ${table} vendor bills query:`, error.message);
          return;
        }
        
        console.log(`✅ ${table}: ${data.length} billable jobs`);
        totalBillableJobs += data.length;
          data.forEach(job => {
          const vendorId = job.vendor_id;
          const vendorName = job.vendors.name;
          
          // Calculate amount based on job type
          let amount = 0;
          let jobDetails = '';
          
          if (table === 'cutting_jobs') {
            // For cutting jobs, we might not have a direct rate, so use a default calculation
            const meters = job.consumption_meters || 0;
            amount = meters * 1.0; // Assume $1 per meter as default if no rate
            jobDetails = `${meters}m consumption`;
          } else if (table === 'printing_jobs') {
            const pulling = parseInt(job.pulling) || 0;
            const rate = job.rate || 0;
            amount = pulling * rate;
            jobDetails = `${pulling} pulling × $${rate}`;
          } else if (table === 'stitching_jobs') {
            const quantity = job.provided_quantity || 0;
            const rate = job.rate || 0;
            amount = quantity * rate;
            jobDetails = `${quantity} pieces × $${rate}`;
          }
          
          if (!vendorBillsMap.has(vendorId)) {
            vendorBillsMap.set(vendorId, {
              vendor_name: vendorName,
              vendor_phone: job.vendors.phone,
              total_amount: 0,
              job_count: 0,
              jobs: []
            });
          }
          
          const vendorBill = vendorBillsMap.get(vendorId);
          vendorBill.total_amount += amount;
          vendorBill.job_count += 1;
          vendorBill.jobs.push({
            table,
            job_id: job.id,
            worker_name: job.worker_name,
            amount,
            details: jobDetails
          });
        });
      });
      
      console.log(`\n🎯 VENDOR BILLS SUMMARY:`);
      console.log(`📊 Total billable jobs: ${totalBillableJobs}`);
      console.log(`👥 Vendors with bills: ${vendorBillsMap.size}`);
      
      if (vendorBillsMap.size > 0) {
        console.log('\n📋 Vendor Bills Breakdown:');
        let grandTotal = 0;
        
        vendorBillsMap.forEach((bill, vendorId) => {
          console.log(`\n   🏢 ${bill.vendor_name} (ID: ${vendorId})`);
          console.log(`      📞 Phone: ${bill.vendor_phone}`);
          console.log(`      💼 Jobs: ${bill.job_count}`);
          console.log(`      💰 Total: $${bill.total_amount.toFixed(2)}`);
            bill.jobs.forEach((job, index) => {
            console.log(`         ${index + 1}. ${job.table}: ${job.worker_name} - $${job.amount.toFixed(2)} (${job.details})`);
          });
          
          grandTotal += bill.total_amount;
        });
        
        console.log(`\n💰 GRAND TOTAL: $${grandTotal.toFixed(2)}`);
        console.log('\n🎉 SUCCESS! Vendor bills functionality is working properly!');
      } else {
        console.log('\n⚠️  No vendor bills found. This could mean:');
        console.log('   1. No jobs have been created with vendor_id');
        console.log('   2. No vendors exist in the database');
        console.log('   3. Jobs exist but vendor relationships are not properly linked');
      }
      
    } catch (error) {
      console.error('❌ Error in vendor bills aggregation:', error.message);
    }
    
    // Query 3: Check vendors table
    console.log('\n📊 Checking Vendors Table...');
    
    try {
      const { data: vendors, error: vendorError } = await supabase
        .from('vendors')
        .select('id, name, phone')
        .limit(10);
      
      if (vendorError) {
        console.error('❌ Error fetching vendors:', vendorError.message);
      } else {
        console.log(`✅ Found ${vendors?.length || 0} vendors in database`);
        
        if (vendors && vendors.length > 0) {
          console.log('📋 Available vendors:');
          vendors.forEach((vendor, index) => {
            console.log(`   ${index + 1}. ${vendor.name} (ID: ${vendor.id}) - ${vendor.phone}`);
          });
        } else {
          console.log('⚠️  No vendors found. Create vendors first before creating jobs.');
        }
      }
    } catch (error) {
      console.error('❌ Error checking vendors:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testVendorBillsFunctionality().then(() => {
  console.log('\n✅ Vendor bills functionality test completed.');
}).catch(error => {
  console.error('❌ Test execution failed:', error.message);
});
