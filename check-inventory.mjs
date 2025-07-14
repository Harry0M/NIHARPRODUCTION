// Quick test to check if inventory table has any data
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://agilfkhwcaxqtdvnzumx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnaWxma2h3Y2F4cXRkdm56dW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MzM4NDEsImV4cCI6MjA1MDUwOTg0MX0.1t7K1qVeJH4wOyHkeFu7jbFPpd5CnCIZRlM04oaOygo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInventory() {
  console.log('Checking inventory table...');
  
  try {
    // Test basic count
    const { count, error: countError } = await supabase
      .from("inventory")
      .select('*', { count: 'exact', head: true });
    
    console.log('Inventory count result:', { count, countError });
    
    if (countError) {
      console.error('Error getting count:', countError);
      return;
    }
    
    console.log(`Total inventory items: ${count || 0}`);
    
    if (count && count > 0) {
      // Get a few sample records
      const { data, error } = await supabase
        .from("inventory")
        .select(`
          id,
          material_name,
          unit,
          color,
          gsm,
          purchase_rate
        `)
        .limit(3);
      
      if (error) {
        console.error('Error fetching sample data:', error);
      } else {
        console.log('Sample inventory data:', data);
      }
    }
    
  } catch (err) {
    console.error('Exception:', err);
  }
}

checkInventory();
