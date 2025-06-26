/**
 * Debug Manual Component Detection in Order Form
 * 
 * This test simulates the actual component structure that comes from product selection
 * and verifies how manual components are being identified.
 */

console.log('🔍 Debugging Manual Component Detection in Order Form\n');

// Simulate the isManualFormula function from utils
function isManualFormula(component) {
  if (!component) return false;
  
  // Check both formula field and is_manual_consumption flag
  const hasManualFormula = component.formula === 'manual';
  const hasManualConsumption = component.is_manual_consumption === true;
  
  // Log for debugging
  console.log(`Manual formula check for ${component.type || 'unknown'}:`, {
    formula: component.formula,
    is_manual_consumption: component.is_manual_consumption,
    isManual: hasManualFormula || hasManualConsumption
  });
  
  return hasManualFormula || hasManualConsumption;
}

// Test different component structures that might come from the database
const testComponents = [
  {
    name: 'Component with formula="manual"',
    component: {
      type: 'Part',
      formula: 'manual',
      consumption: '2.5',
      materialRate: 10
    }
  },
  {
    name: 'Component with is_manual_consumption=true',
    component: {
      type: 'Border',
      is_manual_consumption: true,
      consumption: '1.8',
      materialRate: 8
    }
  },
  {
    name: 'Component with formula="standard"',
    component: {
      type: 'Handle',
      formula: 'standard',
      consumption: '0.5',
      materialRate: 12
    }
  },
  {
    name: 'Component with no formula/manual flags',
    component: {
      type: 'Chain',
      consumption: '1.2',
      materialRate: 15
    }
  },
  {
    name: 'Component with both formula="manual" and is_manual_consumption=true',
    component: {
      type: 'Piping',
      formula: 'manual',
      is_manual_consumption: true,
      consumption: '3.0',
      materialRate: 9
    }
  },
  {
    name: 'Component with formula="linear"',
    component: {
      type: 'Runner',
      formula: 'linear',
      consumption: '2.1',
      materialRate: 11
    }
  }
];

console.log('🧪 Testing Manual Component Detection:');
console.log('='.repeat(50));

let manualComponents = [];
let calculatedComponents = [];

testComponents.forEach(test => {
  console.log(`\n📋 ${test.name}:`);
  const isManual = isManualFormula(test.component);
  
  if (isManual) {
    manualComponents.push(test.component);
    console.log('   ✅ DETECTED AS MANUAL');
  } else {
    calculatedComponents.push(test.component);
    console.log('   📐 DETECTED AS CALCULATED');
  }
});

console.log('\n' + '='.repeat(50));
console.log('📊 Summary:');
console.log(`   Manual components: ${manualComponents.length}`);
console.log(`   Calculated components: ${calculatedComponents.length}`);

console.log('\n🔧 Manual Components (should be multiplied by order quantity):');
manualComponents.forEach(comp => {
  console.log(`   • ${comp.type}: consumption=${comp.consumption}, formula=${comp.formula}, is_manual=${comp.is_manual_consumption}`);
});

console.log('\n📐 Calculated Components (should keep consumption as-is):');
calculatedComponents.forEach(comp => {
  console.log(`   • ${comp.type}: consumption=${comp.consumption}, formula=${comp.formula}, is_manual=${comp.is_manual_consumption}`);
});

// Now simulate the updateConsumptionBasedOnQuantity logic
console.log('\n' + '='.repeat(50));
console.log('🔄 Simulating Order Quantity Change to 3:');

const orderQuantity = 3;
const allComponents = [...manualComponents, ...calculatedComponents];

allComponents.forEach(component => {
  const currentConsumption = parseFloat(component.consumption);
  let newConsumption;
  
  if (isManualFormula(component)) {
    newConsumption = currentConsumption * orderQuantity;
    console.log(`🔧 ${component.type} (MANUAL): ${currentConsumption} × ${orderQuantity} = ${newConsumption}`);
  } else {
    newConsumption = currentConsumption;
    console.log(`📐 ${component.type} (CALCULATED): keeping ${newConsumption}`);
  }
});

console.log('\n🎯 This shows exactly how manual components should be identified and processed!');
