// Simple test to check if the trigger function and trigger exist
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Use the environment variables from .env.local
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTriggerExists() {
  console.log('Checking if trigger function exists...');
  
  try {
    // Simple query to check if purchases table exists and has data
    const { data: purchases, error: purchaseError } = await supabase
      .from('purchases')
      .select('id, purchase_number, invoice_number')
      .limit(1);
    
    if (purchaseError) {
      console.error('Error accessing purchases table:', purchaseError);
      return;
    }
    
    console.log('✅ Successfully connected to database');
    console.log('Sample purchase data:', purchases[0]);
    
    // Try to get a list of purchases to verify the trigger later
    const { data: allPurchases, error: allError } = await supabase
      .from('purchases')
      .select('id, purchase_number, invoice_number, status')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (allError) {
      console.error('Error fetching purchases:', allError);
      return;
    }
    
    console.log('Recent purchases:');
    allPurchases.forEach((purchase, index) => {
      console.log(`${index + 1}. ID: ${purchase.id}, Invoice: ${purchase.invoice_number}, Purchase: ${purchase.purchase_number}`);
    });
    
  } catch (error) {
    console.error('Check failed with error:', error);
  }
}

// Run the check
checkTriggerExists();
