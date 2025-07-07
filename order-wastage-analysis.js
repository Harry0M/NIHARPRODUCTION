/**
 * Order Wastage Analysis - Manual Database Setup and Testing Script
 * 
 * This script helps set up wastage data in the orders table and test the
 * wastage analysis functionality on the orders page.
 */

console.log('🎯 Order Wastage Analysis Setup\n');

// Instructions for manually adding wastage columns to the orders table
console.log('📊 Database Setup Instructions:');
console.log('================================');
console.log('If the wastage columns don\'t exist in your orders table, run these SQL commands:');
console.log('');
console.log('-- Add wastage percentage and cost columns to orders table');
console.log('ALTER TABLE public.orders');
console.log('ADD COLUMN IF NOT EXISTS wastage_percentage NUMERIC(5,2) DEFAULT 5.0 CHECK (wastage_percentage >= 0 AND wastage_percentage <= 100),');
console.log('ADD COLUMN IF NOT EXISTS wastage_cost NUMERIC(12,2) DEFAULT 0.0 CHECK (wastage_cost >= 0);');
console.log('');
console.log('-- Add comments for documentation');
console.log('COMMENT ON COLUMN public.orders.wastage_percentage IS \'Percentage of material cost added as wastage (0-100%)\';');
console.log('COMMENT ON COLUMN public.orders.wastage_cost IS \'Calculated wastage cost based on wastage_percentage and material_cost\';');
console.log('');

// Sample data update script
console.log('🔧 Sample Data Update:');
console.log('======================');
console.log('-- Update existing orders with sample wastage data');
console.log('UPDATE public.orders SET');
console.log('  wastage_percentage = 5.0 + (RANDOM() * 10.0), -- Random between 5-15%');
console.log('  wastage_cost = (COALESCE(material_cost, 0) * (5.0 + (RANDOM() * 10.0)) / 100)');
console.log('WHERE wastage_percentage IS NULL OR wastage_cost IS NULL;');
console.log('');

// Features added to the orders analysis page
console.log('✨ Features Added to Orders Analysis Page:');
console.log('=========================================');
console.log('• 📈 Total Wastage Cost overview card');
console.log('• 🔢 Average Wastage Percentage display');
console.log('• 🏷️  Wastage badges on order list items');
console.log('• 📊 Wastage section in order detail view');
console.log('• 💰 Wastage cost breakdown in cost structure');
console.log('• 📋 Wastage data included in CSV/PDF exports');
console.log('• 🎨 Color-coded wastage indicators');
console.log('');

// How to test the functionality
console.log('🧪 Testing the Wastage Analysis:');
console.log('================================');
console.log('1. Navigate to http://localhost:8087/analysis/orders');
console.log('2. Look for the "Total Wastage" card in the overview section');
console.log('3. Check for orange "W: X.X%" badges on order items');
console.log('4. Click on any order to see detailed wastage information');
console.log('5. In the order detail, check the "Cost Structure" tab');
console.log('6. Export data to CSV/PDF to verify wastage fields are included');
console.log('');

// Customization options
console.log('⚙️ Customization Options:');
console.log('=========================');
console.log('• Adjust default wastage percentage (currently 5%)');
console.log('• Modify wastage calculation logic');
console.log('• Change color scheme for wastage indicators');
console.log('• Add wastage trend analysis over time');
console.log('• Include wastage alerts for high percentages');
console.log('');

// Default wastage calculation for orders without database columns
function calculateDefaultWastage(materialCost, wastagePercentage = 0.0) {
  return (materialCost * wastagePercentage) / 100;
}

// Sample usage
const sampleOrder = {
  material_cost: 1000,
  wastage_percentage: 7.5
};

const calculatedWastage = calculateDefaultWastage(sampleOrder.material_cost, sampleOrder.wastage_percentage);

console.log('💡 Example Calculation:');
console.log(`Material Cost: ₹${sampleOrder.material_cost}`);
console.log(`Wastage Percentage: ${sampleOrder.wastage_percentage}%`);
console.log(`Calculated Wastage Cost: ₹${calculatedWastage.toFixed(2)}`);
console.log('');

console.log('🚀 Order Wastage Analysis is now ready!');
console.log('Navigate to the orders analysis page to see the new wastage features.');
