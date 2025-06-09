/**
 * Test script for Job Card Deletion with Material Consumption Reversal
 * 
 * This script tests the complete flow of:
 * 1. Creating a job card (which records material consumption)
 * 2. Deleting the job card (which should reverse the material consumption)
 * 3. Verifying that inventory quantities are properly restored
 * 
 * Run this in the browser console while on the job cards page.
 */

console.log("🧪 JOB CARD DELETION REVERSAL TEST LOADED");
console.log("==========================================");

// Test the job card material reversal functionality
window.testJobCardDeletionReversal = async function() {
  console.log("\n🚀 STARTING JOB CARD DELETION REVERSAL TEST");
  console.log("============================================");
  
  try {
    // Get supabase client
    const { supabase } = window;
    if (!supabase) {
      console.error("❌ Supabase client not available");
      return;
    }
    
    console.log("✓ Supabase client available");
    
    // Step 1: Find a job card to test with
    console.log("\n📋 STEP 1: Finding a test job card...");
    const { data: jobCards, error: jobCardsError } = await supabase
      .from('job_cards')
      .select(`
        id,
        job_number,
        order_id,
        status,
        order:orders(
          order_number,
          company_name
        )
      `)
      .limit(5);
      
    if (jobCardsError) {
      console.error("❌ Error fetching job cards:", jobCardsError);
      return;
    }
    
    if (!jobCards || jobCards.length === 0) {
      console.log("❌ No job cards found for testing");
      return;
    }
    
    const testJobCard = jobCards[0];
    console.log("✓ Found test job card:", {
      id: testJobCard.id,
      job_number: testJobCard.job_number,
      order_number: testJobCard.order?.order_number,
      company: testJobCard.order?.company_name
    });
    
    // Step 2: Check if this order has components for material consumption
    console.log("\n📦 STEP 2: Checking order components...");
    const { data: components, error: componentsError } = await supabase
      .from('order_components')
      .select(`
        id,
        material_id,
        consumption,
        component_type,
        material:inventory(
          id,
          material_name,
          quantity,
          unit
        )
      `)
      .eq('order_id', testJobCard.order_id);
      
    if (componentsError) {
      console.error("❌ Error fetching order components:", componentsError);
      return;
    }
    
    if (!components || components.length === 0) {
      console.log("⚠️ No components found for this order - material reversal won't be tested");
      console.log("💡 Create an order with components to test material reversal");
      return;
    }
    
    console.log(`✓ Found ${components.length} components:`, components.map(c => ({
      type: c.component_type,
      material: c.material?.material_name,
      consumption: c.consumption,
      current_inventory: c.material?.quantity
    })));
    
    // Step 3: Record current inventory quantities
    console.log("\n📊 STEP 3: Recording current inventory quantities...");
    const currentInventory = {};
    for (const component of components) {
      if (component.material_id && component.material) {
        currentInventory[component.material_id] = {
          name: component.material.material_name,
          quantity: component.material.quantity,
          consumption: component.consumption,
          unit: component.material.unit
        };
      }
    }
    
    console.log("✓ Current inventory:", currentInventory);
    
    // Step 4: Test the reversal function directly
    console.log("\n🔄 STEP 4: Testing material consumption reversal...");
    
    // Import the reversal function (this assumes it's available in the browser)
    // In a real test, you'd need to import this properly
    console.log("💡 To test the actual reversal, you would need to:");
    console.log("1. Import { reverseJobCardMaterialConsumption } from '@/utils/jobCardInventoryUtils'");
    console.log("2. Call: await reverseJobCardMaterialConsumption(testJobCard)");
    
    // Simulate what the reversal would do
    console.log("\n📝 EXPECTED RESULTS after reversal:");
    for (const [materialId, info] of Object.entries(currentInventory)) {
      const expectedNewQuantity = info.quantity + info.consumption;
      console.log(`- ${info.name}: ${info.quantity} → ${expectedNewQuantity} (+${info.consumption} ${info.unit})`);
    }
    
    // Step 5: Check transaction logs
    console.log("\n📜 STEP 5: Checking recent transaction logs...");
    const { data: recentLogs, error: logsError } = await supabase
      .from('inventory_transaction_log')
      .select(`
        id,
        material_id,
        transaction_type,
        quantity,
        previous_quantity,
        new_quantity,
        reference_id,
        reference_number,
        notes,
        transaction_date,
        material:inventory(material_name)
      `)
      .order('transaction_date', { ascending: false })
      .limit(10);
      
    if (logsError) {
      console.error("❌ Error fetching transaction logs:", logsError);
    } else {
      console.log("✓ Recent transaction logs:", recentLogs?.map(log => ({
        type: log.transaction_type,
        material: log.material?.material_name,
        quantity: log.quantity,
        reference: log.reference_number,
        date: new Date(log.transaction_date).toLocaleString()
      })));
    }
    
    console.log("\n✅ TEST PREPARATION COMPLETE");
    console.log("==============================");
    console.log("To actually test the deletion:");
    console.log("1. Use the job card delete dialog in the UI");
    console.log("2. Or call the delete functions directly from the browser console");
    console.log("3. Check that inventory quantities are restored");
    console.log("4. Verify transaction logs show 'job-card-reversal' entries");
    
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
};

// Helper function to monitor inventory changes during deletion
window.monitorInventoryDuringDeletion = async function(jobCardId) {
  console.log("\n👁️ MONITORING INVENTORY DURING DELETION");
  console.log("======================================");
  
  try {
    const { supabase } = window;
    
    // Get job card details
    const { data: jobCard, error: jobCardError } = await supabase
      .from('job_cards')
      .select(`
        id,
        job_number,
        order_id,
        order:orders(order_number)
      `)
      .eq('id', jobCardId)
      .single();
      
    if (jobCardError) {
      console.error("❌ Error fetching job card:", jobCardError);
      return;
    }
    
    // Get components and their current inventory
    const { data: components, error: componentsError } = await supabase
      .from('order_components')
      .select(`
        material_id,
        consumption,
        component_type,
        material:inventory(
          material_name,
          quantity,
          unit
        )
      `)
      .eq('order_id', jobCard.order_id);
      
    if (componentsError) {
      console.error("❌ Error fetching components:", componentsError);
      return;
    }
    
    console.log("📊 BEFORE DELETION:");
    console.log("Job Card:", jobCard.job_number);
    console.log("Order:", jobCard.order?.order_number);
    
    if (components && components.length > 0) {
      console.log("Materials:");
      components.forEach(comp => {
        if (comp.material) {
          console.log(`- ${comp.material.material_name}: ${comp.material.quantity} ${comp.material.unit} (will restore ${comp.consumption})`);
        }
      });
      
      // Set up a polling function to check inventory changes
      let checkCount = 0;
      const maxChecks = 10;
      
      const checkInventory = async () => {
        checkCount++;
        console.log(`\n🔍 Check #${checkCount} - Monitoring inventory...`);
        
        for (const comp of components) {
          if (comp.material_id) {
            const { data: currentInventory } = await supabase
              .from('inventory')
              .select('quantity, material_name')
              .eq('id', comp.material_id)
              .single();
              
            if (currentInventory) {
              console.log(`- ${currentInventory.material_name}: ${currentInventory.quantity}`);
            }
          }
        }
        
        if (checkCount < maxChecks) {
          setTimeout(checkInventory, 2000); // Check every 2 seconds
        } else {
          console.log("📊 Monitoring complete");
        }
      };
      
      // Start monitoring after a short delay
      setTimeout(checkInventory, 1000);
    } else {
      console.log("⚠️ No materials to monitor for this job card");
    }
    
  } catch (error) {
    console.error("❌ Monitoring failed:", error);
  }
};

// Helper function to verify reversal transaction logs
window.verifyReversalLogs = async function(jobCardId, jobNumber) {
  console.log("\n📜 VERIFYING REVERSAL TRANSACTION LOGS");
  console.log("====================================");
  
  try {
    const { supabase } = window;
    
    const { data: reversalLogs, error: logsError } = await supabase
      .from('inventory_transaction_log')
      .select(`
        id,
        material_id,
        transaction_type,
        quantity,
        previous_quantity,
        new_quantity,
        reference_id,
        reference_number,
        notes,
        metadata,
        transaction_date,
        material:inventory(material_name, unit)
      `)
      .eq('reference_id', jobCardId)
      .eq('transaction_type', 'job-card-reversal')
      .order('transaction_date', { ascending: false });
      
    if (logsError) {
      console.error("❌ Error fetching reversal logs:", logsError);
      return;
    }
    
    if (!reversalLogs || reversalLogs.length === 0) {
      console.log("⚠️ No reversal transaction logs found");
      console.log("💡 This might indicate the reversal didn't work or hasn't completed yet");
      return;
    }
    
    console.log(`✅ Found ${reversalLogs.length} reversal transaction logs:`);
    reversalLogs.forEach((log, index) => {
      console.log(`\n${index + 1}. ${log.material?.material_name || 'Unknown Material'}`);
      console.log(`   - Quantity restored: +${log.quantity} ${log.material?.unit || ''}`);
      console.log(`   - Inventory: ${log.previous_quantity} → ${log.new_quantity}`);
      console.log(`   - Reference: ${log.reference_number}`);
      console.log(`   - Date: ${new Date(log.transaction_date).toLocaleString()}`);
      if (log.metadata) {
        console.log(`   - Component: ${log.metadata.component_type || 'Unknown'}`);
      }
    });
    
  } catch (error) {
    console.error("❌ Verification failed:", error);
  }
};

console.log("\n🛠️ AVAILABLE TEST FUNCTIONS:");
console.log("- testJobCardDeletionReversal() - Prepare and analyze a job card for testing");
console.log("- monitorInventoryDuringDeletion(jobCardId) - Monitor inventory changes during deletion");
console.log("- verifyReversalLogs(jobCardId, jobNumber) - Check reversal transaction logs");

console.log("\n🚀 QUICK START:");
console.log("Run: testJobCardDeletionReversal()");
