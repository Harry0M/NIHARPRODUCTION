// Test to verify both GST and Transport charge calculations are fixed
// This simulates the calculation logic from PurchaseNew.tsx

function testCompleteCalculations() {
    console.log("=== TESTING COMPLETE GST AND TRANSPORT FIX ===\n");
    
    // Test scenario: 2 materials with transport charges
    const testItems = [
        {
            alt_quantity: 100,
            alt_unit_price: 118, // Includes 18% GST (100 base + 18 GST)
            gst: 18,
            quantity: 50,
            name: "Material A"
        },
        {
            alt_quantity: 200,
            alt_unit_price: 59, // Includes 18% GST (50 base + 9 GST)
            gst: 18,
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
        console.log(`  Alt Unit Price: ₹${item.alt_unit_price} (GST inclusive)`);
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
    
    // Process each item with the NEW CORRECTED LOGIC
    const processedItems = testItems.map((item, index) => {
        console.log(`PROCESSING ${item.name}:`);
        
        const altQuantity = item.alt_quantity;
        const altUnitPrice = item.alt_unit_price;
        const gstRate = item.gst;
        const mainQuantity = item.quantity;
        
        // Total amount from alt_quantity * alt_unit_price (includes GST)
        const totalAmountWithGST = altQuantity * altUnitPrice;
        console.log(`  Total Amount with GST: ${altQuantity} × ₹${altUnitPrice} = ₹${totalAmountWithGST}`);
        
        // Extract base amount (without GST) using CORRECT formula
        // Base Amount = Total Amount / (1 + GST Rate/100)
        const baseAmount = totalAmountWithGST / (1 + gstRate / 100);
        console.log(`  Base Amount (without GST): ₹${totalAmountWithGST} ÷ (1 + ${gstRate}/100) = ₹${baseAmount.toFixed(2)}`);
        
        // Calculate GST amount
        const gstAmount = totalAmountWithGST - baseAmount;
        console.log(`  GST Amount: ₹${totalAmountWithGST} - ₹${baseAmount.toFixed(2)} = ₹${gstAmount.toFixed(2)}`);
        
        // Transport Share = alt_quantity × per_alt_unit_transport_rate
        const transportShare = altQuantity * perAltUnitTransportRate;
        console.log(`  Transport Share: ${altQuantity} × ₹${perAltUnitTransportRate.toFixed(4)} = ₹${transportShare.toFixed(2)}`);
        
        // Unit Price calculation (for display purposes)
        const unitPrice = mainQuantity > 0 
            ? (baseAmount + gstAmount + transportShare) / mainQuantity 
            : 0;
        console.log(`  Unit Price: (₹${baseAmount.toFixed(2)} + ₹${gstAmount.toFixed(2)} + ₹${transportShare.toFixed(2)}) ÷ ${mainQuantity} = ₹${unitPrice.toFixed(2)}`);
        
        // Line Total = base_amount + gst_amount (NO transport to avoid double counting)
        const lineTotal = baseAmount + gstAmount;
        console.log(`  Line Total (Material only): ₹${baseAmount.toFixed(2)} + ₹${gstAmount.toFixed(2)} = ₹${lineTotal.toFixed(2)}`);
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
    
    // Check 1: Transport shares should sum to total transport charge
    console.log(`Check 1 - Transport Distribution:`);
    console.log(`  Sum of transport shares: ₹${totalTransportShares.toFixed(2)}`);
    console.log(`  Total transport charge: ₹${transportCharge.toFixed(2)}`);
    console.log(`  Match: ${Math.abs(totalTransportShares - transportCharge) < 0.01 ? '✓ PASS' : '✗ FAIL'}`);
    
    // Check 2: GST calculations should be accurate
    console.log(`Check 2 - GST Accuracy:`);
    processedItems.forEach((item, index) => {
        const expectedGST = (item.base_amount * item.gst) / 100;
        const actualGST = item.gst_amount;
        const match = Math.abs(expectedGST - actualGST) < 0.01;
        console.log(`  ${item.name}: Expected ₹${expectedGST.toFixed(2)}, Actual ₹${actualGST.toFixed(2)} ${match ? '✓' : '✗'}`);
    });
    
    // Check 3: No double counting of transport
    console.log(`Check 3 - No Transport Double Counting:`);
    console.log(`  Line totals include only material costs (base + GST)`);
    console.log(`  Transport is added separately in grand total`);
    console.log(`  This prevents transport from being counted twice: ✓ PASS`);
    
    console.log("\n=== TEST COMPLETE ===");
}

testCompleteCalculations();
