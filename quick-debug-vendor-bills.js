// Quick debug script - paste this in browser console on vendor bills page
console.log('🔍 Quick Vendor Bills Debug Starting...');

// Get the supabase client from the window (it should be available)
const getSupabase = () => {
  // Try multiple ways to get supabase
  if (window.supabase) return window.supabase;
  if (window.__SUPABASE_CLIENT__) return window.__SUPABASE_CLIENT__;
  
  // Try to get from React DevTools or global state
  const reactFiber = document.querySelector('#root')._reactInternalInstance || 
                    document.querySelector('#root')._reactInternals;
  
  console.log('❌ Could not find Supabase client automatically');
  console.log('ℹ️ Please make sure you are on the vendor bills page and try again');
  return null;
};

async function quickDebug() {
  try {
    // Import supabase client directly
    const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js');
    
    // Use your actual Supabase URL and anon key
    const supabaseUrl = 'https://aqqlhvcltqvuxqwowxly.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxcWxodmNsdHF2dXhxd293eGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3MzYwNjcsImV4cCI6MjA1MTMxMjA2N30.rXF9XZI4TmpGWY5JJB4FBNMr3WmqiCX7pZ0Yw9S4Itw';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created');

    // Test 1: Basic counts
    console.log('\n📊 === BASIC COUNTS ===');
    const [cuttingCount, printingCount, stitchingCount] = await Promise.all([
      supabase.from('cutting_jobs').select('*', { count: 'exact', head: true }),
      supabase.from('printing_jobs').select('*', { count: 'exact', head: true }),
      supabase.from('stitching_jobs').select('*', { count: 'exact', head: true })
    ]);

    console.log('Total cutting jobs:', cuttingCount.count);
    console.log('Total printing jobs:', printingCount.count);
    console.log('Total stitching jobs:', stitchingCount.count);

    // Test 2: Sample data
    console.log('\n📊 === SAMPLE DATA ===');
    const [sampleCutting, samplePrinting, sampleStitching] = await Promise.all([
      supabase.from('cutting_jobs').select('id, worker_name, status, is_internal, received_quantity').limit(3),
      supabase.from('printing_jobs').select('id, worker_name, status, is_internal, received_quantity, rate').limit(3),
      supabase.from('stitching_jobs').select('id, worker_name, status, is_internal, received_quantity, rate').limit(3)
    ]);

    console.log('Sample cutting jobs:', sampleCutting.data);
    console.log('Sample printing jobs:', samplePrinting.data);
    console.log('Sample stitching jobs:', sampleStitching.data);

    // Test 3: Completed jobs
    console.log('\n📊 === COMPLETED JOBS ===');
    const [completedCutting, completedPrinting, completedStitching] = await Promise.all([
      supabase.from('cutting_jobs').select('*').eq('status', 'completed'),
      supabase.from('printing_jobs').select('*').eq('status', 'completed'),
      supabase.from('stitching_jobs').select('*').eq('status', 'completed')
    ]);

    console.log('Completed cutting jobs:', completedCutting.data?.length || 0);
    console.log('Completed printing jobs:', completedPrinting.data?.length || 0);
    console.log('Completed stitching jobs:', completedStitching.data?.length || 0);

    // Test 4: External jobs
    console.log('\n📊 === EXTERNAL JOBS ===');
    const [externalCutting, externalPrinting, externalStitching] = await Promise.all([
      supabase.from('cutting_jobs').select('*').eq('is_internal', false),
      supabase.from('printing_jobs').select('*').eq('is_internal', false),
      supabase.from('stitching_jobs').select('*').eq('is_internal', false)
    ]);

    console.log('External cutting jobs:', externalCutting.data?.length || 0);
    console.log('External printing jobs:', externalPrinting.data?.length || 0);
    console.log('External stitching jobs:', externalStitching.data?.length || 0);

    // Test 5: Jobs with received_quantity
    console.log('\n📊 === JOBS WITH RECEIVED QUANTITY ===');
    const [cuttingWithQty, printingWithQty, stitchingWithQty] = await Promise.all([
      supabase.from('cutting_jobs').select('*').not('received_quantity', 'is', null),
      supabase.from('printing_jobs').select('*').not('received_quantity', 'is', null),
      supabase.from('stitching_jobs').select('*').not('received_quantity', 'is', null)
    ]);

    console.log('Cutting jobs with received_quantity:', cuttingWithQty.data?.length || 0);
    console.log('Printing jobs with received_quantity:', printingWithQty.data?.length || 0);
    console.log('Stitching jobs with received_quantity:', stitchingWithQty.data?.length || 0);

    // Test 6: Check job_cards
    console.log('\n📊 === JOB CARDS CHECK ===');
    const jobCards = await supabase.from('job_cards').select('*').limit(5);
    console.log('Sample job_cards:', jobCards.data);

    // Test 7: Try the exact query from the app
    console.log('\n📊 === EXACT APP QUERY TEST ===');
    const exactCuttingQuery = await supabase
      .from('cutting_jobs')
      .select(`
        id,
        worker_name,
        is_internal,
        received_quantity,
        status,
        created_at,
        job_cards!inner (
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
      .not('received_quantity', 'is', null);

    console.log('Exact cutting query result:', exactCuttingQuery.data?.length || 0);
    console.log('Exact cutting query error:', exactCuttingQuery.error);
    console.log('Sample exact cutting result:', exactCuttingQuery.data?.[0]);

    console.log('\n✅ Quick debug complete!');

  } catch (error) {
    console.error('❌ Error in quick debug:', error);
  }
}

quickDebug();
