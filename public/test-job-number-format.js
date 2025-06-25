/**
 * Test script to verify the updated job number format
 * This tests that new job cards get job numbers in format JOB-[ORDER_NUMBER]
 */

console.log('🧪 TESTING UPDATED JOB NUMBER FORMAT');
console.log('Expected format: JOB-[ORDER_NUMBER] (e.g., JOB-9016)');
console.log('='.repeat(60));

// This script should be run in the browser console on the application page
const testJobNumberFormat = async () => {
  try {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      console.log('❌ This script should be run in the browser console');
      return;
    }

    // Access Supabase client
    const supabase = window.supabase;
    if (!supabase) {
      console.log('❌ Supabase client not found. Run this on the application page.');
      return;
    }

    console.log('✅ Supabase client found. Testing job number format...\n');

    // Step 1: Check recent orders to see available order numbers
    console.log('📋 Step 1: Checking recent orders...');
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, company_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (orderError) {
      console.error('❌ Error fetching orders:', orderError);
      return;
    }

    console.log(`✅ Found ${orders?.length || 0} recent orders:`);
    orders?.forEach((order, i) => {
      console.log(`${i + 1}. Order ${order.order_number} - ${order.company_name}`);
    });

    // Step 2: Check recent job cards to see current job number format
    console.log('\n📋 Step 2: Checking recent job cards...');
    const { data: jobCards, error: jobError } = await supabase
      .from('job_cards')
      .select(`
        id,
        job_name,
        job_number,
        order_id,
        created_at,
        orders (
          order_number,
          company_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (jobError) {
      console.error('❌ Error fetching job cards:', jobError);
      return;
    }

    console.log(`✅ Found ${jobCards?.length || 0} recent job cards:`);
    
    if (jobCards && jobCards.length > 0) {
      console.log('\n📊 Job Card Analysis:');
      
      let newFormatCount = 0;
      let oldFormatCount = 0;
      
      jobCards.forEach((job, i) => {
        const orderNumber = job.orders?.order_number;
        const expectedJobNumber = `JOB-${orderNumber}`;
        const isNewFormat = job.job_number === expectedJobNumber;
        
        console.log(`\n${i + 1}. ${job.job_name}`);
        console.log(`   Job Number: ${job.job_number}`);
        console.log(`   Order Number: ${orderNumber}`);
        console.log(`   Expected: ${expectedJobNumber}`);
        console.log(`   Format: ${isNewFormat ? '✅ NEW' : '❌ OLD'}`);
        console.log(`   Created: ${new Date(job.created_at).toLocaleDateString()}`);
        
        if (isNewFormat) {
          newFormatCount++;
        } else {
          oldFormatCount++;
        }
      });
      
      console.log(`\n📈 Format Summary:`);
      console.log(`✅ New format (JOB-[ORDER_NUMBER]): ${newFormatCount} job cards`);
      console.log(`📅 Old format (JOB-YYYY-NNN): ${oldFormatCount} job cards`);
      
      if (newFormatCount > 0) {
        console.log('\n🎉 SUCCESS: New job number format is working!');
      } else {
        console.log('\n📝 INFO: No job cards with new format found yet.');
        console.log('💡 Create a new job card to test the updated format.');
      }
    }

    // Step 3: Check the database function
    console.log('\n📋 Step 3: Verifying database function...');
    console.log('💡 The generate_job_number() function should now use order numbers.');
    console.log('💡 Next job cards created will use format: JOB-[ORDER_NUMBER]');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testJobNumberFormat();
