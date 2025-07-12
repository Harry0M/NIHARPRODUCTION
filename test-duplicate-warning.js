// Test script to verify duplicate job card warning functionality
// Run this in browser console on the New Job Card page

async function testDuplicateJobCardWarning() {
  console.log('🧪 Testing Duplicate Job Card Warning System...');
  
  try {
    // Check if we're on the correct page
    if (!window.location.pathname.includes('/production/job-cards/new')) {
      console.error('❌ Please navigate to /production/job-cards/new first');
      return;
    }
    
    console.log('✅ On correct page: New Job Card');
    
    // Test 1: Check if order selection triggers duplicate checking
    console.log('\n📋 Test 1: Order Selection and Duplicate Detection');
    
    const orderSelect = document.querySelector('[data-testid="order-select"]') || 
                       document.querySelector('select') ||
                       document.querySelector('[role="combobox"]');
    
    if (!orderSelect) {
      console.log('⚠️ Order select element not found. Check if orders are loaded.');
      return;
    }
    
    console.log('✅ Order selection element found');
    
    // Test 2: Check for warning components
    console.log('\n⚠️ Test 2: Warning Components');
    
    // Look for warning alert
    const warningAlert = document.querySelector('[class*="orange"]') ||
                        document.querySelector('[class*="warning"]') ||
                        document.querySelector('[data-testid="duplicate-warning"]');
    
    if (warningAlert) {
      console.log('✅ Warning alert component found');
    } else {
      console.log('ℹ️ Warning alert not visible (no duplicates selected)');
    }
    
    // Test 3: Check form submission logic
    console.log('\n📝 Test 3: Form Elements');
    
    const jobNameInput = document.querySelector('input[placeholder*="job name"]') ||
                        document.querySelector('#job_name');
    
    const submitButton = document.querySelector('button[type="submit"]') ||
                        document.querySelector('button:contains("Create Job Card")');
    
    if (jobNameInput) {
      console.log('✅ Job name input found');
    }
    
    if (submitButton) {
      console.log('✅ Submit button found');
    }
    
    // Test 4: Check if supabase client is available
    console.log('\n🔗 Test 4: Database Connection');
    
    if (window.supabase) {
      console.log('✅ Supabase client available');
      
      // Test duplicate checking query
      try {
        const { data: orders } = await window.supabase
          .from('orders')
          .select('id, order_number')
          .limit(1);
          
        if (orders && orders.length > 0) {
          console.log('✅ Can query orders table');
          
          const testOrderId = orders[0].id;
          const { data: jobCards } = await window.supabase
            .from('job_cards')
            .select('id, job_name, job_number, status, created_at')
            .eq('order_id', testOrderId);
            
          console.log(`✅ Can query job_cards table. Found ${jobCards?.length || 0} job cards for order ${orders[0].order_number}`);
          
          if (jobCards && jobCards.length > 0) {
            console.log('✅ Duplicate detection scenario available for testing');
            console.log('📋 Existing job cards:', jobCards);
          } else {
            console.log('ℹ️ No existing job cards found for test order (normal scenario)');
          }
          
        } else {
          console.log('⚠️ No orders found in database');
        }
        
      } catch (error) {
        console.error('❌ Database query error:', error);
      }
      
    } else {
      console.log('❌ Supabase client not available');
    }
    
    console.log('\n🎉 Test Complete!');
    console.log('\n📝 Manual Testing Instructions:');
    console.log('1. Select an order that already has job cards');
    console.log('2. Look for orange warning alert below order selection');
    console.log('3. Fill in job name and click "Create Job Card"');
    console.log('4. Confirm that confirmation dialog appears');
    console.log('5. Test "Cancel", "View Existing", and "Create Anyway" options');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDuplicateJobCardWarning();
