// Manual debug script for vendor bills - works without existing Supabase client
// Paste this into browser console on the vendor bills page

console.log('🔍 Manual Vendor Bills Debug Starting...');

async function debugVendorBills() {
  try {
    // Create Supabase client manually
    console.log('Creating Supabase client...');
    
    // Use a direct approach - get the Supabase client from the app's modules
    const supabaseUrl = 'https://aqqlhvcltqvuxqwowxly.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxcWxodmNsdHF2dXhxd293eGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3MzYwNjcsImV4cCI6MjA1MTMxMjA2N30.rXF9XZI4TmpGWY5JJB4FBNMr3WmqiCX7pZ0Yw9S4Itw';
    
    // Use fetch to make direct REST API calls to Supabase
    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    console.log('✅ API headers prepared');

    // Test 1: Basic counts using REST API
    console.log('\n📊 === BASIC COUNTS ===');
    
    const cuttingCount = await fetch(`${supabaseUrl}/rest/v1/cutting_jobs?select=count`, {
      method: 'HEAD',
      headers: headers
    });
    
    const printingCount = await fetch(`${supabaseUrl}/rest/v1/printing_jobs?select=count`, {
      method: 'HEAD', 
      headers: headers
    });
    
    const stitchingCount = await fetch(`${supabaseUrl}/rest/v1/stitching_jobs?select=count`, {
      method: 'HEAD',
      headers: headers
    });

    console.log('Cutting jobs count:', cuttingCount.headers.get('Content-Range'));
    console.log('Printing jobs count:', printingCount.headers.get('Content-Range'));
    console.log('Stitching jobs count:', stitchingCount.headers.get('Content-Range'));

    // Test 2: Sample data
    console.log('\n📊 === SAMPLE DATA ===');
    
    const sampleCuttingResponse = await fetch(`${supabaseUrl}/rest/v1/cutting_jobs?select=id,worker_name,status,is_internal,received_quantity,job_card_id&limit=3`, {
      headers: headers
    });
    const sampleCutting = await sampleCuttingResponse.json();
    
    console.log('Sample cutting jobs:', sampleCutting);

    if (sampleCutting && sampleCutting.length > 0) {
      console.log('\n🔍 Analyzing sample cutting job...');
      const sampleJob = sampleCutting[0];
      console.log('Sample job details:');
      console.log('- ID:', sampleJob.id);
      console.log('- Worker:', sampleJob.worker_name);
      console.log('- Status:', sampleJob.status);
      console.log('- Is Internal:', sampleJob.is_internal);
      console.log('- Received Quantity:', sampleJob.received_quantity);
      console.log('- Job Card ID:', sampleJob.job_card_id);

      // Check if this job meets our criteria
      console.log('\n🔍 Checking if sample job meets vendor bill criteria:');
      console.log('- Status === "completed":', sampleJob.status === 'completed');
      console.log('- is_internal === false:', sampleJob.is_internal === false);
      console.log('- received_quantity is not null:', sampleJob.received_quantity !== null);
      
      if (sampleJob.job_card_id) {
        console.log('\n🔍 Testing job_card relationship...');
        const jobCardResponse = await fetch(`${supabaseUrl}/rest/v1/job_cards?select=id,job_name,job_number,vendor_id,orders(id,order_number,company_name,product_name)&id=eq.${sampleJob.job_card_id}`, {
          headers: headers
        });
        const jobCardData = await jobCardResponse.json();
        
        console.log('Related job_card:', jobCardData);
        
        if (jobCardData && jobCardData.length > 0) {
          const jobCard = jobCardData[0];
          console.log('Job card analysis:');
          console.log('- Has job_card:', true);
          console.log('- Job card ID:', jobCard.id);
          console.log('- Job name:', jobCard.job_name);
          console.log('- Job number:', jobCard.job_number);
          console.log('- Vendor ID:', jobCard.vendor_id);
          console.log('- Has orders:', jobCard.orders ? true : false);
          console.log('- Orders data:', jobCard.orders);
        }
      }
    }

    // Test 3: Check what statuses exist
    console.log('\n📊 === ACTUAL STATUS VALUES ===');
    const statusResponse = await fetch(`${supabaseUrl}/rest/v1/cutting_jobs?select=status&status=not.is.null`, {
      headers: headers
    });
    const statusData = await statusResponse.json();
    
    const uniqueStatuses = [...new Set(statusData.map(job => job.status))];
    console.log('Unique cutting job statuses:', uniqueStatuses);

    // Test 4: Check is_internal values  
    console.log('\n📊 === ACTUAL IS_INTERNAL VALUES ===');
    const internalResponse = await fetch(`${supabaseUrl}/rest/v1/cutting_jobs?select=is_internal&is_internal=not.is.null`, {
      headers: headers
    });
    const internalData = await internalResponse.json();
    
    const uniqueInternal = [...new Set(internalData.map(job => job.is_internal))];
    console.log('Unique is_internal values:', uniqueInternal);

    // Test 5: Check for completed external jobs with received_quantity
    console.log('\n📊 === COMPLETED EXTERNAL JOBS WITH QUANTITY ===');
    const filteredResponse = await fetch(`${supabaseUrl}/rest/v1/cutting_jobs?select=*&status=eq.completed&is_internal=eq.false&received_quantity=not.is.null`, {
      headers: headers
    });
    const filteredJobs = await filteredResponse.json();
    
    console.log('Completed external cutting jobs with quantity:', filteredJobs.length);
    if (filteredJobs.length > 0) {
      console.log('Sample filtered job:', filteredJobs[0]);
    }

    // Test 6: Check job_cards table
    console.log('\n📊 === JOB CARDS CHECK ===');
    const jobCardsResponse = await fetch(`${supabaseUrl}/rest/v1/job_cards?select=id,job_name,job_number,vendor_id&limit=5`, {
      headers: headers
    });
    const jobCardsData = await jobCardsResponse.json();
    
    console.log('Sample job_cards:', jobCardsData);

    // Test 7: Test the actual query structure that's failing
    console.log('\n📊 === TESTING APP QUERY STRUCTURE ===');
    
    // First try without the inner join
    const basicRelationshipResponse = await fetch(`${supabaseUrl}/rest/v1/cutting_jobs?select=id,worker_name,is_internal,received_quantity,status,created_at,job_cards(id,job_name,job_number,vendor_id,orders(id,order_number,company_name,product_name))&status=eq.completed&is_internal=eq.false&received_quantity=not.is.null&limit=5`, {
      headers: headers
    });
    const basicRelationshipData = await basicRelationshipResponse.json();
    
    console.log('Basic relationship query result:');
    console.log('- Count:', basicRelationshipData.length || 0);
    console.log('- Data:', basicRelationshipData);
    console.log('- Error (if any):', basicRelationshipResponse.status !== 200 ? await basicRelationshipResponse.text() : 'None');

    if (basicRelationshipData && basicRelationshipData.length > 0) {
      console.log('\n🔍 Analyzing relationship data:');
      basicRelationshipData.forEach((job, index) => {
        console.log(`Job ${index + 1}:`);
        console.log('- ID:', job.id);
        console.log('- Worker:', job.worker_name);
        console.log('- Has job_cards:', job.job_cards ? 'Yes' : 'No');
        if (job.job_cards) {
          console.log('- Job card data:', job.job_cards);
        }
      });
    }

    console.log('\n✅ Manual debug complete!');

  } catch (error) {
    console.error('❌ Error in manual debug:', error);
  }
}

debugVendorBills();
