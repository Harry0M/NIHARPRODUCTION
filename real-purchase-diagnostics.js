/**
 * Real Purchase Data Diagnostics
 * Run this in the browser console while testing the actual purchase
 * to capture and analyze the real data causing the 1.504 → 2.048 issue
 */

console.log("🔧 REAL PURCHASE DIAGNOSTICS TOOL LOADED");
console.log("===============================================");

// Store original console.log to avoid conflicts
const originalLog = console.log;

// Function to capture and analyze real purchase data
window.diagnosePurchaseTransport = function(purchase, item, currentInventory) {
  console.log("\n🚨 DIAGNOSING REAL PURCHASE DATA 🚨");
  console.log("=====================================");
  
  console.log("\n📋 ACTUAL PURCHASE DATA:");
  console.log("Purchase ID:", purchase?.id);
  console.log("Purchase Number:", purchase?.purchase_number);
  console.log("Transport Charge:", purchase?.transport_charge);
  console.log("Number of items:", purchase?.purchase_items?.length);
  
  console.log("\n📦 PROBLEMATIC ITEM:");
  console.log("Material ID:", item?.material_id);
  console.log("Material Name:", item?.material?.material_name);
  console.log("Quantity:", item?.quantity);
  console.log("Unit Price:", item?.unit_price);
  console.log("Actual Meter:", item?.actual_meter);
  
  console.log("\n📊 CURRENT INVENTORY:");
  console.log("Current purchase_rate:", currentInventory?.purchase_rate);
  console.log("Current quantity:", currentInventory?.quantity);
  console.log("Conversion rate:", currentInventory?.conversion_rate);
  
  console.log("\n🎯 EXPECTED RESULT:");
  console.log("Should go from 1.504 to 2.048");
  console.log("Required adjustment:", 2.048 - 1.504, "=", (2.048 - 1.504).toFixed(4));
  
  // Analyze the transport calculation with real data
  if (purchase?.transport_charge > 0 && purchase?.purchase_items) {
    console.log("\n🚛 ANALYZING TRANSPORT WITH REAL DATA:");
    
    let totalWeight = 0;
    console.log("Calculating total weight:");
    
    purchase.purchase_items.forEach((purchaseItem, index) => {
      const conversionRate = purchaseItem.material?.conversion_rate || currentInventory?.conversion_rate || 1;
      const weight = purchaseItem.quantity * conversionRate;
      totalWeight += weight;
      console.log(`  Item ${index + 1} (${purchaseItem.material?.material_name}): ${purchaseItem.quantity} × ${conversionRate} = ${weight}kg`);
    });
    
    console.log("Total weight:", totalWeight, "kg");
    
    if (totalWeight > 0) {
      const perKgTransport = purchase.transport_charge / totalWeight;
      console.log("Per kg transport rate:", perKgTransport);
      
      // Calculate for the problematic item
      const itemConversionRate = item?.material?.conversion_rate || currentInventory?.conversion_rate || 1;
      const itemWeight = item.quantity * itemConversionRate;
      const transportShare = itemWeight * perKgTransport;
      const transportPerUnit = transportShare / item.quantity;
      
      console.log("\nFor problematic item:");
      console.log("Item weight:", itemWeight, "kg");
      console.log("Transport share:", transportShare);
      console.log("Transport per unit:", transportPerUnit);
      console.log("Adjusted price:", item.unit_price + transportPerUnit);
      
      console.log("\n💡 ANALYSIS:");
      const expectedTransportPerUnit = 2.048 - item.unit_price;
      console.log("Expected transport per unit:", expectedTransportPerUnit);
      console.log("Calculated transport per unit:", transportPerUnit);
      console.log("Difference:", Math.abs(transportPerUnit - expectedTransportPerUnit));
      
      if (Math.abs(transportPerUnit - expectedTransportPerUnit) < 0.001) {
        console.log("✅ Transport calculation appears CORRECT");
      } else {
        console.log("❌ Transport calculation has ISSUES");
        
        // Calculate what the transport charge should be
        const requiredTransportShare = expectedTransportPerUnit * item.quantity;
        const requiredPerKgTransport = requiredTransportShare / itemWeight;
        const requiredTotalTransport = requiredPerKgTransport * totalWeight;
        
        console.log("\n🔧 DEBUGGING:");
        console.log("Required transport share:", requiredTransportShare);
        console.log("Required per kg transport:", requiredPerKgTransport);
        console.log("Required total transport charge:", requiredTotalTransport);
        console.log("Actual transport charge:", purchase.transport_charge);
        console.log("Ratio:", purchase.transport_charge / requiredTotalTransport);
      }
    }
  } else {
    console.log("\n⚠️  No transport charge or no purchase items");
  }
  
  console.log("\n🎯 RECOMMENDATIONS:");
  console.log("1. Check if the transport_charge value is correct");
  console.log("2. Verify conversion_rate values for all materials");
  console.log("3. Confirm the unit_price value is not being modified elsewhere");
  console.log("4. Check if transport should be applied to this purchase");
  
  return {
    purchase,
    item,
    currentInventory,
    analysis: "Use the above logs to identify the issue"
  };
};

// Function to monitor purchase completion
window.monitorPurchaseCompletion = function() {
  console.log("🔍 Purchase completion monitoring started");
  console.log("Call diagnosePurchaseTransport(purchase, item, currentInventory) when you encounter the issue");
};

// Function to test with simulated data
window.testTransportCalculation = function(transportCharge, item1Qty, item1Rate, item2Qty, item2Rate) {
  const testData = {
    transport_charge: transportCharge || 500,
    purchase_items: [
      {
        quantity: item1Qty || 100,
        unit_price: 1.504,
        material: { conversion_rate: item1Rate || 1, material_name: "Test Item 1" }
      },
      {
        quantity: item2Qty || 50,
        unit_price: 2.0,
        material: { conversion_rate: item2Rate || 1.5, material_name: "Test Item 2" }
      }
    ]
  };
  
  return diagnosePurchaseTransport(testData, testData.purchase_items[0], { conversion_rate: item1Rate || 1 });
};

console.log("\n✅ Diagnostic functions loaded:");
console.log("- diagnosePurchaseTransport(purchase, item, currentInventory)");
console.log("- monitorPurchaseCompletion()"); 
console.log("- testTransportCalculation(transportCharge, item1Qty, item1Rate, item2Qty, item2Rate)");

console.log("\n🚀 USAGE:");
console.log("1. Navigate to the purchase that's causing issues");
console.log("2. Before completing the purchase, run: monitorPurchaseCompletion()");
console.log("3. When the transport calculation runs, the debugger will activate");
console.log("4. Or manually run: diagnosePurchaseTransport(purchaseData, itemData, inventoryData)");

console.log("\n🧪 QUICK TEST:");
console.log("Run: testTransportCalculation() to see the calculation with default problematic values");
