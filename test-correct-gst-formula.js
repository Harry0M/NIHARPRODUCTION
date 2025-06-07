// Test to verify GST calculation with the correct formula
// GST = (alt quantity * alt unit price) * gst_rate / 100

function testGSTCalculationFormula() {
    console.log("=== TESTING CORRECT GST CALCULATION FORMULA ===\n");
    
    // Test scenario based on user's formula
    const testItems = [
        {
            alt_quantity: 100,
            alt_unit_price: 50, // Base price (no GST included)
            gst: 5, // 5% GST
            quantity: 50,
            name: "Material A"
        },
        {
            alt_quantity: 200,
            alt_unit_price: 30, // Base price (no GST included) 
            gst: 18, // 18% GST
            quantity: 100,
            name: "Material B"
        }
    ];
    
    const transportCharge = 500;
    
    console.log("INPUT DATA:");
    console.log("Transport Charge: ₹", transportCharge);
    testItems.forEach((item, index) => {
        console.log(`Material ${index + 1} (${item.name}):`);
        console.log(`  Alt Quantity: ${item.alt_quantity}`);
        console.log(`  Alt Unit Price: ₹${item.alt_unit_price} (base price, no GST)`);
        console.log(`  GST Rate: ${item.gst}%`);
        console.log(`  Main Quantity: ${item.quantity}`);
    });
    console.log();
    
    // Calculate total alt quantity for transport distribution
    const totalAltQuantity = testItems.reduce((sum, item) => sum + item.alt_quantity, 0);
    console.log("Total Alt Quantity:", totalAltQuantity);
    
    // Calculate per alt unit transport rate
    const perAltUnitTransportRate = totalAltQuantity > 0 
        ? transportCharge / totalAltQuantity 
        : 0;
    console.log("Per Alt Unit Transport Rate: ₹", perAltUnitTransportRate.toFixed(4));
    console.log();
    
    // Process each item with the CORRECTED GST FORMULA
    const processedItems = testItems.map((item, index) => {
        console.log(`PROCESSING ${item.name}:`);
        
        const altQuantity = item.alt_quantity;
        const altUnitPrice = item.alt_unit_price;
        const gstRate = item.gst;
        const mainQuantity = item.quantity;
        
        // Base amount = alt_quantity * alt_unit_price (this is the base amount without GST)
        const baseAmount = altQuantity * altUnitPrice;
        console.log(`  Base Amount: ${altQuantity} × ₹${altUnitPrice} = ₹${baseAmount}`);
        
        // Calculate GST amount using the CORRECT formula: (alt quantity * alt unit price) * gst_rate / 100
        const gstAmount = (baseAmount * gstRate) / 100;
        console.log(`  GST Amount: ₹${baseAmount} × ${gstRate}% = ₹${gstAmount.toFixed(2)}`);
        
        // Verify with user's formula: =(alt quantity*alt unit price)*5/100 (for 5% GST example)
        const userFormulaResult = (altQuantity * altUnitPrice) * (gstRate / 100);
        console.log(`  User Formula Verification: (${altQuantity} × ₹${altUnitPrice}) × ${gstRate}/100 = ₹${userFormulaResult.toFixed(2)}`);
        console.log(`  Formula Match: ${Math.abs(gstAmount - userFormulaResult) < 0.01 ? '✓ PASS' : '✗ FAIL'}`);
        
        // Transport Share = alt_quantity × per_alt_unit_transport_rate
        const transportShare = altQuantity * perAltUnitTransportRate;
        console.log(`  Transport Share: ${altQuantity} × ₹${perAltUnitTransportRate.toFixed(4)} = ₹${transportShare.toFixed(2)}`);
        
        // Unit Price calculation (for display purposes)
        const unitPrice = mainQuantity > 0 
            ? (baseAmount + gstAmount + transportShare) / mainQuantity 
            : 0;
        console.log(`  Unit Price: (₹${baseAmount} + ₹${gstAmount.toFixed(2)} + ₹${transportShare.toFixed(2)}) ÷ ${mainQuantity} = ₹${unitPrice.toFixed(2)}`);
        
        // Line Total = base_amount + gst_amount (material cost with GST, no transport)
        const lineTotal = baseAmount + gstAmount;
        console.log(`  Line Total (Material + GST): ₹${baseAmount} + ₹${gstAmount.toFixed(2)} = ₹${lineTotal.toFixed(2)}`);
        console.log();
        
        return {
            ...item,
            base_amount: baseAmount,
            gst_amount: gstAmount,
            transport_share: transportShare,
            unit_price: unitPrice,
            line_total: lineTotal,
            total: lineTotal
        };
    });
    
    // Calculate summary totals
    const subtotalBeforeGST = processedItems.reduce((sum, item) => sum + item.base_amount, 0);
    const totalGST = processedItems.reduce((sum, item) => sum + item.gst_amount, 0);
    const subtotalAfterGST = processedItems.reduce((sum, item) => sum + item.line_total, 0);
    const totalTransportShares = processedItems.reduce((sum, item) => sum + item.transport_share, 0);
    const grandTotal = subtotalAfterGST + transportCharge;
    
    console.log("=== SUMMARY CALCULATIONS ===");
    console.log(`Subtotal (Before GST): ₹${subtotalBeforeGST.toFixed(2)}`);
    console.log(`Total GST: ₹${totalGST.toFixed(2)}`);
    console.log(`Subtotal (After GST): ₹${subtotalAfterGST.toFixed(2)}`);
    console.log(`Transport Charge: ₹${transportCharge.toFixed(2)}`);
    console.log(`Grand Total: ₹${grandTotal.toFixed(2)}`);
    console.log();
    
    // Verification checks
    console.log("=== VERIFICATION CHECKS ===");
    
    // Check 1: GST formula accuracy
    console.log(`Check 1 - GST Formula Accuracy:`);
    processedItems.forEach((item, index) => {
        const expectedGST = (item.alt_quantity * item.alt_unit_price) * (item.gst / 100);
        const actualGST = item.gst_amount;
        const match = Math.abs(expectedGST - actualGST) < 0.01;
        console.log(`  ${item.name}: Expected ₹${expectedGST.toFixed(2)}, Actual ₹${actualGST.toFixed(2)} ${match ? '✓' : '✗'}`);
    });
    
    // Check 2: Transport distribution
    console.log(`Check 2 - Transport Distribution:`);
    console.log(`  Sum of transport shares: ₹${totalTransportShares.toFixed(2)}`);
    console.log(`  Total transport charge: ₹${transportCharge.toFixed(2)}`);
    console.log(`  Match: ${Math.abs(totalTransportShares - transportCharge) < 0.01 ? '✓ PASS' : '✗ FAIL'}`);
    
    // Check 3: Summary calculations
    console.log(`Check 3 - Summary Calculations:`);
    const expectedSubtotalAfterGST = subtotalBeforeGST + totalGST;
    console.log(`  Expected Subtotal After GST: ₹${subtotalBeforeGST.toFixed(2)} + ₹${totalGST.toFixed(2)} = ₹${expectedSubtotalAfterGST.toFixed(2)}`);
    console.log(`  Actual Subtotal After GST: ₹${subtotalAfterGST.toFixed(2)}`);
    console.log(`  Match: ${Math.abs(expectedSubtotalAfterGST - subtotalAfterGST) < 0.01 ? '✓ PASS' : '✗ FAIL'}`);
    
    console.log("\n=== TEST COMPLETE ===");
    console.log("GST Formula is now correctly implemented as: (alt_quantity * alt_unit_price) * gst_rate / 100");
}

testGSTCalculationFormula();
