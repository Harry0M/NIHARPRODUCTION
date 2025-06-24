// Simple debug script for vendor bills - run in browser console on vendor bills page
// This uses the existing supabase client from the page

console.log('🔍 Simple Vendor Bills Debug Starting...');

async function simpleDebug() {
  try {
    // Get the supabase client from the React app context
    // First, let's try to access it from the window or global scope
    let supabase = null;
    
    // Try to get supabase from the page's React context
    const reactRoot = document.querySelector('#root');
    if (reactRoot && reactRoot._reactInternals) {
      // Try to find supabase in the React fiber tree
      console.log('Found React internals, trying to extract supabase...');
    }
    
    // If we can't get it automatically, we'll create our own
    if (!supabase) {
      console.log('Creating new Supabase client...');
      
      // Manual supabase client creation
      const supabaseUrl = 'https://aqqlhvcltqvuxqwowxly.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxcWxodmNsdHF2dXhxd293eGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3MzYwNjcsImV4cCI6MjA1MTMxMjA2N30.rXF9XZI4TmpGWY5JJB4FBNMr3WmqiCX7pZ0Yw9S4Itw';
      
      // Use the same import that the app uses
      const { createClient } = await import('/src/integrations/supabase/client.js');
      supabase = createClient(supabaseUrl, supabaseKey);
    }

    console.log('✅ Supabase client ready');

    // Test 1: Basic data counts
    console.log('\n📊 === BASIC COUNTS ===');
    
    const cuttingCount = await supabase.from('cutting_jobs').select('*', { count: 'exact', head: true });
    const printingCount = await supabase.from('printing_jobs').select('*', { count: 'exact', head: true });
    const stitchingCount = await supabase.from('stitching_jobs').select('*', { count: 'exact', head: true });
    
    console.log('Total cutting jobs:', cuttingCount.count);
    console.log('Total printing jobs:', printingCount.count);
    console.log('Total stitching jobs:', stitchingCount.count);

    // Test 2: Sample data with key fields
    console.log('\n📊 === SAMPLE DATA ===');
    
    const sampleCutting = await supabase
      .from('cutting_jobs')
      .select('id, worker_name, status, is_internal, received_quantity, job_card_id')
      .limit(3);
    
    const samplePrinting = await supabase
      .from('printing_jobs')
      .select('id, worker_name, status, is_internal, received_quantity, rate, job_card_id')
      .limit(3);
    
    const sampleStitching = await supabase
      .from('stitching_jobs')
      .select('id, worker_name, status, is_internal, received_quantity, rate, job_card_id')
      .limit(3);

    console.log('Sample cutting jobs:', sampleCutting.data);
    console.log('Sample printing jobs:', samplePrinting.data);
    console.log('Sample stitching jobs:', sampleStitching.data);

    // Test 3: Check what statuses actually exist
    console.log('\n📊 === ACTUAL STATUS VALUES ===');
    
    const cuttingStatuses = await supabase
      .from('cutting_jobs')
      .select('status')
      .not('status', 'is', null);
    
    const uniqueCuttingStatuses = [...new Set(cuttingStatuses.data?.map(j => j.status) || [])];
    console.log('Unique cutting job statuses:', uniqueCuttingStatuses);

    // Test 4: Check is_internal values
    console.log('\n📊 === ACTUAL IS_INTERNAL VALUES ===');
    
    const cuttingInternal = await supabase
      .from('cutting_jobs')
      .select('is_internal')
      .not('is_internal', 'is', null);
    
    const uniqueInternalValues = [...new Set(cuttingInternal.data?.map(j => j.is_internal) || [])];
    console.log('Unique is_internal values:', uniqueInternalValues);

    // Test 5: Check completed external jobs with received_quantity
    console.log('\n📊 === COMPLETED EXTERNAL JOBS WITH QUANTITY ===');
    
    const cuttingFiltered = await supabase
      .from('cutting_jobs')
      .select('*')
      .eq('status', 'completed')
      .eq('is_internal', false)
      .not('received_quantity', 'is', null);
    
    console.log('Completed external cutting jobs with quantity:', cuttingFiltered.data?.length || 0);
    if (cuttingFiltered.data?.[0]) {
      console.log('Sample filtered cutting job:', cuttingFiltered.data[0]);
    }

    // Test 6: Check job_cards
    console.log('\n📊 === JOB CARDS CHECK ===');
    
    const jobCards = await supabase
      .from('job_cards')
      .select('id, job_name, job_number, vendor_id')
      .limit(5);
    
    console.log('Sample job_cards:', jobCards.data);
    console.log('Total job_cards found:', jobCards.data?.length || 0);

    // Test 7: Check if cutting jobs have job_card_id
    if (sampleCutting.data?.[0]) {
      console.log('\n📊 === JOB_CARD_ID CHECK ===');
      console.log('Sample cutting job job_card_id:', sampleCutting.data[0].job_card_id);
      
      if (sampleCutting.data[0].job_card_id) {
        // Try to get the related job_card
        const relatedJobCard = await supabase
          .from('job_cards')
          .select('*')
          .eq('id', sampleCutting.data[0].job_card_id)
          .single();
        
        console.log('Related job_card:', relatedJobCard.data);
      }
    }

    console.log('\n✅ Simple debug complete!');

  } catch (error) {
    console.error('❌ Error in simple debug:', error);
  }
}

simpleDebug();
