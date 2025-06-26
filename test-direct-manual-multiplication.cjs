/**
 * Quick test for the simplified manual consumption multiplication
 * 
 * This tests the direct approach:
 * 1. If component has manual formula, multiply existing consumption by order quantity
 * 2. If component is calculated, keep consumption as-is
 */

console.log('🧪 Testing Simplified Manual Consumption Multiplication\n');

// Simulate the new simplified logic
function simulateUpdateConsumption(components, orderQuantity) {
  console.log(`📊 Updating consumption for order quantity: ${orderQuantity}`);
  
  const results = {};
  
  Object.keys(components).forEach(type => {
    const component = components[type];
    
    if (!component.consumption) {
      console.log(`⚠️  ${type}: No consumption value, skipping`);
      return;
    }
    
    const currentConsumption = parseFloat(component.consumption);
    
    // Check if component has manual formula
    const isManual = component.formula === 'manual' || component.is_manual_consumption === true;
    
    let newConsumption;
    
    if (isManual) {
      // For manual: multiply existing consumption by order quantity
      newConsumption = currentConsumption * orderQuantity;
      console.log(`🔧 Manual ${type}: ${currentConsumption} × ${orderQuantity} = ${newConsumption}`);
    } else {
      // For calculated: keep as-is
      newConsumption = currentConsumption;
      console.log(`📐 Calculated ${type}: keeping ${newConsumption}`);
    }
    
    results[type] = {
      ...component,
      consumption: newConsumption.toFixed(4),
      materialCost: newConsumption * (component.materialRate || 0)
    };
  });
  
  return results;
}

// Test data
const testComponents = {
  Part: {
    type: 'Part',
    consumption: '2.5',
    formula: 'manual',
    is_manual_consumption: true,
    materialRate: 10
  },
  Border: {
    type: 'Border', 
    consumption: '1.8',
    formula: 'standard',
    is_manual_consumption: false,
    materialRate: 8
  },
  Handle: {
    type: 'Handle',
    consumption: '0.5',
    formula: 'manual',
    is_manual_consumption: true,
    materialRate: 12
  }
};

console.log('📦 Test Components:');
Object.keys(testComponents).forEach(type => {
  const comp = testComponents[type];
  console.log(`   ${type}: consumption=${comp.consumption}, formula=${comp.formula}, manual=${comp.is_manual_consumption}`);
});

console.log('\n' + '='.repeat(60));

// Test with quantity 1 (should be no change for manual components)
console.log('\n🔄 Test 1: Order Quantity = 1');
const result1 = simulateUpdateConsumption(testComponents, 1);

// Test with quantity 3 (manual components should be multiplied)
console.log('\n🔄 Test 2: Order Quantity = 3');
const result3 = simulateUpdateConsumption(testComponents, 3);

// Test with quantity 5 (manual components should be multiplied)
console.log('\n🔄 Test 3: Order Quantity = 5');
const result5 = simulateUpdateConsumption(testComponents, 5);

// Verification
console.log('\n🔍 Verification:');
console.log('='.repeat(30));

const tests = [
  {
    name: 'Manual Part with qty=3',
    expected: 7.5, // 2.5 * 3
    actual: parseFloat(result3.Part.consumption),
    passed: Math.abs(parseFloat(result3.Part.consumption) - 7.5) < 0.001
  },
  {
    name: 'Manual Handle with qty=5', 
    expected: 2.5, // 0.5 * 5
    actual: parseFloat(result5.Handle.consumption),
    passed: Math.abs(parseFloat(result5.Handle.consumption) - 2.5) < 0.001
  },
  {
    name: 'Calculated Border with qty=3',
    expected: 1.8, // Should remain 1.8
    actual: parseFloat(result3.Border.consumption),
    passed: Math.abs(parseFloat(result3.Border.consumption) - 1.8) < 0.001
  },
  {
    name: 'Calculated Border with qty=5',
    expected: 1.8, // Should remain 1.8
    actual: parseFloat(result5.Border.consumption),
    passed: Math.abs(parseFloat(result5.Border.consumption) - 1.8) < 0.001
  }
];

let allPassed = true;

tests.forEach(test => {
  const status = test.passed ? '✅' : '❌';
  console.log(`${status} ${test.name}`);
  console.log(`   Expected: ${test.expected}, Actual: ${test.actual}`);
  if (!test.passed) allPassed = false;
});

console.log('\n' + '='.repeat(60));

if (allPassed) {
  console.log('🎉 ALL TESTS PASSED!');
  console.log('\n✨ The simplified approach works correctly:');
  console.log('   • Manual components: existing consumption × order quantity');
  console.log('   • Calculated components: keep existing consumption');
  console.log('   • No complex fetchedConsumption logic needed');
  console.log('   • Direct and straightforward implementation');
} else {
  console.log('❌ Some tests failed. Please check the logic.');
}

console.log('\n🎯 This approach is much simpler and more reliable!');
