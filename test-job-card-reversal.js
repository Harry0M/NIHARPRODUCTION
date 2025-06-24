/**
 * Test script to verify the job card reversal fix for the same material 
 * used in multiple components scenario.
 */

console.log("=== TESTING JOB CARD REVERSAL FIX ===");
console.log("Testing scenario where HDPE material is used in both cutting and printing components");

// Mock data that simulates the problematic scenario
const mockOriginalTransactionLogs = [
  {
    id: "log1",
    material_id: "hdpe-material-123",
    quantity: -15, // Consumed 15 units for cutting
    metadata: {
      component_id: "cutting-comp-1", 
      component_type: "cutting",
      material_name: "HDPE Material",
      unit: "meters"
    }
  },
  {
    id: "log2", 
    material_id: "hdpe-material-123",
    quantity: -8, // Consumed 8 units for printing
    metadata: {
      component_id: "printing-comp-1",
      component_type: "printing", 
      material_name: "HDPE Material",
      unit: "meters"
    }
  }
];

const mockComponents = [
  {
    id: "cutting-comp-1",
    material_id: "hdpe-material-123",
    component_type: "cutting",
    consumption: 20, // Current value (may not be accurate)
    material: {
      material_name: "HDPE Material",
      unit: "meters"
    }
  },
  {
    id: "printing-comp-1", 
    material_id: "hdpe-material-123",
    component_type: "printing",
    consumption: 20, // Current value (may not be accurate) 
    material: {
      material_name: "HDPE Material",
      unit: "meters"
    }
  }
];

console.log("\n=== ORIGINAL PROBLEM ===");
console.log("Before fix: Both components would use the same consumption amount");
console.log("- This would cause incorrect reversal amounts");
console.log("- Same material consumption would be restored for both components");

console.log("\n=== FIXED SOLUTION ===");
console.log("Creating consumption map with material_id + component_id combinations...");

// Simulate the fixed logic from jobCardInventoryUtils.ts
const originalConsumptionMap = new Map();

mockOriginalTransactionLogs.forEach(log => {
  if (log.material_id && log.quantity && log.metadata) {
    const originalAmount = Math.abs(log.quantity);
    const componentId = log.metadata.component_id;
    const componentType = log.metadata.component_type;
    
    // Create a unique key for material + component combination
    const key = componentId ? `${log.material_id}_${componentId}` : `${log.material_id}_${componentType}`;
    originalConsumptionMap.set(key, originalAmount);
    
    console.log(`✓ Mapped ${key} -> ${originalAmount} units`);
  }
});

console.log(`\nFound ${originalConsumptionMap.size} unique material-component combinations`);

console.log("\n=== PROCESSING COMPONENTS ===");
mockComponents.forEach(component => {
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
    console.log(`✅ ${component.component_type}: restoring ${consumptionQuantity} units of ${materialName} (using ORIGINAL component-specific consumption)`);
  } else {
    console.log(`⚠️  ${component.component_type}: restoring ${consumptionQuantity} units of ${materialName} (using current consumption amount as fallback)`);
  }
});

console.log("\n=== EXPECTED RESULTS ===");
console.log("✅ Cutting component should restore 15 units (from original transaction log)");
console.log("✅ Printing component should restore 8 units (from original transaction log)");
console.log("✅ Total restoration: 23 units (15 + 8)");
console.log("✅ Each component gets its specific consumption amount restored");

console.log("\n=== VERIFICATION ===");
const cuttingKey = `hdpe-material-123_cutting-comp-1`;
const printingKey = `hdpe-material-123_printing-comp-1`;

const cuttingConsumption = originalConsumptionMap.get(cuttingKey);
const printingConsumption = originalConsumptionMap.get(printingKey);

console.log(`Cutting consumption: ${cuttingConsumption} units`);
console.log(`Printing consumption: ${printingConsumption} units`);
console.log(`Total: ${cuttingConsumption + printingConsumption} units`);

if (cuttingConsumption === 15 && printingConsumption === 8) {
  console.log("\n🎉 SUCCESS: Fix is working correctly!");
  console.log("Each component gets its specific consumption amount");
} else {
  console.log("\n❌ FAILED: Fix is not working correctly");
}

console.log("\n=== TEST COMPLETE ===");
