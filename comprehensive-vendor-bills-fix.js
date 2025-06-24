// Comprehensive Vendor Bills Debug and Fix Script
// Run this in browser console at your application URL
// This script will diagnose the issue and optionally create test data

console.log('🔧 COMPREHENSIVE VENDOR BILLS DEBUG & FIX SCRIPT');
console.log('=================================================');

window.vendorBillsFix = {
  
  // Step 1: Complete system diagnosis
  async diagnose() {
    console.log('\n🔍 STEP 1: COMPLETE SYSTEM DIAGNOSIS');
    console.log('====================================');
    
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase client not found. Make sure you are on the application page.');
      return false;
    }

    try {
      // Test connection
      const { data: testData, error: testError } = await supabase
        .from('vendors')
        .select('id, name')
        .limit(1);
      
      if (testError) {
        console.error('❌ Connection failed:', testError);
        return false;
      }
      
      console.log('✅ Supabase connection successful');

      // Check vendors
      const { data: vendors } = await supabase.from('vendors').select('*');
      console.log(`📊 Total vendors: ${vendors?.length || 0}`);
      
      // Check orders
      const { data: orders } = await supabase.from('orders').select('*');
      console.log(`📦 Total orders: ${orders?.length || 0}`);
      
      // Check job cards
      const { data: jobCards } = await supabase.from('job_cards').select('*');
      console.log(`🎯 Total job cards: ${jobCards?.length || 0}`);
      
      // Check job cards with vendors
      const { data: jobCardsWithVendors } = await supabase
        .from('job_cards')
        .select('*')
        .not('vendor_id', 'is', null);
      console.log(`🔗 Job cards with vendor_id: ${jobCardsWithVendors?.length || 0}`);
      
      // Check all job types
      const [cuttingJobs, printingJobs, stitchingJobs] = await Promise.all([
        supabase.from('cutting_jobs').select('*'),
        supabase.from('printing_jobs').select('*'),
        supabase.from('stitching_jobs').select('*')
      ]);
      
      console.log(`⚡ Total cutting jobs: ${cuttingJobs.data?.length || 0}`);
      console.log(`🎨 Total printing jobs: ${printingJobs.data?.length || 0}`);
      console.log(`🧵 Total stitching jobs: ${stitchingJobs.data?.length || 0}`);
      
      // Check external vendor jobs
      const [externalCutting, externalPrinting, externalStitching] = await Promise.all([
        supabase.from('cutting_jobs').select('*').eq('is_internal', false),
        supabase.from('printing_jobs').select('*').eq('is_internal', false),
        supabase.from('stitching_jobs').select('*').eq('is_internal', false)
      ]);
      
      console.log(`🏢 External cutting jobs: ${externalCutting.data?.length || 0}`);
      console.log(`🏢 External printing jobs: ${externalPrinting.data?.length || 0}`);
      console.log(`🏢 External stitching jobs: ${externalStitching.data?.length || 0}`);
      
      // Check completed external vendor jobs
      const [completedCutting, completedPrinting, completedStitching] = await Promise.all([
        supabase.from('cutting_jobs').select('*').eq('is_internal', false).eq('status', 'completed'),
        supabase.from('printing_jobs').select('*').eq('is_internal', false).eq('status', 'completed'),
        supabase.from('stitching_jobs').select('*').eq('is_internal', false).eq('status', 'completed')
      ]);
      
      console.log(`✅ Completed external cutting jobs: ${completedCutting.data?.length || 0}`);
      console.log(`✅ Completed external printing jobs: ${completedPrinting.data?.length || 0}`);
      console.log(`✅ Completed external stitching jobs: ${completedStitching.data?.length || 0}`);
      
      // Check billable jobs (with received_quantity and rate)
      const [billableCutting, billablePrinting, billableStitching] = await Promise.all([
        supabase.from('cutting_jobs')
          .select('*')
          .eq('is_internal', false)
          .eq('status', 'completed')
          .not('received_quantity', 'is', null),
        
        supabase.from('printing_jobs')
          .select('*')
          .eq('is_internal', false)
          .eq('status', 'completed')
          .not('received_quantity', 'is', null)
          .not('rate', 'is', null),
        
        supabase.from('stitching_jobs')
          .select('*')
          .eq('is_internal', false)
          .eq('status', 'completed')
          .not('received_quantity', 'is', null)
          .not('rate', 'is', null)
      ]);
      
      console.log(`💰 Billable cutting jobs: ${billableCutting.data?.length || 0}`);
      console.log(`💰 Billable printing jobs: ${billablePrinting.data?.length || 0}`);
      console.log(`💰 Billable stitching jobs: ${billableStitching.data?.length || 0}`);

      // Check existing vendor bills
      const { data: existingBills } = await supabase.from('vendor_bills').select('*');
      console.log(`📄 Existing vendor bills: ${existingBills?.length || 0}`);

      const diagnosis = {
        hasConnection: true,
        vendors: vendors?.length || 0,
        orders: orders?.length || 0,
        jobCards: jobCards?.length || 0,
        jobCardsWithVendors: jobCardsWithVendors?.length || 0,
        totalJobs: (cuttingJobs.data?.length || 0) + (printingJobs.data?.length || 0) + (stitchingJobs.data?.length || 0),
        billableJobs: (billableCutting.data?.length || 0) + (billablePrinting.data?.length || 0) + (billableStitching.data?.length || 0),
        existingBills: existingBills?.length || 0
      };

      console.log('\n📋 DIAGNOSIS SUMMARY:');
      console.log('===================');
      
      if (diagnosis.billableJobs === 0) {
        console.log('❌ ISSUE FOUND: No billable jobs available');
        console.log('🔧 SOLUTION NEEDED: Create test data with proper vendor job setup');
      } else {
        console.log('✅ System has billable jobs - investigating relationships...');
      }

      return diagnosis;

    } catch (error) {
      console.error('❌ Diagnosis failed:', error);
      return false;
    }
  },

  // Step 2: Create comprehensive test data
  async createTestData() {
    console.log('\n🏗️ STEP 2: CREATING COMPREHENSIVE TEST DATA');
    console.log('===========================================');

    try {
      // Create vendors
      const vendors = [
        {
          name: 'Expert Cutting Services',
          contact_person: 'Rajesh Kumar',
          phone: '9876543210',
          email: 'rajesh@expertcutting.com',
          service_type: 'cutting',
          status: 'active'
        },
        {
          name: 'Premium Printing House',
          contact_person: 'Priya Sharma',
          phone: '9876543211',
          email: 'priya@premiumprinting.com',
          service_type: 'printing',
          status: 'active'
        },
        {
          name: 'Quality Stitching Works',
          contact_person: 'Amit Patel',
          phone: '9876543212',
          email: 'amit@qualitystitching.com',
          service_type: 'stitching',
          status: 'active'
        }
      ];

      console.log('🏢 Creating vendors...');
      const { data: createdVendors, error: vendorError } = await supabase
        .from('vendors')
        .upsert(vendors, { onConflict: 'name' })
        .select();

      if (vendorError) {
        console.error('❌ Vendor creation failed:', vendorError);
        return false;
      }

      console.log(`✅ Created/Updated ${createdVendors.length} vendors`);

      // Create test order
      const testOrder = {
        order_number: `ORD-VB-${Date.now()}`,
        company_name: 'ABC Manufacturing Ltd',
        product_name: 'Premium Shopping Bags',
        quantity: 2000,
        bag_length: 35,
        bag_width: 25,
        rate: 6.75,
        status: 'in_production',
        order_date: new Date().toISOString().split('T')[0]
      };

      console.log('📦 Creating test order...');
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(testOrder)
        .select()
        .single();

      if (orderError) {
        console.error('❌ Order creation failed:', orderError);
        return false;
      }

      console.log(`✅ Created order: ${order.order_number}`);

      // Create job cards with vendor assignments
      const jobCards = [
        {
          order_id: order.id,
          job_name: `Cutting Job - ${order.order_number}`,
          job_number: `CUT-${Date.now()}-001`,
          vendor_id: createdVendors[0].id,
          status: 'completed'
        },
        {
          order_id: order.id,
          job_name: `Printing Job - ${order.order_number}`,
          job_number: `PRT-${Date.now()}-001`,
          vendor_id: createdVendors[1].id,
          status: 'completed'
        },
        {
          order_id: order.id,
          job_name: `Stitching Job - ${order.order_number}`,
          job_number: `STI-${Date.now()}-001`,
          vendor_id: createdVendors[2].id,
          status: 'completed'
        }
      ];

      console.log('🎯 Creating job cards...');
      const { data: createdJobCards, error: jobCardError } = await supabase
        .from('job_cards')
        .insert(jobCards)
        .select();

      if (jobCardError) {
        console.error('❌ Job card creation failed:', jobCardError);
        return false;
      }

      console.log(`✅ Created ${createdJobCards.length} job cards`);

      // Create cutting job
      const cuttingJob = {
        job_card_id: createdJobCards[0].id,
        worker_name: createdVendors[0].name,
        is_internal: false,
        status: 'completed',
        received_quantity: 2000,
        provided_quantity: 2000
      };

      console.log('⚡ Creating cutting job...');
      const { data: cutting, error: cuttingError } = await supabase
        .from('cutting_jobs')
        .insert(cuttingJob)
        .select()
        .single();

      if (cuttingError) {
        console.error('❌ Cutting job creation failed:', cuttingError);
      } else {
        console.log('✅ Created cutting job');
      }

      // Create printing job
      const printingJob = {
        job_card_id: createdJobCards[1].id,
        worker_name: createdVendors[1].name,
        is_internal: false,
        status: 'completed',
        received_quantity: 1950,
        provided_quantity: 2000,
        rate: 0.75
      };

      console.log('🎨 Creating printing job...');
      const { data: printing, error: printingError } = await supabase
        .from('printing_jobs')
        .insert(printingJob)
        .select()
        .single();

      if (printingError) {
        console.error('❌ Printing job creation failed:', printingError);
      } else {
        console.log('✅ Created printing job');
      }

      // Create stitching job
      const stitchingJob = {
        job_card_id: createdJobCards[2].id,
        worker_name: createdVendors[2].name,
        is_internal: false,
        status: 'completed',
        received_quantity: 1900,
        provided_quantity: 1950,
        rate: 1.50
      };

      console.log('🧵 Creating stitching job...');
      const { data: stitching, error: stitchingError } = await supabase
        .from('stitching_jobs')
        .insert(stitchingJob)
        .select()
        .single();

      if (stitchingError) {
        console.error('❌ Stitching job creation failed:', stitchingError);
      } else {
        console.log('✅ Created stitching job');
      }

      console.log('\n🎉 TEST DATA CREATION COMPLETED!');
      return {
        vendors: createdVendors,
        order: order,
        jobCards: createdJobCards,
        cutting: cutting,
        printing: printing,
        stitching: stitching
      };

    } catch (error) {
      console.error('❌ Test data creation failed:', error);
      return false;
    }
  },

  // Step 3: Test the vendor bills query
  async testVendorBillsQuery() {
    console.log('\n🧪 STEP 3: TESTING VENDOR BILLS QUERY');
    console.log('====================================');

    try {
      // Test the exact same queries that VendorBillsList uses
      const [cuttingResults, printingResults, stitchingResults] = await Promise.all([
        supabase
          .from('cutting_jobs')
          .select(`
            id,
            worker_name,
            is_internal,
            received_quantity,
            status,
            created_at,
            job_cards (
              id,
              job_name,
              job_number,
              vendor_id,
              orders (
                id,
                order_number,
                company_name,
                product_name
              )
            )
          `)
          .eq('status', 'completed')
          .eq('is_internal', false)
          .not('received_quantity', 'is', null),

        supabase
          .from('printing_jobs')
          .select(`
            id,
            worker_name,
            is_internal,
            rate,
            received_quantity,
            status,
            created_at,
            job_cards (
              id,
              job_name,
              job_number,
              vendor_id,
              orders (
                id,
                order_number,
                company_name,
                product_name
              )
            )
          `)
          .eq('status', 'completed')
          .eq('is_internal', false)
          .not('received_quantity', 'is', null)
          .not('rate', 'is', null),

        supabase
          .from('stitching_jobs')
          .select(`
            id,
            worker_name,
            is_internal,
            rate,
            received_quantity,
            status,
            created_at,
            job_cards (
              id,
              job_name,
              job_number,
              vendor_id,
              orders (
                id,
                order_number,
                company_name,
                product_name
              )
            )
          `)
          .eq('status', 'completed')
          .eq('is_internal', false)
          .not('received_quantity', 'is', null)
          .not('rate', 'is', null)
      ]);

      console.log('📊 QUERY RESULTS:');
      console.log(`- Cutting jobs: ${cuttingResults.data?.length || 0}`);
      console.log(`- Printing jobs: ${printingResults.data?.length || 0}`);
      console.log(`- Stitching jobs: ${stitchingResults.data?.length || 0}`);

      if (cuttingResults.error) console.error('❌ Cutting query error:', cuttingResults.error);
      if (printingResults.error) console.error('❌ Printing query error:', printingResults.error);
      if (stitchingResults.error) console.error('❌ Stitching query error:', stitchingResults.error);

      // Show sample data
      if (cuttingResults.data?.[0]) {
        console.log('\n🔶 SAMPLE CUTTING JOB:');
        console.log(JSON.stringify(cuttingResults.data[0], null, 2));
      }

      if (printingResults.data?.[0]) {
        console.log('\n🔷 SAMPLE PRINTING JOB:');
        console.log(JSON.stringify(printingResults.data[0], null, 2));
      }

      if (stitchingResults.data?.[0]) {
        console.log('\n🔸 SAMPLE STITCHING JOB:');
        console.log(JSON.stringify(stitchingResults.data[0], null, 2));
      }

      return {
        cutting: cuttingResults.data || [],
        printing: printingResults.data || [],
        stitching: stitchingResults.data || []
      };

    } catch (error) {
      console.error('❌ Query test failed:', error);
      return false;
    }
  },

  // Complete fix process
  async fixVendorBills() {
    console.log('\n🔧 COMPLETE VENDOR BILLS FIX PROCESS');
    console.log('====================================');

    const diagnosis = await this.diagnose();
    if (!diagnosis) return false;

    if (diagnosis.billableJobs === 0) {
      console.log('\n🏗️ Creating test data to fix the issue...');
      const testData = await this.createTestData();
      if (!testData) return false;
    }

    console.log('\n🧪 Testing queries...');
    const queryResults = await this.testVendorBillsQuery();
    if (!queryResults) return false;

    const totalJobs = queryResults.cutting.length + queryResults.printing.length + queryResults.stitching.length;

    if (totalJobs > 0) {
      console.log('\n🎉 SUCCESS! Vendor bills should now work!');
      console.log(`✅ Found ${totalJobs} jobs available for billing`);
      console.log('📋 Navigate to the Vendor Bills page to see the available jobs');
      console.log('💡 You can now create vendor bills from these jobs');
      return true;
    } else {
      console.log('\n❌ Still no jobs found. Manual investigation needed.');
      return false;
    }
  }
};

// Auto-run the diagnosis
vendorBillsFix.diagnose();

console.log('\n🛠️ AVAILABLE FUNCTIONS:');
console.log('========================');
console.log('- vendorBillsFix.diagnose() - Diagnose the current state');
console.log('- vendorBillsFix.createTestData() - Create test data');
console.log('- vendorBillsFix.testVendorBillsQuery() - Test the vendor bills queries');
console.log('- vendorBillsFix.fixVendorBills() - Complete fix process');
console.log('\n💡 TO FIX THE ISSUE: Run vendorBillsFix.fixVendorBills()');
