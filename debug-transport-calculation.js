/**
 * Debug Transport Calculation Issue
 * This simulates the exact scenario where purchase rate goes from 1.504 to 2.048
 * Run this in browser console to identify the transport calculation issue
 */

// Mock the problematic scenario
const problematicPurchaseData = {
  id: "purchase-problematic-123",
  purchase_number: "PUR-2025-DEBUG",
  transport_charge: 500, // Test with different values
  purchase_items: [
    {
      id: "item1",
      material_id: "mat1",
      quantity: 100,
      unit_price: 1.504, // This is what becomes 2.048 - the problem case
      line_total: 150.4,
      actual_meter: 100,
      material: {
        id: "mat1",
        material_name: "Problematic Material",
        conversion_rate: 1.0, // Test with different conversion rates
        unit: "units"
      }
    },
    // Add other items if this is a multi-item purchase
    {
      id: "item2", 
      material_id: "mat2",
      quantity: 50,
      unit_price: 2.0,
      line_total: 100,
      actual_meter: 50,
      material: {
        id: "mat2",
        material_name: "Second Material",
        conversion_rate: 1.5,
        unit: "kg"
      }
    }
  ]
};

console.log("🚨 DEBUGGING TRANSPORT CALCULATION ISSUE 🚨");
console.log("=".repeat(60));

console.log("\n📊 SCENARIO:");
console.log(`- Original purchase rate: 1.504`);
console.log(`- Updated purchase rate: 2.048`);
console.log(`- Difference: ${2.048 - 1.504} = 0.544`);
console.log(`- Percentage increase: ${((2.048 - 1.504) / 1.504 * 100).toFixed(2)}%`);

console.log("\n🔍 ANALYZING POSSIBLE CAUSES:");

// Test 1: Check if transport adjustment calculation is correct
function simulateTransportCalculation(purchase, targetItem) {
  console.log(`\n1️⃣ SIMULATING TRANSPORT CALCULATION:`);
  console.log(`   Purchase transport charge: ${purchase.transport_charge}`);
  
  // Calculate total weight
  let totalWeight = 0;
  purchase.purchase_items.forEach(item => {
    const weight = item.quantity * item.material.conversion_rate;
    totalWeight += weight;
    console.log(`   ${item.material.material_name}: ${item.quantity} × ${item.material.conversion_rate} = ${weight}kg`);
  });
  
  console.log(`   Total weight: ${totalWeight}kg`);
  
  if (totalWeight <= 0) {
    console.log(`   ❌ ERROR: Total weight is 0!`);
    return 0;
  }
  
  // Calculate per kg transport
  const perKgTransport = purchase.transport_charge / totalWeight;
  console.log(`   Per kg transport: ${purchase.transport_charge} ÷ ${totalWeight} = ${perKgTransport}`);
  
  // Calculate for target item
  const itemWeight = targetItem.quantity * targetItem.material.conversion_rate;
  const transportShare = itemWeight * perKgTransport;
  const transportPerUnit = transportShare / targetItem.quantity;
  
  console.log(`   Target item weight: ${targetItem.quantity} × ${targetItem.material.conversion_rate} = ${itemWeight}kg`);
  console.log(`   Transport share: ${itemWeight} × ${perKgTransport} = ${transportShare}`);
  console.log(`   Transport per unit: ${transportShare} ÷ ${targetItem.quantity} = ${transportPerUnit}`);
  
  const adjustedPrice = targetItem.unit_price + transportPerUnit;
  console.log(`   Adjusted price: ${targetItem.unit_price} + ${transportPerUnit} = ${adjustedPrice}`);
  
  return {
    transportPerUnit,
    adjustedPrice,
    perKgTransport,
    itemWeight,
    totalWeight
  };
}

const result1 = simulateTransportCalculation(problematicPurchaseData, problematicPurchaseData.purchase_items[0]);

console.log(`\n✅ RESULT: If calculation is correct, adjusted price should be ${result1.adjustedPrice}`);
console.log(`🎯 EXPECTED: 2.048`);
console.log(`💡 MATCH? ${Math.abs(result1.adjustedPrice - 2.048) < 0.001 ? 'YES ✅' : 'NO ❌'}`);

// Test 2: Check different transport charge scenarios
console.log(`\n2️⃣ TESTING DIFFERENT TRANSPORT CHARGES:`);

const transportChargeTests = [0, 100, 250, 500, 1000];
transportChargeTests.forEach(charge => {
  const testPurchase = { ...problematicPurchaseData, transport_charge: charge };
  const result = simulateTransportCalculation(testPurchase, testPurchase.purchase_items[0]);
  console.log(`   Transport ${charge}: ${testPurchase.purchase_items[0].unit_price} → ${result.adjustedPrice.toFixed(4)} (+${result.transportPerUnit.toFixed(4)})`);
});

// Test 3: Check conversion rate impact
console.log(`\n3️⃣ TESTING CONVERSION RATE IMPACT:`);

const conversionRateTests = [0.5, 1.0, 1.5, 2.0, 5.0];
conversionRateTests.forEach(rate => {
  const testPurchase = JSON.parse(JSON.stringify(problematicPurchaseData));
  testPurchase.purchase_items[0].material.conversion_rate = rate;
  const result = simulateTransportCalculation(testPurchase, testPurchase.purchase_items[0]);
  console.log(`   Conversion rate ${rate}: ${testPurchase.purchase_items[0].unit_price} → ${result.adjustedPrice.toFixed(4)} (+${result.transportPerUnit.toFixed(4)})`);
});

// Test 4: Reverse engineer the expected result
console.log(`\n4️⃣ REVERSE ENGINEERING:`);
console.log(`   If 1.504 becomes 2.048, the transport adjustment is: ${(2.048 - 1.504).toFixed(4)}`);
console.log(`   This represents ${((2.048 - 1.504) / 1.504 * 100).toFixed(2)}% increase`);

// Check if this matches our calculation
const expectedTransportPerUnit = 2.048 - 1.504;
console.log(`   Expected transport per unit: ${expectedTransportPerUnit}`);
console.log(`   Calculated transport per unit: ${result1.transportPerUnit}`);
console.log(`   Difference: ${Math.abs(expectedTransportPerUnit - result1.transportPerUnit).toFixed(6)}`);

// Test 5: Check if there might be a double application
console.log(`\n5️⃣ CHECKING FOR DOUBLE APPLICATION:`);
console.log(`   If transport is applied twice: ${1.504 + (result1.transportPerUnit * 2)}`);
console.log(`   If transport is calculated on adjusted price: ${1.504 * (1 + result1.transportPerUnit/1.504)}`);

// Test 6: Check exact values that would produce 2.048
console.log(`\n6️⃣ WHAT WOULD PRODUCE 2.048?`);
const targetIncrease = 2.048 - 1.504;
console.log(`   Required transport per unit: ${targetIncrease}`);

// If this is the transport per unit, what would the total transport charge be?
const item1 = problematicPurchaseData.purchase_items[0];
const result = simulateTransportCalculation(problematicPurchaseData, item1);
const requiredTransportShare = targetIncrease * item1.quantity;
const requiredPerKgTransport = requiredTransportShare / (item1.quantity * item1.material.conversion_rate);
const requiredTotalTransport = requiredPerKgTransport * result.totalWeight;

console.log(`   Required transport share for item: ${requiredTransportShare}`);
console.log(`   Required per kg transport: ${requiredPerKgTransport}`);
console.log(`   Required total transport charge: ${requiredTotalTransport}`);
console.log(`   Actual transport charge: ${problematicPurchaseData.transport_charge}`);

console.log(`\n🎯 CONCLUSION:`);
if (Math.abs(requiredTotalTransport - problematicPurchaseData.transport_charge) < 1) {
  console.log(`✅ The calculation seems CORRECT. The issue might be elsewhere.`);
} else {
  console.log(`❌ There's a mismatch in the transport calculation logic.`);
}

console.log(`\n🔧 RECOMMENDATIONS:`);
console.log(`1. Check if transport is being applied multiple times`);
console.log(`2. Verify conversion rates in the database`);
console.log(`3. Check if purchase.transport_charge is being modified`);
console.log(`4. Verify that the correct unit_price is being used`);
console.log(`5. Check for any middleware or triggers affecting the calculation`);

console.log(`\n📋 COPY THIS TO TEST IN YOUR APP:`);
console.log(`Run this in browser console while testing purchase completion:`);
console.log(`
window.debugTransport = ${JSON.stringify(problematicPurchaseData, null, 2)};
console.log("Debug data set. Use debugTransport in your purchase completion test.");
`);
