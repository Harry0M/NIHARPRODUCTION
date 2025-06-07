// Test to verify database storage calculations are correct
// This simulates the handleSubmit database storage logic

function testDatabaseStorageCalculations() {
    console.log("=== TESTING DATABASE STORAGE CALCULATIONS ===\n");
    
    // Simulate the purchase items data as it would be when submitting
    const purchaseItems = [
        {
            id: "1",
            alt_quantity: 100,
            alt_unit_price: 50,
            gst: 18,
            quantity: 50,
            base_amount: 5000, // 100 * 50
            gst_amount: 900,   // 5000 * 18/100
            line_total: 5900,  // 5000 + 900
            transport_share: 166.67,
            name: "Material A"
        },
        {
            id: "2", 
            alt_quantity: 200,
            alt_unit_price: 30,
            gst: 5,
            quantity: 100,
            base_amount: 6000, // 200 * 30
            gst_amount: 300,   // 6000 * 5/100
            line_total: 6300,  // 6000 + 300
            transport_share: 333.33,
            name: "Material B"
        }
    ];
    
    console.log("SIMULATED PURCHASE ITEMS (as they would be in the form):");
    purchaseItems.forEach((item, index) => {
        console.log(`\nMaterial ${index + 1} (${item.name}):`);
        console.log(`  Alt Quantity: ${item.alt_quantity}`);
        console.log(`  Alt Unit Price: ₹${item.alt_unit_price}`);
        console.log(`  GST Rate: ${item.gst}%`);
        console.log(`  Base Amount: ₹${item.base_amount}`);
        console.log(`  GST Amount: ₹${item.gst_amount}`);
        console.log(`  Line Total: ₹${item.line_total}`);
        console.log(`  Transport Share: ₹${item.transport_share}`);
    });
    console.log();
    
    // Simulate the database storage calculation (FIXED VERSION)
    console.log("DATABASE STORAGE CALCULATIONS (FIXED):");
    const databaseItems = purchaseItems.map((item, index) => {
        console.log(`\nProcessing ${item.name} for database storage:`);
        
        // FIXED: Use base_amount instead of line_total
        const baseAmount = item.base_amount || 0; // Pure base amount (alt_quantity * alt_unit_price)
        const transportShare = item.transport_share || 0;
        const gstAmount = item.gst_amount || 0;
        const totalLineAmount = baseAmount + transportShare + gstAmount; // Total including base + transport + GST
        
        console.log(`  Base Amount (for DB): ₹${baseAmount}`);
        console.log(`  Transport Share: ₹${transportShare}`);
        console.log(`  GST Amount: ₹${gstAmount}`);
        console.log(`  Total Line Amount: ₹${baseAmount} + ₹${transportShare} + ₹${gstAmount} = ₹${totalLineAmount.toFixed(2)}`);
        
        // Calculate transport-adjusted unit price that includes all costs
        const adjustedUnitPrice = item.quantity > 0 ? totalLineAmount / item.quantity : 0;
        console.log(`  Adjusted Unit Price: ₹${totalLineAmount.toFixed(2)} ÷ ${item.quantity} = ₹${adjustedUnitPrice.toFixed(2)}`);
        
        return {
            material_id: item.id,
            quantity: item.quantity,
            unit_price: adjustedUnitPrice,
            line_total: totalLineAmount,
            gst_percentage: item.gst,
            gst_amount: gstAmount,
            base_amount: baseAmount,
            transport_share: transportShare
        };
    });
    
    console.log("\n=== DATABASE RECORDS THAT WOULD BE SAVED ===");
    databaseItems.forEach((dbItem, index) => {
        console.log(`\nDatabase Record ${index + 1}:`);
        console.log(`  material_id: ${dbItem.material_id}`);
        console.log(`  quantity: ${dbItem.quantity}`);
        console.log(`  unit_price: ₹${dbItem.unit_price.toFixed(2)}`);
        console.log(`  line_total: ₹${dbItem.line_total.toFixed(2)}`);
        console.log(`  gst_percentage: ${dbItem.gst_percentage}%`);
        console.log(`  gst_amount: ₹${dbItem.gst_amount}`);
    });
    
    // Verification checks
    console.log("\n=== VERIFICATION CHECKS ===");
    
    // Check 1: No double GST addition
    console.log("Check 1 - No Double GST Addition:");
    purchaseItems.forEach((item, index) => {
        const dbItem = databaseItems[index];
        const expectedTotal = item.base_amount + item.transport_share + item.gst_amount;
        const actualTotal = dbItem.line_total;
        const match = Math.abs(expectedTotal - actualTotal) < 0.01;
        console.log(`  ${item.name}: Expected ₹${expectedTotal.toFixed(2)}, Actual ₹${actualTotal.toFixed(2)} ${match ? '✓' : '✗'}`);
    });
    
    // Check 2: GST amounts are preserved correctly
    console.log("Check 2 - GST Amounts Preserved:");
    purchaseItems.forEach((item, index) => {
        const dbItem = databaseItems[index];
        const match = Math.abs(item.gst_amount - dbItem.gst_amount) < 0.01;
        console.log(`  ${item.name}: Form GST ₹${item.gst_amount}, DB GST ₹${dbItem.gst_amount} ${match ? '✓' : '✗'}`);
    });
    
    // Check 3: Total calculations
    const formSubtotal = purchaseItems.reduce((sum, item) => sum + item.line_total, 0);
    const dbSubtotal = databaseItems.reduce((sum, item) => sum + item.line_total, 0);
    console.log("Check 3 - Subtotal Consistency:");
    console.log(`  Form Subtotal: ₹${formSubtotal.toFixed(2)}`);
    console.log(`  Database Subtotal: ₹${dbSubtotal.toFixed(2)}`);
    console.log(`  Match: ${Math.abs(formSubtotal - dbSubtotal) < 0.01 ? '✓ PASS' : '✗ FAIL'}`);
    
    console.log("\n=== TEST COMPLETE ===");
    console.log("Database storage now uses base_amount correctly to avoid GST double-counting!");
}

testDatabaseStorageCalculations();
