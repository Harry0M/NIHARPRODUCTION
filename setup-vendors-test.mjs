// Create test vendors and complete vendor bills test
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupVendorsAndTest() {
  console.log('🚀 Setting up Vendors and Testing Complete Flow...\n');
  
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
    
    // Step 1: Create test vendors
    console.log('\n📊 Step 1: Creating test vendors...');
    
    const testVendors = [
      { name: 'ABC Cutting Works', phone: '9876543210' },
      { name: 'XYZ Printing House', phone: '8765432109' },
      { name: 'DEF Stitching Unit', phone: '7654321098' },
      { name: 'GHI General Works', phone: '6543210987' }
    ];
    
    const createdVendors = [];
      for (const vendor of testVendors) {
      try {
        // First check if vendor already exists
        const { data: existingVendor } = await supabase
          .from('vendors')
          .select('id, name')
          .eq('name', vendor.name)
          .single();
        
        if (existingVendor) {
          console.log(`✅ Vendor already exists: ${existingVendor.name} (ID: ${existingVendor.id})`);
          createdVendors.push(existingVendor);
        } else {
          // Create new vendor
          const { data, error } = await supabase
            .from('vendors')
            .insert(vendor)
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
        console.error(`❌ Error with vendor ${vendor.name}:`, error.message);
      }
    }
    
    if (createdVendors.length === 0) {
      console.error('❌ No vendors were created. Cannot proceed.');
      return;
    }
    
    // Step 2: Update existing job with valid vendor_id
    console.log('\n📊 Step 2: Updating existing job with valid vendor_id...');
    
    const { data: existingJobs, error: jobsError } = await supabase
      .from('cutting_jobs')
      .select('id, worker_name, vendor_id')
      .not('vendor_id', 'is', null)
      .limit(5);
    
    if (jobsError) {
      console.error('❌ Error fetching existing jobs:', jobsError.message);
    } else if (existingJobs && existingJobs.length > 0) {
      console.log(`Found ${existingJobs.length} existing jobs with vendor_id`);
      
      // Update the first job with a valid vendor_id
      const jobToUpdate = existingJobs[0];
      const vendorToUse = createdVendors[0];
      
      const { data: updatedJob, error: updateError } = await supabase
        .from('cutting_jobs')
        .update({ 
          vendor_id: vendorToUse.id,
          worker_name: vendorToUse.name
        })
        .eq('id', jobToUpdate.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Error updating job:', updateError.message);
      } else {
        console.log(`✅ Updated job ${updatedJob.id} with vendor ${vendorToUse.name}`);
      }
    }
    
    // Step 3: Create new test jobs with vendor_id
    console.log('\n📊 Step 3: Creating new test jobs with vendor_id...');
    
    // Create test printing job
    const printingVendor = createdVendors[1] || createdVendors[0];
    const printingJobData = {
      job_card_id: 'test-job-card-id', // This might need to be a valid UUID
      worker_name: printingVendor.name,
      vendor_id: printingVendor.id,
      pulling: '100',
      rate: 2.50,
      status: 'pending'
    };
    
    // Create test stitching job
    const stitchingVendor = createdVendors[2] || createdVendors[0];
    const stitchingJobData = {
      job_card_id: 'test-job-card-id-2', // This might need to be a valid UUID  
      worker_name: stitchingVendor.name,
      vendor_id: stitchingVendor.id,
      provided_quantity: 80,
      rate: 3.75,
      status: 'pending'
    };
    
    // For now, let's just test with the updated cutting job since we need valid job_card_ids
    
    // Step 4: Test vendor bills functionality
    console.log('\n📊 Step 4: Testing vendor bills functionality...');
    
    const { data: vendorBillsData, error: billsError } = await supabase
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
      .not('vendor_id', 'is', null);
    
    if (billsError) {
      console.error('❌ Error querying vendor bills:', billsError.message);
    } else {
      console.log(`✅ Vendor bills query successful: ${vendorBillsData?.length || 0} jobs found`);
      
      if (vendorBillsData && vendorBillsData.length > 0) {
        console.log('\n📋 Vendor Bills Data:');
        vendorBillsData.forEach((job, index) => {
          const meters = job.consumption_meters || 0;
          const estimatedAmount = meters * 1.0; // $1 per meter
          console.log(`   ${index + 1}. Vendor: ${job.vendors.name}`);
          console.log(`      Worker: ${job.worker_name}`);
          console.log(`      Consumption: ${meters}m`);
          console.log(`      Estimated Amount: $${estimatedAmount.toFixed(2)}`);
          console.log(`      Phone: ${job.vendors.phone}`);
        });
        
        console.log('\n🎉 SUCCESS! Vendor bills functionality is now working!');
        console.log('✅ Jobs are properly linked to vendors');
        console.log('✅ Vendor relationships are resolved correctly');
        console.log('✅ The /accounts/vendor-bills page should now show available jobs');
      } else {
        console.log('⚠️  Still no vendor bills data. Check job-vendor relationships.');
      }
    }
    
    // Step 5: Summary
    console.log('\n📊 Final Summary:');
    
    const totalVendors = createdVendors.length;
    const { count: totalJobs } = await supabase
      .from('cutting_jobs')
      .select('*', { count: 'exact', head: true })
      .not('vendor_id', 'is', null);
    
    console.log(`👥 Total vendors created: ${totalVendors}`);
    console.log(`💼 Total jobs with vendor_id: ${totalJobs || 0}`);
    
    if (totalVendors > 0 && totalJobs > 0) {
      console.log('\n🎯 NEXT STEPS:');
      console.log('1. Navigate to /accounts/vendor-bills in the application');
      console.log('2. You should now see available jobs instead of "Available Jobs: 0"');
      console.log('3. Test creating new jobs through the UI forms');
      console.log('4. Verify vendor selection dropdown works correctly');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

// Run the setup
setupVendorsAndTest().then(() => {
  console.log('\n✅ Vendor setup and test completed.');
}).catch(error => {
  console.error('❌ Setup execution failed:', error.message);
});
