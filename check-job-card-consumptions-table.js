// Test script to check if job_card_consumptions table exists
// Run with: node check-job-card-consumptions-table.js

import { supabase } from './src/integrations/supabase/client.js';

async function checkJobCardConsumptionsTable() {
  try {
    console.log('🔍 Checking if job_card_consumptions table exists...');
    
    // Try to query the table to see if it exists
    const { data, error } = await supabase
      .from('job_card_consumptions')
      .select('*')
      .limit(1);

    if (error) {
      if (error.message.includes('relation "public.job_card_consumptions" does not exist')) {
        console.log('❌ job_card_consumptions table does NOT exist');
        console.log('💡 Need to apply the migration to create the table');
        return false;
      } else {
        console.log('❌ Error checking table:', error.message);
        return false;
      }
    } else {
      console.log('✅ job_card_consumptions table EXISTS');
      console.log('📊 Sample data count:', data?.length || 0);
      return true;
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
    return false;
  }
}

checkJobCardConsumptionsTable()
  .then(exists => {
    if (!exists) {
      console.log('\n📝 Next steps:');
      console.log('1. Apply the migration: supabase db push');
      console.log('2. Or create the table manually in the Supabase dashboard');
    } else {
      console.log('\n✅ Ready to use job card consumption tracking!');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
