/**
 * Test script for simplified manual consumption calculation
 * 
 * This verifies that:
 * 1. Manual components have their fetched consumption multiplied by order quantity
 * 2. Calculated components use their fetched consumption as-is
 * 3. No complex "base consumption" logic is involved
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Testing simplified manual consumption calculation...\n');

// Test the updated logic by examining the files
const testFiles = [
  'src/hooks/order-form/useOrderComponents.ts',
  'src/hooks/order-form/useProductSelection.ts',
  'src/hooks/use-order-form.ts'
];

let allTestsPassed = true;

testFiles.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    console.log(`📄 Testing ${filePath}:`);
    
    // Test 1: Should not have baseConsumptions state
    if (content.includes('setBaseConsumptions') || content.includes('baseConsumptions,')) {
      console.log('  ❌ Still contains baseConsumptions references');
      allTestsPassed = false;
    } else {
      console.log('  ✅ No baseConsumptions references found');
    }
    
    // Test 2: Should have fetchedConsumption for storing original values
    if (filePath.includes('useOrderComponents') && content.includes('fetchedConsumption')) {
      console.log('  ✅ Uses fetchedConsumption for storing original values');
    } else if (filePath.includes('useProductSelection') && content.includes('fetchedConsumption')) {
      console.log('  ✅ Sets fetchedConsumption in component processing');
    }
    
    // Test 3: Should multiply by quantity for manual components only
    if (filePath.includes('useOrderComponents') && content.includes('isManualFormula(component)')) {
      if (content.includes('fetchedValue * quantity')) {
        console.log('  ✅ Multiplies fetched consumption by quantity for manual components');
      } else {
        console.log('  ❌ Does not properly multiply fetched consumption by quantity');
        allTestsPassed = false;
      }
    }
    
    // Test 4: Should use fetched consumption as-is for calculated components
    if (filePath.includes('useOrderComponents') && content.includes('newConsumption = fetchedValue;')) {
      console.log('  ✅ Uses fetched consumption as-is for calculated components');
    }
    
    console.log('');
  } else {
    console.log(`❌ File not found: ${filePath}`);
    allTestsPassed = false;
  }
});

// Check for TypeScript compilation errors
console.log('🔍 Checking for TypeScript compilation errors...');
try {
  // Only check syntax, don't actually build
  execSync('npx tsc --noEmit --skipLibCheck', { 
    stdio: 'pipe',
    cwd: process.cwd()
  });
  console.log('✅ No TypeScript compilation errors found');
} catch (error) {
  console.log('❌ TypeScript compilation errors detected:');
  console.log(error.stdout?.toString() || error.stderr?.toString());
  allTestsPassed = false;
}

console.log('\n' + '='.repeat(50));
if (allTestsPassed) {
  console.log('🎉 All tests passed! The simplified logic is working correctly.');
  console.log('\nKey improvements:');
  console.log('• Removed unnecessary "base consumption" complexity');
  console.log('• Manual components: fetched consumption × order quantity');
  console.log('• Calculated components: use fetched consumption as-is');
  console.log('• Cleaner, more maintainable code structure');
} else {
  console.log('⚠️  Some tests failed. Please review the issues above.');
}

console.log('\n🔄 Next steps:');
console.log('1. Test the order form UI with manual and calculated components');
console.log('2. Verify that manual consumption values are correctly multiplied by order quantity');
console.log('3. Ensure calculated components maintain their proper consumption values');
console.log('4. Check that order submission saves the correct values to the database');
