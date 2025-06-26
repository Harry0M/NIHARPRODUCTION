/**
 * Debug Script for Manual Consumption Issue
 * 
 * This script helps debug the manual consumption calculation issue where:
 * - Manual consumption: 600
 * - Order quantity: 3 → Expected: 600/3 = 200 per unit, so total = 600
 * - Order quantity: 6 → Expected: 200 * 6 = 1200, but getting 100
 */

console.log('🔍 Manual Consumption Debug Test');
console.log('=================================');

// Simulate the issue scenario
const manualConsumption = 600;
const originalOrderQuantity = 3;
const newOrderQuantity = 6;

// What should happen:
const baseConsumptionPerUnit = manualConsumption / originalOrderQuantity;
const expectedNewConsumption = baseConsumptionPerUnit * newOrderQuantity;

console.log('Expected Behavior:');
console.log(`Manual consumption entered: ${manualConsumption}`);
console.log(`Original order quantity: ${originalOrderQuantity}`);
console.log(`Base consumption per unit: ${baseConsumptionPerUnit}`);
console.log(`New order quantity: ${newOrderQuantity}`);
console.log(`Expected new consumption: ${expectedNewConsumption}`);

// What's currently happening (based on user description):
const currentBehavior = manualConsumption / newOrderQuantity;
console.log('\nCurrent (Wrong) Behavior:');
console.log(`Current consumption: ${currentBehavior} (dividing original by new quantity)`);

console.log('\n🎯 The Fix:');
console.log('1. When manual consumption is entered, calculate base per unit');
console.log('2. Store this base consumption');
console.log('3. When quantity changes, multiply base by new quantity');
