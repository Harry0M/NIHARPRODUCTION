/**
 * Test utility for verifying manual consumption values in the edit form
 * 
 * To use this in the browser console:
 * 1. Open a product edit page
 * 2. Open browser DevTools (F12)
 * 3. Copy and paste this code into the console
 * 4. Run: testManualConsumptionFix()
 */

// Test function to verify manual consumption values are loaded correctly
function testManualConsumptionFix() {
  console.log('%c TESTING MANUAL CONSUMPTION FIX', 'background:#2c3e50;color:white;font-size:16px;padding:10px;');
  
  // Test 1: Check if manual consumption input fields are populated
  const manualInputs = document.querySelectorAll('input[type="number"][step="0.0001"]');
  const manualToggles = document.querySelectorAll('button[role="switch"][aria-checked="true"]');
  
  console.log(`Found ${manualInputs.length} consumption input fields`);
  console.log(`Found ${manualToggles.length} manual toggles that are ON`);
  
  // Test 2: Check for formula dropdowns set to "Manual"
  const formulaSelects = document.querySelectorAll('[data-radix-select-trigger]');
  let manualFormulaCount = 0;
  
  formulaSelects.forEach((select, index) => {
    const selectedValue = select.textContent?.trim();
    if (selectedValue === 'Manual') {
      manualFormulaCount++;
      console.log(`%c Formula ${index + 1}: Manual (✓)`, 'color: green; font-weight: bold;');
    } else {
      console.log(`%c Formula ${index + 1}: ${selectedValue}`, 'color: blue;');
    }
  });
  
  // Test 3: Check for populated consumption values
  let populatedConsumptionCount = 0;
  manualInputs.forEach((input, index) => {
    const value = input.value;
    if (value && parseFloat(value) > 0) {
      populatedConsumptionCount++;
      console.log(`%c Consumption ${index + 1}: ${value} meters (✓)`, 'color: green; font-weight: bold;');
    } else {
      console.log(`%c Consumption ${index + 1}: EMPTY (❌)`, 'color: red; font-weight: bold;');
    }
  });
  
  // Test 4: Summary
  console.log('%c TEST RESULTS SUMMARY', 'background:#3498db;color:white;font-size:14px;padding:8px;');
  console.log(`Manual formulas detected: ${manualFormulaCount}`);
  console.log(`Manual toggles ON: ${manualToggles.length}`);
  console.log(`Populated consumption fields: ${populatedConsumptionCount}`);
  
  if (manualFormulaCount > 0 && manualToggles.length > 0 && populatedConsumptionCount > 0) {
    console.log('%c ✅ MANUAL CONSUMPTION FIX IS WORKING!', 'background: green; color: white; font-size: 16px; padding: 10px;');
  } else {
    console.log('%c ❌ MANUAL CONSUMPTION FIX NEEDS ATTENTION', 'background: red; color: white; font-size: 16px; padding: 10px;');
    
    if (manualFormulaCount === 0) console.log('- No manual formulas detected');
    if (manualToggles.length === 0) console.log('- No manual toggles are ON');
    if (populatedConsumptionCount === 0) console.log('- No consumption values are populated');
  }
  
  return {
    manualFormulas: manualFormulaCount,
    manualToggles: manualToggles.length,
    populatedConsumption: populatedConsumptionCount,
    success: manualFormulaCount > 0 && manualToggles.length > 0 && populatedConsumptionCount > 0
  };
}

// Test function to verify component data structure in React state
function testComponentDataStructure() {
  console.log('%c TESTING COMPONENT DATA STRUCTURE', 'background:#8e44ad;color:white;font-size:16px;padding:10px;');
  
  // Try to access React component state (this works in development mode)
  const reactRoot = document.querySelector('#root')?._reactInternalFiber || 
                    document.querySelector('#root')?._reactInternalInstance;
  
  if (reactRoot) {
    console.log('React component tree found - checking for manual components...');
    // This is a simplified check - in real testing, we'd need to traverse the React tree
    console.log('Use the "Test Formula State" button in the UI for detailed component state inspection');
  } else {
    console.log('React DevTools or component state not accessible from console');
    console.log('Use the "Test Formula State" button in the UI for component state inspection');
  }
}

// Test function to simulate user interactions
function testUserInteractions() {
  console.log('%c TESTING USER INTERACTIONS', 'background:#e67e22;color:white;font-size:16px;padding:10px;');
  
  // Test toggle interaction
  const manualToggles = document.querySelectorAll('button[role="switch"]');
  console.log(`Found ${manualToggles.length} manual toggles`);
  
  // Test consumption input interaction
  const consumptionInputs = document.querySelectorAll('input[type="number"][step="0.0001"]');
  console.log(`Found ${consumptionInputs.length} consumption input fields`);
  
  console.log('Manual interaction test complete. Try toggling manual mode and entering consumption values.');
}

// Main test runner
function runAllTests() {
  console.clear();
  console.log('%c MANUAL CONSUMPTION FIX - COMPREHENSIVE TESTS', 'background:#2c3e50;color:white;font-size:18px;padding:15px;');
  
  setTimeout(() => testManualConsumptionFix(), 100);
  setTimeout(() => testComponentDataStructure(), 500);
  setTimeout(() => testUserInteractions(), 1000);
  
  console.log('\n%c Tests will run automatically. Check results above.', 'background:#34495e;color:white;padding:8px;');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testManualConsumptionFix = testManualConsumptionFix;
  window.testComponentDataStructure = testComponentDataStructure;
  window.testUserInteractions = testUserInteractions;
  window.runAllTests = runAllTests;
  
  console.log('%c Manual Consumption Test Utilities Loaded!', 'background: #2ecc71; color: white; font-size: 14px; padding: 8px;');
  console.log('Available functions:');
  console.log('- testManualConsumptionFix()');
  console.log('- testComponentDataStructure()');
  console.log('- testUserInteractions()');
  console.log('- runAllTests()');
}
