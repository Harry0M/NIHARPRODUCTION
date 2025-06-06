/**
 * Test Manual Formula Processing
 * 
 * This test file verifies that the manual formula processing functionality
 * correctly identifies and processes manual formulas in order forms.
 */

import { 
  isManualFormula, 
  processManualFormulaConsumption, 
  processOrderComponents,
  validateManualFormulaProcessing,
  getManualFormulaComponents,
  getTotalManualFormulaConsumption
} from './src/utils/manualFormulaProcessor.ts';

// Test data
const testComponents = [
  {
    id: '1',
    type: 'part',
    formula: 'manual',
    is_manual_consumption: true,
    consumption: '2.5',
    material_id: 'mat1'
  },
  {
    id: '2', 
    type: 'border',
    formula: 'standard',
    is_manual_consumption: false,
    consumption: '1.2',
    material_id: 'mat2'
  },
  {
    id: '3',
    type: 'handle',
    formula: 'linear',
    is_manual_consumption: true,
    consumption: '0.8',
    material_id: 'mat3'
  },
  {
    id: '4',
    type: 'custom',
    formula: 'manual',
    is_manual_consumption: true,
    consumption: 3.0, // Test number type
    material_id: 'mat4'
  }
];

function runTests() {
  console.log('🧪 Starting Manual Formula Processing Tests...\n');

  // Test 1: Manual formula identification
  console.log('Test 1: Manual Formula Identification');
  console.log('=====================================');
  
  testComponents.forEach((comp, index) => {
    const isManual = isManualFormula(comp);
    const expected = comp.formula === 'manual' || comp.is_manual_consumption === true;
    const status = isManual === expected ? '✅ PASS' : '❌ FAIL';
    
    console.log(`Component ${index + 1} (${comp.type}): ${status}`);
    console.log(`  Expected: ${expected}, Got: ${isManual}`);
    console.log(`  Formula: ${comp.formula}, Manual Flag: ${comp.is_manual_consumption}\n`);
  });

  // Test 2: Manual formula consumption processing
  console.log('Test 2: Manual Formula Consumption Processing');
  console.log('===========================================');
  
  const orderQuantity = 5;
  console.log(`Order Quantity: ${orderQuantity}\n`);
  
  testComponents.forEach((comp, index) => {
    if (isManualFormula(comp)) {
      const processed = processManualFormulaConsumption(comp, orderQuantity);
      const originalConsumption = parseFloat(String(comp.consumption));
      const expectedConsumption = originalConsumption * orderQuantity;
      const actualConsumption = parseFloat(String(processed.consumption));
      
      const status = Math.abs(expectedConsumption - actualConsumption) < 0.001 ? '✅ PASS' : '❌ FAIL';
      
      console.log(`Component ${index + 1} (${comp.type}): ${status}`);
      console.log(`  Original: ${originalConsumption}`);
      console.log(`  Expected: ${expectedConsumption}`);
      console.log(`  Actual: ${actualConsumption}`);
      console.log(`  Stored Original: ${processed.originalConsumption}\n`);
    }
  });

  // Test 3: Process all components in order
  console.log('Test 3: Process All Order Components');
  console.log('===================================');
  
  const processedComponents = processOrderComponents(testComponents, orderQuantity);
  
  console.log(`Original components: ${testComponents.length}`);
  console.log(`Processed components: ${processedComponents.length}`);
  
  const manualComponents = getManualFormulaComponents(processedComponents);
  console.log(`Manual formula components: ${manualComponents.length}\n`);
  
  manualComponents.forEach((comp, index) => {
    console.log(`Manual Component ${index + 1}:`);
    console.log(`  Type: ${comp.type}`);
    console.log(`  Original Consumption: ${comp.originalConsumption}`);
    console.log(`  Processed Consumption: ${comp.consumption}`);
    console.log(`  Formula: ${comp.formula}\n`);
  });

  // Test 4: Validation
  console.log('Test 4: Manual Formula Processing Validation');
  console.log('==========================================');
  
  const validationResult = validateManualFormulaProcessing(processedComponents, orderQuantity);
  const status = validationResult ? '✅ PASS' : '❌ FAIL';
  
  console.log(`Validation Result: ${status}`);
  console.log(`All manual formulas processed correctly: ${validationResult}\n`);

  // Test 5: Total consumption calculation
  console.log('Test 5: Total Manual Formula Consumption');
  console.log('=======================================');
  
  const totalConsumption = getTotalManualFormulaConsumption(processedComponents);
  console.log(`Total manual formula consumption: ${totalConsumption}`);
  
  // Calculate expected total
  const expectedTotal = testComponents
    .filter(comp => isManualFormula(comp))
    .reduce((total, comp) => total + (parseFloat(String(comp.consumption)) * orderQuantity), 0);
  
  const totalStatus = Math.abs(totalConsumption - expectedTotal) < 0.001 ? '✅ PASS' : '❌ FAIL';
  console.log(`Expected total: ${expectedTotal}`);
  console.log(`Total calculation: ${totalStatus}\n`);

  // Test 6: Edge cases
  console.log('Test 6: Edge Cases');
  console.log('=================');
  
  // Test with empty components
  const emptyResult = processOrderComponents([], orderQuantity);
  console.log(`Empty components array: ${emptyResult.length === 0 ? '✅ PASS' : '❌ FAIL'}`);
  
  // Test with zero quantity
  const zeroQuantityResult = processOrderComponents(testComponents, 0);
  console.log(`Zero quantity handling: ${zeroQuantityResult.length === testComponents.length ? '✅ PASS' : '❌ FAIL'}`);
  
  // Test with null component
  const nullComponent = null;
  const nullResult = isManualFormula(nullComponent);
  console.log(`Null component handling: ${nullResult === false ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\n🎉 Manual Formula Processing Tests Complete!');
}

// Export for use in browser or Node.js
if (typeof window !== 'undefined') {
  // Browser environment
  window.runManualFormulaTests = runTests;
  console.log('Manual formula tests loaded. Run runManualFormulaTests() to execute.');
} else {
  // Node.js environment
  runTests();
}

export { runTests as runManualFormulaTests };
