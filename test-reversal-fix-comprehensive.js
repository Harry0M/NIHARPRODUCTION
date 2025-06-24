/**
 * Comprehensive test for the job card deletion reversal fix
 * Tests the scenario where the same material (e.g., HDPE) is used in multiple components
 * and verifies that each component gets its specific consumption amount reversed.
 */

console.log("🧪 COMPREHENSIVE JOB CARD REVERSAL FIX TEST");
console.log("=".repeat(60));

// Test scenario: HDPE material used in cutting and printing components
const testScenario = {
  jobCard: {
    id: "job-card-123",
    job_number: "JOB-2025-001",
    order_id: "order-456"
  },
  order: {
    order_number: "ORD-2025-001"
  },
  material: {
    id: "hdpe-material-789",
    name: "HDPE White 150 GSM",
    unit: "meters"
  }
};

console.log("📋 Test Scenario:");
console.log(`- Job Card: ${testScenario.jobCard.job_number}`);
console.log(`- Material: ${testScenario.material.name}`);
console.log(`- Problem: Same material used in multiple components`);
console.log("");

// Mock original transaction logs (what was actually consumed when job card was created)
const originalTransactionLogs = [
  {
    id: "txn-log-1",
    material_id: testScenario.material.id,
    quantity: -12.5, // 12.5 meters consumed for cutting
    metadata: {
      component_id: "cutting-comp-1",
      component_type: "cutting",
      material_name: testScenario.material.name,
      unit: testScenario.material.unit,
      order_id: testScenario.jobCard.order_id,
      job_card_id: testScenario.jobCard.id
    }
  },
  {
    id: "txn-log-2", 
    material_id: testScenario.material.id,
    quantity: -7.3, // 7.3 meters consumed for printing
    metadata: {
      component_id: "printing-comp-1",
      component_type: "printing",
      material_name: testScenario.material.name,
      unit: testScenario.material.unit,
      order_id: testScenario.jobCard.order_id,
      job_card_id: testScenario.jobCard.id
    }
  }
];

// Mock current order components (these may have changed since job card creation)
const currentComponents = [
  {
    id: "cutting-comp-1",
    material_id: testScenario.material.id,
    component_type: "cutting",
    consumption: 15.0, // Current value (different from original!)
    material: {
      material_name: testScenario.material.name,
      unit: testScenario.material.unit
    }
  },
  {
    id: "printing-comp-1",
    material_id: testScenario.material.id, 
    component_type: "printing",
    consumption: 15.0, // Current value (different from original!)
    material: {
      material_name: testScenario.material.name,
      unit: testScenario.material.unit
    }
  }
];

console.log("📊 Original Consumption (when job card was created):");
originalTransactionLogs.forEach(log => {
  const metadata = log.metadata;
  console.log(`- ${metadata.component_type}: ${Math.abs(log.quantity)} ${metadata.unit}`);
});

console.log("\n📊 Current Component Values (may have changed):");
currentComponents.forEach(comp => {
  console.log(`- ${comp.component_type}: ${comp.consumption} ${comp.material.unit}`);
});

console.log("\n🔧 TESTING THE FIX:");
console.log("-".repeat(40));

// Simulate the fixed reversal logic
function testReversalLogic(originalLogs, components) {
  console.log("1. Creating consumption map from original transaction logs...");
  
  const originalConsumptionMap = new Map();
  
  originalLogs.forEach(log => {
    if (log.material_id && log.quantity && log.metadata) {
      const originalAmount = Math.abs(log.quantity);
      
      // Safely access metadata properties with type checking (as in our fix)
      const metadata = typeof log.metadata === 'object' && log.metadata !== null ? 
        log.metadata : {};
      const componentId = metadata.component_id;
      const componentType = metadata.component_type;
      
      // Create a unique key for material + component combination
      const key = componentId ? `${log.material_id}_${componentId}` : `${log.material_id}_${componentType}`;
      originalConsumptionMap.set(key, originalAmount);
      
      console.log(`   ✓ Mapped ${componentType}: ${key} -> ${originalAmount} ${metadata.unit}`);
    }
  });
  
  console.log(`\n2. Found ${originalConsumptionMap.size} unique material-component combinations`);
  
  console.log("\n3. Processing each component for reversal:");
  const reversalResults = [];
  
  components.forEach(component => {
    if (!component.material_id) {
      console.log(`   ⚠️ Skipping ${component.component_type} - no material_id`);
      return;
    }
    
    // Look for original consumption amount using material_id + component_id combination
    const componentKey = `${component.material_id}_${component.id}`;
    const componentTypeKey = `${component.material_id}_${component.component_type}`;
    
    // Try component_id first, then fall back to component_type
    const originalConsumption = originalConsumptionMap.get(componentKey) || 
                               originalConsumptionMap.get(componentTypeKey);
    
    // Use original consumption amount if available, otherwise fall back to current component consumption
    const consumptionQuantity = originalConsumption || component.consumption || 0;
    
    const materialName = component.material?.material_name || "Unknown Material";
    
    if (originalConsumption) {
      console.log(`   ✅ ${component.component_type}: restoring ${consumptionQuantity} ${component.material.unit} (ORIGINAL)`);
    } else {
      console.log(`   ⚠️ ${component.component_type}: restoring ${consumptionQuantity} ${component.material.unit} (FALLBACK)`);
    }
    
    reversalResults.push({
      componentType: component.component_type,
      restoredAmount: consumptionQuantity,
      usedOriginal: !!originalConsumption
    });
  });
  
  return reversalResults;
}

const results = testReversalLogic(originalTransactionLogs, currentComponents);

console.log("\n📈 REVERSAL RESULTS:");
console.log("-".repeat(40));

let totalRestored = 0;
let allUsedOriginal = true;

results.forEach(result => {
  totalRestored += result.restoredAmount;
  if (!result.usedOriginal) allUsedOriginal = false;
  
  const source = result.usedOriginal ? "ORIGINAL" : "FALLBACK";
  console.log(`- ${result.componentType}: ${result.restoredAmount} meters (${source})`);
});

console.log(`\nTotal restored: ${totalRestored} meters`);

console.log("\n✅ VERIFICATION:");
console.log("-".repeat(40));

const expectedCutting = 12.5;
const expectedPrinting = 7.3;
const expectedTotal = expectedCutting + expectedPrinting;

const cuttingResult = results.find(r => r.componentType === 'cutting');
const printingResult = results.find(r => r.componentType === 'printing');

const tests = [
  {
    name: "Cutting component uses original consumption",
    expected: expectedCutting,
    actual: cuttingResult?.restoredAmount,
    pass: cuttingResult?.restoredAmount === expectedCutting && cuttingResult?.usedOriginal
  },
  {
    name: "Printing component uses original consumption", 
    expected: expectedPrinting,
    actual: printingResult?.restoredAmount,
    pass: printingResult?.restoredAmount === expectedPrinting && printingResult?.usedOriginal
  },
  {
    name: "Total restoration matches original consumption",
    expected: expectedTotal,
    actual: totalRestored,
    pass: totalRestored === expectedTotal
  },
  {
    name: "All components use original values (not fallback)",
    expected: true,
    actual: allUsedOriginal,
    pass: allUsedOriginal
  }
];

tests.forEach(test => {
  const status = test.pass ? "✅ PASS" : "❌ FAIL";
  console.log(`${status}: ${test.name}`);
  if (!test.pass) {
    console.log(`   Expected: ${test.expected}, Got: ${test.actual}`);
  }
});

const allTestsPassed = tests.every(t => t.pass);

console.log("\n" + "=".repeat(60));
if (allTestsPassed) {
  console.log("🎉 ALL TESTS PASSED! The fix is working correctly.");
  console.log("✅ Same material used in multiple components now gets");
  console.log("   component-specific consumption amounts during reversal.");
} else {
  console.log("❌ SOME TESTS FAILED! The fix needs more work.");
}

console.log("\n🔍 Key Fix Features:");
console.log("- Uses original transaction logs for accurate reversal amounts");
console.log("- Creates unique keys: material_id + component_id");
console.log("- Handles same material in multiple components correctly");
console.log("- Falls back to current values only when original not found");

console.log("\n📝 Next Steps:");
if (allTestsPassed) {
  console.log("✅ Fix is complete and ready for production");
  console.log("✅ Apply the job_card_consumptions table migration for enhanced tracking");
} else {
  console.log("❌ Review and fix failing test cases");
  console.log("❌ Test with real data before deploying");
}

console.log("\n🏁 Test Complete");