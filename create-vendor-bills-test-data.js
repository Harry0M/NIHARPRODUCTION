// Test Data Creation Script for Vendor Bills
// Run this script in your browser console at your application URL to create test data

console.log('🚀 VENDOR BILLS TEST DATA CREATION SCRIPT');
console.log('==========================================');

async function createVendorBillsTestData() {
  console.log('\n📋 CREATING TEST DATA FOR VENDOR BILLS...');
  
  if (typeof supabase === 'undefined') {
    console.error('❌ Supabase client not found. Make sure you are on the application page.');
    return;
  }

  try {
    // Step 1: Create test vendors
    console.log('\n🏢 STEP 1: Creating test vendors...');
    
    const testVendors = [
      {
        name: 'ABC Cutting Services',
        contact_person: 'John Smith',
        phone: '9876543210',
        email: 'john@abccutting.com',
        service_type: 'cutting',
        status: 'active'
      },
      {
        name: 'XYZ Printing House',
        contact_person: 'Jane Doe',
        phone: '9876543211',
        email: 'jane@xyzprinting.com',
        service_type: 'printing',
        status: 'active'
      },
      {
        name: 'PQR Stitching Works',
        contact_person: 'Bob Wilson',
        phone: '9876543212',
        email: 'bob@pqrstitching.com',
        service_type: 'stitching',
        status: 'active'
      }
    ];

    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .upsert(testVendors)
      .select();

    if (vendorError) {
      console.error('❌ Error creating vendors:', vendorError);
      return;
    }
    
    console.log(`✅ Created ${vendors.length} vendors:`, vendors.map(v => v.name));

    // Step 2: Create test order
    console.log('\n📦 STEP 2: Creating test order...');
    
    const testOrder = {
      order_number: `ORD-TEST-${Date.now()}`,
      company_name: 'Test Company Ltd',
      product_name: 'Test Bags',
      quantity: 1000,
      bag_length: 30,
      bag_width: 20,
      rate: 5.50,
      status: 'in_production'
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(testOrder)
      .select()
      .single();

    if (orderError) {
      console.error('❌ Error creating order:', orderError);
      return;
    }

    console.log('✅ Created test order:', order.order_number);

    // Step 3: Create job cards with vendor assignments
    console.log('\n🎯 STEP 3: Creating job cards with vendor assignments...');
    
    const jobCards = [
      {
        order_id: order.id,
        job_name: `Cutting Job for ${order.order_number}`,
        job_number: `JOB-CUT-${Date.now()}`,
        vendor_id: vendors[0].id, // ABC Cutting Services
        status: 'completed'
      },
      {
        order_id: order.id,
        job_name: `Printing Job for ${order.order_number}`,
        job_number: `JOB-PRT-${Date.now()}`,
        vendor_id: vendors[1].id, // XYZ Printing House
        status: 'completed'
      },
      {
        order_id: order.id,
        job_name: `Stitching Job for ${order.order_number}`,
        job_number: `JOB-STI-${Date.now()}`,
        vendor_id: vendors[2].id, // PQR Stitching Works
        status: 'completed'
      }
    ];

    const { data: createdJobCards, error: jobCardError } = await supabase
      .from('job_cards')
      .insert(jobCards)
      .select();

    if (jobCardError) {
      console.error('❌ Error creating job cards:', jobCardError);
      return;
    }

    console.log(`✅ Created ${createdJobCards.length} job cards with vendor assignments`);

    // Step 4: Create specific job entries
    console.log('\n⚡ STEP 4: Creating specific job entries...');
    
    // Create cutting job
    const cuttingJob = {
      job_card_id: createdJobCards[0].id,
      worker_name: vendors[0].name,
      is_internal: false, // External vendor
      status: 'completed',
      received_quantity: 1000,
      provided_quantity: 1000
    };

    const { data: cutting, error: cuttingError } = await supabase
      .from('cutting_jobs')
      .insert(cuttingJob)
      .select()
      .single();

    if (cuttingError) {
      console.error('❌ Error creating cutting job:', cuttingError);
    } else {
      console.log('✅ Created cutting job with received_quantity:', cutting.received_quantity);
    }

    // Create printing job
    const printingJob = {
      job_card_id: createdJobCards[1].id,
      worker_name: vendors[1].name,
      is_internal: false, // External vendor
      status: 'completed',
      received_quantity: 950,
      provided_quantity: 1000,
      rate: 0.50 // ₹0.50 per piece
    };

    const { data: printing, error: printingError } = await supabase
      .from('printing_jobs')
      .insert(printingJob)
      .select()
      .single();

    if (printingError) {
      console.error('❌ Error creating printing job:', printingError);
    } else {
      console.log('✅ Created printing job with rate:', printing.rate, 'and received_quantity:', printing.received_quantity);
    }

    // Create stitching job
    const stitchingJob = {
      job_card_id: createdJobCards[2].id,
      worker_name: vendors[2].name,
      is_internal: false, // External vendor
      status: 'completed',
      received_quantity: 900,
      provided_quantity: 950,
      rate: 1.20 // ₹1.20 per piece
    };

    const { data: stitching, error: stitchingError } = await supabase
      .from('stitching_jobs')
      .insert(stitchingJob)
      .select()
      .single();

    if (stitchingError) {
      console.error('❌ Error creating stitching job:', stitchingError);
    } else {
      console.log('✅ Created stitching job with rate:', stitching.rate, 'and received_quantity:', stitching.received_quantity);
    }

    // Step 5: Verify the data
    console.log('\n🔍 STEP 5: Verifying test data...');
    
    // Test the same query that VendorBillsList uses
    const [cuttingTest, printingTest, stitchingTest] = await Promise.all([
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

    console.log('\n📊 VERIFICATION RESULTS:');
    console.log(`- Cutting jobs available for billing: ${cuttingTest.data?.length || 0}`);
    console.log(`- Printing jobs available for billing: ${printingTest.data?.length || 0}`);
    console.log(`- Stitching jobs available for billing: ${stitchingTest.data?.length || 0}`);

    if (cuttingTest.data?.[0]) {
      console.log('\n🔶 Sample cutting job data:');
      console.log('- ID:', cuttingTest.data[0].id);
      console.log('- Worker:', cuttingTest.data[0].worker_name);
      console.log('- Received Quantity:', cuttingTest.data[0].received_quantity);
      console.log('- Job Card:', cuttingTest.data[0].job_cards?.job_name);
      console.log('- Order:', cuttingTest.data[0].job_cards?.orders?.order_number);
      console.log('- Company:', cuttingTest.data[0].job_cards?.orders?.company_name);
    }

    if (printingTest.data?.[0]) {
      console.log('\n🔷 Sample printing job data:');
      console.log('- ID:', printingTest.data[0].id);
      console.log('- Worker:', printingTest.data[0].worker_name);
      console.log('- Rate:', printingTest.data[0].rate);
      console.log('- Received Quantity:', printingTest.data[0].received_quantity);
      console.log('- Job Card:', printingTest.data[0].job_cards?.job_name);
      console.log('- Order:', printingTest.data[0].job_cards?.orders?.order_number);
      console.log('- Company:', printingTest.data[0].job_cards?.orders?.company_name);
    }

    if (stitchingTest.data?.[0]) {
      console.log('\n🔸 Sample stitching job data:');
      console.log('- ID:', stitchingTest.data[0].id);
      console.log('- Worker:', stitchingTest.data[0].worker_name);
      console.log('- Rate:', stitchingTest.data[0].rate);
      console.log('- Received Quantity:', stitchingTest.data[0].received_quantity);
      console.log('- Job Card:', stitchingTest.data[0].job_cards?.job_name);
      console.log('- Order:', stitchingTest.data[0].job_cards?.orders?.order_number);
      console.log('- Company:', stitchingTest.data[0].job_cards?.orders?.company_name);
    }

    console.log('\n🎉 SUCCESS! Test data created successfully!');
    console.log('💡 Now navigate to the Vendor Bills page to see the available jobs for billing.');
    console.log('📋 You should see jobs that can be converted to vendor bills.');

    return {
      vendors: vendors,
      order: order,
      jobCards: createdJobCards,
      cuttingJob: cutting,
      printingJob: printing,
      stitchingJob: stitching
    };

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  }
}

// Auto-run the function
createVendorBillsTestData().catch(console.error);

// Make it available globally for manual runs
window.createVendorBillsTestData = createVendorBillsTestData;

console.log('\n🛠️ MANUAL FUNCTIONS AVAILABLE:');
console.log('- createVendorBillsTestData() - Run this to create all test data');
console.log('\n📝 NEXT STEPS:');
console.log('1. Wait for the script to complete');
console.log('2. Navigate to Vendor Bills page');
console.log('3. You should see jobs available for billing');
console.log('4. Click "Create Bill" on any job to create a vendor bill');
