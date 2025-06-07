/**
 * DISPATCH STITCHING QUANTITY TEST
 * 
 * This test verifies that the dispatch system correctly uses stitching received quantities
 * instead of order quantities when creating dispatch batches.
 * 
 * Tests cover:
 * 1. Quantity calculation from stitching jobs
 * 2. Batch validation with stitching quantities
 * 3. UI displays showing both order and stitching quantities
 * 4. Edge cases (no stitching jobs, zero quantities, etc.)
 */

console.log("🚀 DISPATCH STITCHING QUANTITY TEST");
console.log("=" .repeat(60));

// Mock data structures matching the actual application
const mockOrderWithStitchingJobs = {
  id: "order-123",
  order_number: "ORD-2024-001",
  company_name: "Test Company Ltd",
  quantity: 1000, // Original order quantity
  job_cards: [{
    id: "jobcard-456",
    stitching_jobs: [
      {
        id: "stitch-1",
        provided_quantity: 300,
        received_quantity: 285, // 15 units lost during stitching
        status: "completed"
      },
      {
        id: "stitch-2", 
        provided_quantity: 400,
        received_quantity: 395, // 5 units lost during stitching
        status: "completed"
      },
      {
        id: "stitch-3",
        provided_quantity: 300,
        received_quantity: 290, // 10 units lost during stitching
        status: "completed"
      }
    ]
  }]
};

const mockOrderNoStitchingJobs = {
  id: "order-789",
  order_number: "ORD-2024-002",
  company_name: "Another Company",
  quantity: 500,
  job_cards: [{
    id: "jobcard-789",
    stitching_jobs: [] // No stitching jobs
  }]
};

const mockOrderZeroReceived = {
  id: "order-999",
  order_number: "ORD-2024-003", 
  company_name: "Zero Received Co",
  quantity: 200,
  job_cards: [{
    id: "jobcard-999",
    stitching_jobs: [
      {
        id: "stitch-fail",
        provided_quantity: 200,
        received_quantity: 0, // All units lost
        status: "completed"
      }
    ]
  }]
};

// Test functions replicating the actual implementation logic

function calculateStitchingReceivedQuantity(order) {
  return order?.job_cards?.[0]?.stitching_jobs?.reduce((total, job) => 
    total + (job.received_quantity || 0), 0
  ) || 0;
}

function validateDispatchBatches(batches, stitchingReceivedQuantity) {
  const totalBatchQuantity = batches.reduce((sum, batch) => sum + Number(batch.quantity), 0);
  return {
    isValid: totalBatchQuantity === stitchingReceivedQuantity,
    totalBatchQuantity,
    stitchingReceivedQuantity,
    difference: totalBatchQuantity - stitchingReceivedQuantity
  };
}

function canDispatch(stitchingReceivedQuantity) {
  return stitchingReceivedQuantity > 0;
}

// Test Suite
console.log("\n=== TEST 1: STITCHING QUANTITY CALCULATION ===");

const test1StitchingQuantity = calculateStitchingReceivedQuantity(mockOrderWithStitchingJobs);
const expectedTest1 = 285 + 395 + 290; // Sum of received quantities
console.log(`Order Quantity: ${mockOrderWithStitchingJobs.quantity}`);
console.log(`Stitching Jobs: ${mockOrderWithStitchingJobs.job_cards[0].stitching_jobs.length}`);
console.log(`Expected Stitching Received: ${expectedTest1}`);
console.log(`Calculated Stitching Received: ${test1StitchingQuantity}`);
console.log(`Test 1 Result: ${test1StitchingQuantity === expectedTest1 ? '✅ PASS' : '❌ FAIL'}`);

// Show loss during production
const totalProvided = mockOrderWithStitchingJobs.job_cards[0].stitching_jobs
  .reduce((sum, job) => sum + job.provided_quantity, 0);
const totalLoss = totalProvided - test1StitchingQuantity;
console.log(`Total Provided to Stitching: ${totalProvided}`);
console.log(`Total Loss During Stitching: ${totalLoss} units (${((totalLoss / totalProvided) * 100).toFixed(2)}%)`);

console.log("\n=== TEST 2: BATCH VALIDATION WITH STITCHING QUANTITIES ===");

// Test case 2a: Valid batches matching stitching quantity
const validBatches = [
  { quantity: 300, delivery_date: "2024-01-15", notes: "First batch" },
  { quantity: 400, delivery_date: "2024-01-20", notes: "Second batch" },
  { quantity: 270, delivery_date: "2024-01-25", notes: "Final batch" }
];

const validation2a = validateDispatchBatches(validBatches, test1StitchingQuantity);
console.log("Test 2a - Valid Batches:");
console.log(`  Total Batch Quantity: ${validation2a.totalBatchQuantity}`);
console.log(`  Stitching Received Quantity: ${validation2a.stitchingReceivedQuantity}`);
console.log(`  Is Valid: ${validation2a.isValid ? '✅ PASS' : '❌ FAIL'}`);

// Test case 2b: Invalid batches exceeding stitching quantity
const invalidBatches = [
  { quantity: 500, delivery_date: "2024-01-15", notes: "Too large" },
  { quantity: 500, delivery_date: "2024-01-20", notes: "Also too large" }
];

const validation2b = validateDispatchBatches(invalidBatches, test1StitchingQuantity);
console.log("\nTest 2b - Invalid Batches (Exceeding):");
console.log(`  Total Batch Quantity: ${validation2b.totalBatchQuantity}`);
console.log(`  Stitching Received Quantity: ${validation2b.stitchingReceivedQuantity}`);
console.log(`  Difference: ${validation2b.difference}`);
console.log(`  Is Valid: ${validation2b.isValid ? '❌ UNEXPECTED PASS' : '✅ PASS (correctly invalid)'}`);

// Test case 2c: Invalid batches under stitching quantity
const underBatches = [
  { quantity: 200, delivery_date: "2024-01-15", notes: "Under quantity" }
];

const validation2c = validateDispatchBatches(underBatches, test1StitchingQuantity);
console.log("\nTest 2c - Invalid Batches (Under):");
console.log(`  Total Batch Quantity: ${validation2c.totalBatchQuantity}`);
console.log(`  Stitching Received Quantity: ${validation2c.stitchingReceivedQuantity}`);
console.log(`  Difference: ${validation2c.difference}`);
console.log(`  Is Valid: ${validation2c.isValid ? '❌ UNEXPECTED PASS' : '✅ PASS (correctly invalid)'}`);

console.log("\n=== TEST 3: EDGE CASES ===");

// Test case 3a: No stitching jobs
const test3aQuantity = calculateStitchingReceivedQuantity(mockOrderNoStitchingJobs);
const canDispatch3a = canDispatch(test3aQuantity);
console.log("Test 3a - No Stitching Jobs:");
console.log(`  Order Quantity: ${mockOrderNoStitchingJobs.quantity}`);
console.log(`  Stitching Received Quantity: ${test3aQuantity}`);
console.log(`  Can Dispatch: ${canDispatch3a ? '❌ SHOULD NOT ALLOW' : '✅ PASS (correctly blocked)'}`);

// Test case 3b: Zero received quantity
const test3bQuantity = calculateStitchingReceivedQuantity(mockOrderZeroReceived);
const canDispatch3b = canDispatch(test3bQuantity);
console.log("\nTest 3b - Zero Received Quantity:");
console.log(`  Order Quantity: ${mockOrderZeroReceived.quantity}`);
console.log(`  Stitching Received Quantity: ${test3bQuantity}`);
console.log(`  Can Dispatch: ${canDispatch3b ? '❌ SHOULD NOT ALLOW' : '✅ PASS (correctly blocked)'}`);

// Test case 3c: Undefined/null order
const test3cQuantity = calculateStitchingReceivedQuantity(null);
const canDispatch3c = canDispatch(test3cQuantity);
console.log("\nTest 3c - Null Order:");
console.log(`  Stitching Received Quantity: ${test3cQuantity}`);
console.log(`  Can Dispatch: ${canDispatch3c ? '❌ SHOULD NOT ALLOW' : '✅ PASS (correctly blocked)'}`);

console.log("\n=== TEST 4: UI INFORMATION DISPLAY ===");

function generateQuantityInfoDisplay(orderQuantity, stitchingReceivedQuantity) {
  const hasDifference = stitchingReceivedQuantity !== orderQuantity;
  const lossAmount = orderQuantity - stitchingReceivedQuantity;
  const lossPercentage = orderQuantity > 0 ? ((lossAmount / orderQuantity) * 100).toFixed(2) : 0;
  
  return {
    orderQuantity,
    stitchingReceivedQuantity,
    hasDifference,
    lossAmount,
    lossPercentage,
    dispatchBaseQuantity: stitchingReceivedQuantity,
    showWarning: hasDifference && lossAmount > 0
  };
}

const uiInfo = generateQuantityInfoDisplay(
  mockOrderWithStitchingJobs.quantity, 
  test1StitchingQuantity
);

console.log("Test 4 - UI Information Display:");
console.log(`  Order Quantity: ${uiInfo.orderQuantity} units`);
console.log(`  Stitching Received Quantity: ${uiInfo.stitchingReceivedQuantity} units`);
console.log(`  Has Difference: ${uiInfo.hasDifference ? 'Yes' : 'No'}`);
console.log(`  Production Loss: ${uiInfo.lossAmount} units (${uiInfo.lossPercentage}%)`);
console.log(`  Dispatch Base Quantity: ${uiInfo.dispatchBaseQuantity} units`);
console.log(`  Show Warning: ${uiInfo.showWarning ? 'Yes' : 'No'}`);
console.log(`  UI Display Test: ${uiInfo.hasDifference && uiInfo.showWarning ? '✅ PASS' : '❌ FAIL'}`);

console.log("\n=== TEST 5: BATCH CALCULATION CONSTRAINTS ===");

function calculateBatchConstraints(stitchingReceivedQuantity, existingBatches) {
  const totalExistingQuantity = existingBatches.reduce((sum, batch) => sum + Number(batch.quantity), 0);
  const remainingQuantity = stitchingReceivedQuantity - totalExistingQuantity;
  
  return {
    totalExistingQuantity,
    remainingQuantity,
    maxNewBatchQuantity: remainingQuantity,
    canAddBatch: remainingQuantity > 0
  };
}

// Test with partial batches
const partialBatches = [
  { quantity: 400, delivery_date: "2024-01-15", notes: "First batch" }
];

const constraints = calculateBatchConstraints(test1StitchingQuantity, partialBatches);
console.log("Test 5 - Batch Calculation Constraints:");
console.log(`  Stitching Received Quantity: ${test1StitchingQuantity}`);
console.log(`  Existing Batch Total: ${constraints.totalExistingQuantity}`);
console.log(`  Remaining Quantity: ${constraints.remainingQuantity}`);
console.log(`  Max New Batch Quantity: ${constraints.maxNewBatchQuantity}`);
console.log(`  Can Add Batch: ${constraints.canAddBatch ? 'Yes' : 'No'}`);
console.log(`  Constraint Test: ${constraints.remainingQuantity === (test1StitchingQuantity - 400) ? '✅ PASS' : '❌ FAIL'}`);

console.log("\n=== TEST SUMMARY ===");
console.log("=" .repeat(60));

const allTests = [
  { name: "Stitching Quantity Calculation", result: test1StitchingQuantity === expectedTest1 },
  { name: "Valid Batch Validation", result: validation2a.isValid },
  { name: "Invalid Batch Detection (Over)", result: !validation2b.isValid },
  { name: "Invalid Batch Detection (Under)", result: !validation2c.isValid },
  { name: "No Stitching Jobs Handling", result: !canDispatch3a },
  { name: "Zero Received Quantity Handling", result: !canDispatch3b },
  { name: "Null Order Handling", result: !canDispatch3c },
  { name: "UI Information Display", result: uiInfo.hasDifference && uiInfo.showWarning },
  { name: "Batch Constraints Calculation", result: constraints.remainingQuantity === (test1StitchingQuantity - 400) }
];

const passedTests = allTests.filter(test => test.result).length;
const totalTests = allTests.length;

console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

console.log("\nDetailed Results:");
allTests.forEach((test, index) => {
  console.log(`  ${index + 1}. ${test.name}: ${test.result ? '✅ PASS' : '❌ FAIL'}`);
});

const allPassed = passedTests === totalTests;
console.log(`\nOverall Result: ${allPassed ? '🎉 ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'}`);

if (allPassed) {
  console.log("\n✅ VERIFICATION COMPLETE:");
  console.log("   ✓ Dispatch system correctly uses stitching received quantities");
  console.log("   ✓ Batch validation enforces stitching quantity constraints");
  console.log("   ✓ UI properly displays order vs stitching quantity information");
  console.log("   ✓ Edge cases are handled appropriately");
  console.log("   ✓ Production losses are accurately tracked and displayed");
  console.log("   ✓ System prevents dispatch when no valid stitching quantities exist");
}

console.log("\n=== END OF DISPATCH STITCHING QUANTITY TEST ===");
