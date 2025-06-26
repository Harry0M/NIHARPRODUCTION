/**
 * Real-world Test: Check Order Form Component Data
 * 
 * This script helps debug what's actually happening in the order form UI
 * by examining the component data structure that's being passed to the hooks.
 */

console.log('🎯 Real-world Order Form Component Data Analysis\n');

// Create a comprehensive test that simulates the exact data flow
function simulateOrderFormFlow() {
  console.log('📦 Step 1: Product Selection - Components from Database');
  
  // Simulate components that might come from the database/product selection
  const databaseComponents = {
    Part: {
      id: 'comp-1',
      type: 'Part',
      formula: 'manual',  // This should be set by product/catalog
      consumption: '2.5',
      material_id: 'mat-1',
      materialRate: 10,
      materialCost: 25
    },
    Border: {
      id: 'comp-2', 
      type: 'Border',
      // Note: this component doesn't have formula set, but might have is_manual_consumption
      consumption: '1.8',
      material_id: 'mat-2',
      materialRate: 8,
      materialCost: 14.4
    },
    Handle: {
      id: 'comp-3',
      type: 'Handle',
      formula: 'standard',
      consumption: '0.5', 
      material_id: 'mat-3',
      materialRate: 12,
      materialCost: 6
    }
  };
  
  console.log('   Database components:');
  Object.keys(databaseComponents).forEach(type => {
    const comp = databaseComponents[type];
    console.log(`     ${type}: formula=${comp.formula}, consumption=${comp.consumption}`);
  });
  
  console.log('\n🔄 Step 2: User Changes Order Quantity to 4');
  
  // Simulate the updateConsumptionBasedOnQuantity function
  const orderQuantity = 4;
  const updatedComponents = {};
  
  Object.keys(databaseComponents).forEach(type => {
    const component = databaseComponents[type];
    
    // Check if component has consumption
    if (!component.consumption) {
      console.log(`   ⚠️  ${type}: No consumption value, skipping`);
      return;
    }
    
    const currentConsumption = parseFloat(component.consumption);
    if (isNaN(currentConsumption)) {
      console.log(`   ⚠️  ${type}: Invalid consumption value: ${component.consumption}`);
      return;
    }
    
    // Use the same logic as isManualFormula function
    const hasManualFormula = component.formula === 'manual';
    const hasManualConsumption = component.is_manual_consumption === true;
    const isManual = hasManualFormula || hasManualConsumption;
    
    let newConsumption;
    
    if (isManual) {
      newConsumption = currentConsumption * orderQuantity;
      console.log(`   🔧 ${type} (MANUAL): ${currentConsumption} × ${orderQuantity} = ${newConsumption}`);
    } else {
      newConsumption = currentConsumption;
      console.log(`   📐 ${type} (CALCULATED): keeping ${newConsumption}`);
    }
    
    updatedComponents[type] = {
      ...component,
      consumption: newConsumption.toFixed(4),
      materialCost: newConsumption * component.materialRate
    };
  });
  
  console.log('\n📊 Step 3: Final Component State');
  Object.keys(updatedComponents).forEach(type => {
    const comp = updatedComponents[type];
    console.log(`   ${type}: consumption=${comp.consumption}, cost=${comp.materialCost}`);
  });
  
  return updatedComponents;
}

// Test the flow
const result = simulateOrderFormFlow();

console.log('\n' + '='.repeat(60));
console.log('🔍 Analysis:');

console.log('\n✅ Working correctly:');
console.log('   • Components with formula="manual" get multiplied');
console.log('   • Components with formula="standard" stay the same');

console.log('\n⚠️  Potential Issues:');
console.log('   • If formula field is missing from database, manual components won\'t be detected');
console.log('   • Need to ensure is_manual_consumption flag is set during product selection');
console.log('   • Check that the component data structure matches expectations');

console.log('\n🔧 Debugging Steps:');
console.log('   1. Check console logs in browser when changing order quantity');
console.log('   2. Verify component.formula and component.is_manual_consumption values');
console.log('   3. Ensure isManualFormula() function gets correct component data');
console.log('   4. Check if components are being skipped due to missing/invalid consumption');

console.log('\n💡 Quick Fix:');
console.log('   Add console.log in useOrderComponents.ts to see actual component data:');
console.log('   console.log("Component data:", component);');
console.log('   console.log("isManual result:", isManualFormula(component));');
