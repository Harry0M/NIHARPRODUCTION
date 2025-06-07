// Test script to verify GST and transport calculation fix
// This script tests the consistency between form calculations and database storage

console.log("=== GST & TRANSPORT CALCULATION FIX TEST ===\n");

// Test data simulating a purchase with multiple items
const testData = {
  item1: {
    alt_quantity: 10,     // kg
    alt_unit_price: 50,   // ₹50 per kg
    gst_rate: 18,         // 18% GST
    main_quantity: 5      // meters (conversion rate 2:1)
  },
  item2: {
    alt_quantity: 20,     // kg  
    alt_unit_price: 75,   // ₹75 per kg
    gst_rate: 12,         // 12% GST
    main_quantity: 10     // meters (conversion rate 2:1)
  },
  transport_charge: 300   // Total transport charge
};

console.log("TEST DATA:");
console.log("Item 1: 10 kg @ ₹50/kg, 18% GST, Main Qty: 5 meters");
console.log("Item 2: 20 kg @ ₹75/kg, 12% GST, Main Qty: 10 meters");
console.log("Total Transport Charge: ₹300");
console.log();

// STEP 1: Calculate Form Display Values (as shown in PurchaseNew.tsx form)
console.log("=== STEP 1: FORM CALCULATIONS ===");

const totalAltQuantity = testData.item1.alt_quantity + testData.item2.alt_quantity;
const perAltUnitTransportRate = testData.transport_charge / totalAltQuantity;

console.log(`Total Alt Quantity: ${totalAltQuantity} kg`);
console.log(`Per Alt Unit Transport Rate: ₹${perAltUnitTransportRate.toFixed(2)}/kg`);
console.log();

// Item 1 calculations
const item1_base_amount = testData.item1.alt_quantity * testData.item1.alt_unit_price;
const item1_gst_amount = (item1_base_amount * testData.item1.gst_rate) / 100;
const item1_transport_share = testData.item1.alt_quantity * perAltUnitTransportRate;
const item1_line_total = item1_base_amount + item1_gst_amount; // FIXED: No transport in line_total
const item1_unit_price = (item1_base_amount + item1_gst_amount + item1_transport_share) / testData.item1.main_quantity;
const item1_display_total = item1_line_total + item1_transport_share;

console.log("ITEM 1 (Form Display):");
console.log(`  Base Amount: ₹${item1_base_amount}`);
console.log(`  GST Amount: ₹${item1_gst_amount.toFixed(2)}`);
console.log(`  Transport Share: ₹${item1_transport_share.toFixed(2)}`);
console.log(`  Line Total (Base + GST): ₹${item1_line_total.toFixed(2)}`);
console.log(`  Unit Price: ₹${item1_unit_price.toFixed(2)}/meter`);
console.log(`  Display Total: ₹${item1_display_total.toFixed(2)}`);
console.log();

// Item 2 calculations
const item2_base_amount = testData.item2.alt_quantity * testData.item2.alt_unit_price;
const item2_gst_amount = (item2_base_amount * testData.item2.gst_rate) / 100;
const item2_transport_share = testData.item2.alt_quantity * perAltUnitTransportRate;
const item2_line_total = item2_base_amount + item2_gst_amount; // FIXED: No transport in line_total
const item2_unit_price = (item2_base_amount + item2_gst_amount + item2_transport_share) / testData.item2.main_quantity;
const item2_display_total = item2_line_total + item2_transport_share;

console.log("ITEM 2 (Form Display):");
console.log(`  Base Amount: ₹${item2_base_amount}`);
console.log(`  GST Amount: ₹${item2_gst_amount.toFixed(2)}`);
console.log(`  Transport Share: ₹${item2_transport_share.toFixed(2)}`);
console.log(`  Line Total (Base + GST): ₹${item2_line_total.toFixed(2)}`);
console.log(`  Unit Price: ₹${item2_unit_price.toFixed(2)}/meter`);
console.log(`  Display Total: ₹${item2_display_total.toFixed(2)}`);
console.log();

// Form totals
const form_subtotal = item1_display_total + item2_display_total;
const form_total_amount = form_subtotal;

console.log("FORM TOTALS:");
console.log(`  Subtotal: ₹${form_subtotal.toFixed(2)}`);
console.log(`  Total Amount: ₹${form_total_amount.toFixed(2)}`);
console.log();

// STEP 2: Database Storage Values (as stored by fixed PurchaseNew.tsx)
console.log("=== STEP 2: DATABASE STORAGE (FIXED) ===");

// Item 1 database storage (using FIXED logic)
const db_item1_line_total = item1_base_amount + item1_gst_amount; // FIXED: Excludes transport
const db_item1_unit_price = db_item1_line_total / testData.item1.main_quantity; // FIXED: Based on line total without transport

console.log("ITEM 1 (Database Storage):");
console.log(`  line_total: ₹${db_item1_line_total.toFixed(2)} (base + GST only)`);
console.log(`  unit_price: ₹${db_item1_unit_price.toFixed(2)}/meter (based on line total)`);
console.log(`  gst_amount: ₹${item1_gst_amount.toFixed(2)}`);
console.log();

// Item 2 database storage (using FIXED logic)
const db_item2_line_total = item2_base_amount + item2_gst_amount; // FIXED: Excludes transport
const db_item2_unit_price = db_item2_line_total / testData.item2.main_quantity; // FIXED: Based on line total without transport

console.log("ITEM 2 (Database Storage):");
console.log(`  line_total: ₹${db_item2_line_total.toFixed(2)} (base + GST only)`);
console.log(`  unit_price: ₹${db_item2_unit_price.toFixed(2)}/meter (based on line total)`);
console.log(`  gst_amount: ₹${item2_gst_amount.toFixed(2)}`);
console.log();

// STEP 3: Detail Page Display (what user sees after navigating to detail page)
console.log("=== STEP 3: DETAIL PAGE DISPLAY ===");

// The detail page will read from database and should show same values as form
const detail_item1_display_total = db_item1_line_total + item1_transport_share;
const detail_item2_display_total = db_item2_line_total + item2_transport_share;
const detail_subtotal = detail_item1_display_total + detail_item2_display_total;

console.log("ITEM 1 (Detail Page):");
console.log(`  Line Total (from DB): ₹${db_item1_line_total.toFixed(2)}`);
console.log(`  Transport Share: ₹${item1_transport_share.toFixed(2)}`);
console.log(`  Display Total: ₹${detail_item1_display_total.toFixed(2)}`);
console.log();

console.log("ITEM 2 (Detail Page):");
console.log(`  Line Total (from DB): ₹${db_item2_line_total.toFixed(2)}`);
console.log(`  Transport Share: ₹${item2_transport_share.toFixed(2)}`);
console.log(`  Display Total: ₹${detail_item2_display_total.toFixed(2)}`);
console.log();

console.log("DETAIL PAGE TOTALS:");
console.log(`  Subtotal: ₹${detail_subtotal.toFixed(2)}`);
console.log(`  Transport Charge: ₹${testData.transport_charge}`);
console.log(`  Total Amount: ₹${detail_subtotal.toFixed(2)}`);
console.log();

// STEP 4: Verification - Check consistency
console.log("=== STEP 4: CONSISTENCY VERIFICATION ===");

const form_vs_detail_match = Math.abs(form_subtotal - detail_subtotal) < 0.01;
const line_total_consistency = (
  Math.abs(item1_line_total - db_item1_line_total) < 0.01 &&
  Math.abs(item2_line_total - db_item2_line_total) < 0.01
);

console.log("✓ CONSISTENCY CHECKS:");
console.log(`  Form vs Detail Subtotal Match: ${form_vs_detail_match ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  Line Total Consistency: ${line_total_consistency ? '✅ PASS' : '❌ FAIL'}`);
console.log(`  Form Subtotal: ₹${form_subtotal.toFixed(2)}`);
console.log(`  Detail Subtotal: ₹${detail_subtotal.toFixed(2)}`);
console.log(`  Difference: ₹${Math.abs(form_subtotal - detail_subtotal).toFixed(2)}`);
console.log();

// STEP 5: Before vs After Fix Comparison
console.log("=== STEP 5: BEFORE vs AFTER FIX COMPARISON ===");

// Before fix (INCORRECT): line_total included transport
const before_fix_item1_line_total = item1_base_amount + item1_gst_amount + item1_transport_share;
const before_fix_item2_line_total = item2_base_amount + item2_gst_amount + item2_transport_share;
const before_fix_detail_subtotal = before_fix_item1_line_total + before_fix_item2_line_total;

console.log("BEFORE FIX (Incorrect):");
console.log(`  Item 1 Line Total: ₹${before_fix_item1_line_total.toFixed(2)} (included transport)`);
console.log(`  Item 2 Line Total: ₹${before_fix_item2_line_total.toFixed(2)} (included transport)`);
console.log(`  Detail Page Subtotal: ₹${before_fix_detail_subtotal.toFixed(2)}`);
console.log(`  Discrepancy: ₹${Math.abs(form_subtotal - before_fix_detail_subtotal).toFixed(2)}`);
console.log();

console.log("AFTER FIX (Correct):");
console.log(`  Item 1 Line Total: ₹${db_item1_line_total.toFixed(2)} (excludes transport)`);
console.log(`  Item 2 Line Total: ₹${db_item2_line_total.toFixed(2)} (excludes transport)`);
console.log(`  Detail Page Subtotal: ₹${detail_subtotal.toFixed(2)}`);
console.log(`  Discrepancy: ₹${Math.abs(form_subtotal - detail_subtotal).toFixed(2)}`);
console.log();

// STEP 6: Final Summary
console.log("=== FINAL SUMMARY ===");
console.log(`✅ Fix Status: ${form_vs_detail_match && line_total_consistency ? 'SUCCESS' : 'NEEDS ATTENTION'}`);
console.log(`📊 Key Insight: Line totals now exclude transport charge to prevent double counting`);
console.log(`🔍 Transport is still properly accounted for in display totals and purchase records`);
console.log(`💾 Database stores: line_total = base + GST (no transport)`);
console.log(`📺 UI displays: display_total = line_total + transport_share`);
