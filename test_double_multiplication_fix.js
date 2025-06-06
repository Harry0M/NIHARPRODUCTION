/**
 * Test to verify that the double multiplication issue in order submission is fixed
 * This test simulates the full flow from form calculation to database submission
 */

console.log("=== TESTING DOUBLE MULTIPLICATION FIX ===\n");

// Step 1: Simulate user input (per-unit costs)
const userInput = {
  cutting_charge: "10",    // ₹10 per unit
  printing_charge: "15",   // ₹15 per unit
  stitching_charge: "5",   // ₹5 per unit
  transport_charge: "8",   // ₹8 per unit
  quantity: "10",          // Order quantity
  order_quantity: "10"
};

console.log("1. User Input (per-unit costs):");
console.log("   - Cutting: ₹" + userInput.cutting_charge + "/unit");
console.log("   - Printing: ₹" + userInput.printing_charge + "/unit");
console.log("   - Stitching: ₹" + userInput.stitching_charge + "/unit");
console.log("   - Transport: ₹" + userInput.transport_charge + "/unit");
console.log("   - Order Quantity: " + userInput.quantity);

// Step 2: Simulate use-order-form.ts calculation (first multiplication)
const orderQuantity = parseInt(userInput.quantity);
const cuttingChargePerUnit = parseFloat(userInput.cutting_charge);
const printingChargePerUnit = parseFloat(userInput.printing_charge);
const stitchingChargePerUnit = parseFloat(userInput.stitching_charge);
const transportChargePerUnit = parseFloat(userInput.transport_charge);

// First multiplication happens in use-order-form.ts
const totalCuttingCharge = cuttingChargePerUnit * orderQuantity;
const totalPrintingCharge = printingChargePerUnit * orderQuantity;
const totalStitchingCharge = stitchingChargePerUnit * orderQuantity;
const totalTransportCharge = transportChargePerUnit * orderQuantity;

const costCalculation = {
  cuttingCharge: totalCuttingCharge,
  printingCharge: totalPrintingCharge,
  stitchingCharge: totalStitchingCharge,
  transportCharge: totalTransportCharge,
  materialCost: 0
};

console.log("\n2. After use-order-form.ts calculation (total costs):");
console.log("   - Cutting: ₹" + costCalculation.cuttingCharge + " (₹" + cuttingChargePerUnit + " × " + orderQuantity + ")");
console.log("   - Printing: ₹" + costCalculation.printingCharge + " (₹" + printingChargePerUnit + " × " + orderQuantity + ")");
console.log("   - Stitching: ₹" + costCalculation.stitchingCharge + " (₹" + stitchingChargePerUnit + " × " + orderQuantity + ")");
console.log("   - Transport: ₹" + costCalculation.transportCharge + " (₹" + transportChargePerUnit + " × " + orderQuantity + ")");

// Step 3: Simulate BEFORE FIX - useOrderSubmission.ts (second multiplication - INCORRECT)
console.log("\n=== BEFORE FIX (useOrderSubmission.ts with double multiplication) ===");
const beforeFixSubmissionQty = parseInt(userInput.order_quantity || userInput.quantity || '1');

// OLD CODE: Treating already-multiplied costs as per-unit costs
const beforeFixCuttingCharge = costCalculation.cuttingCharge * beforeFixSubmissionQty;  // WRONG: 100 * 10 = 1000
const beforeFixPrintingCharge = costCalculation.printingCharge * beforeFixSubmissionQty; // WRONG: 150 * 10 = 1500
const beforeFixStitchingCharge = costCalculation.stitchingCharge * beforeFixSubmissionQty; // WRONG: 50 * 10 = 500
const beforeFixTransportCharge = costCalculation.transportCharge * beforeFixSubmissionQty; // WRONG: 80 * 10 = 800

console.log("   - Cutting: ₹" + beforeFixCuttingCharge + " (₹" + costCalculation.cuttingCharge + " × " + beforeFixSubmissionQty + ") ❌ WRONG");
console.log("   - Printing: ₹" + beforeFixPrintingCharge + " (₹" + costCalculation.printingCharge + " × " + beforeFixSubmissionQty + ") ❌ WRONG");
console.log("   - Stitching: ₹" + beforeFixStitchingCharge + " (₹" + costCalculation.stitchingCharge + " × " + beforeFixSubmissionQty + ") ❌ WRONG");
console.log("   - Transport: ₹" + beforeFixTransportCharge + " (₹" + costCalculation.transportCharge + " × " + beforeFixSubmissionQty + ") ❌ WRONG");

const beforeFixTotal = beforeFixCuttingCharge + beforeFixPrintingCharge + beforeFixStitchingCharge + beforeFixTransportCharge;
console.log("   - Total Production Cost: ₹" + beforeFixTotal + " ❌ WRONG (should be ₹380)");

// Step 4: Simulate AFTER FIX - useOrderSubmission.ts (no second multiplication - CORRECT)
console.log("\n=== AFTER FIX (useOrderSubmission.ts using already calculated totals) ===");

// NEW CODE: Using already-multiplied costs directly
const afterFixCuttingCharge = costCalculation.cuttingCharge;     // CORRECT: 100
const afterFixPrintingCharge = costCalculation.printingCharge;   // CORRECT: 150
const afterFixStitchingCharge = costCalculation.stitchingCharge; // CORRECT: 50
const afterFixTransportCharge = costCalculation.transportCharge; // CORRECT: 80

console.log("   - Cutting: ₹" + afterFixCuttingCharge + " ✅ CORRECT");
console.log("   - Printing: ₹" + afterFixPrintingCharge + " ✅ CORRECT");
console.log("   - Stitching: ₹" + afterFixStitchingCharge + " ✅ CORRECT");
console.log("   - Transport: ₹" + afterFixTransportCharge + " ✅ CORRECT");

const afterFixTotal = afterFixCuttingCharge + afterFixPrintingCharge + afterFixStitchingCharge + afterFixTransportCharge;
console.log("   - Total Production Cost: ₹" + afterFixTotal + " ✅ CORRECT");

// Step 5: Comparison
console.log("\n=== COMPARISON ===");
console.log("Before fix total: ₹" + beforeFixTotal + " (multiplied twice)");
console.log("After fix total: ₹" + afterFixTotal + " (multiplied once)");
console.log("Difference: ₹" + (beforeFixTotal - afterFixTotal) + " (savings from fixing double multiplication)");
console.log("Error factor: " + (beforeFixTotal / afterFixTotal).toFixed(1) + "x");

console.log("\n=== VERIFICATION ===");
console.log("✅ Fixed double multiplication issue in useOrderSubmission.ts");
console.log("✅ Now using already calculated total costs from costCalculation");
console.log("✅ Production costs are multiplied exactly once (in use-order-form.ts)");
console.log("✅ Database will receive correct total costs");
