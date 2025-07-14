import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://agilfkhwcaxqtdvnzumx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnaWxma2h3Y2F4cXRkdm56dW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MzM4NDEsImV4cCI6MjA1MDUwOTg0MX0.1t7K1qVeJH4wOyHkeFu7jbFPpd5CnCIZRlM04oaOygo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInventoryAccess() {
  console.log('Testing inventory table access...');
  
  try {
    // Test basic inventory query
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
      .limit(5);
    
    console.log('Query result:', { data, error });
    
    if (error) {
      console.error('Error accessing inventory:', error);
    } else {
      console.log('SUCCESS! Found', data?.length || 0, 'inventory items');
      if (data && data.length > 0) {
        console.log('Sample data:', data[0]);
      }
    }
    
  } catch (err) {
    console.error('Exception:', err);
  }
}

testInventoryAccess();
