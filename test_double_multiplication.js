/**
 * Test script to verify the double multiplication issue with manual consumption
 * This script demonstrates where manual consumption is being multiplied twice
 */

// Simulate the issue step by step
console.log("=== TESTING MANUAL CONSUMPTION DOUBLE MULTIPLICATION ===");

// Step 1: Initial manual consumption value (what user enters)
const initialManualConsumption = 5.0;
console.log("1. User enters manual consumption:", initialManualConsumption);

// Step 2: Product quantity (from catalog)  
const productQuantity = 1;
console.log("2. Product quantity:", productQuantity);

// Step 3: Order quantity (what user sets)
const orderQuantity = 10;
console.log("3. Order quantity:", orderQuantity);

// Current issue: Manual consumption gets multiplied twice

console.log("\n=== CURRENT PROBLEMATIC FLOW ===");

// First multiplication in useOrderComponents.ts (line 143)
const afterFirstMultiplication = initialManualConsumption * orderQuantity;
console.log("4a. First multiplication (useOrderComponents):", afterFirstMultiplication);

// Second multiplication in useOrderSubmission.ts (line 251) 
const afterSecondMultiplication = afterFirstMultiplication * orderQuantity;
console.log("4b. Second multiplication (useOrderSubmission):", afterSecondMultiplication);

console.log("\n=== EXPECTED VS ACTUAL ===");
console.log("Expected final consumption:", initialManualConsumption * orderQuantity);
console.log("Actual final consumption:", afterSecondMultiplication);
console.log("Multiplication factor:", afterSecondMultiplication / (initialManualConsumption * orderQuantity));

console.log("\n=== SOLUTION ===");
console.log("Remove the second multiplication in useOrderSubmission.ts");
console.log("Manual consumption should only be multiplied once by order quantity");
