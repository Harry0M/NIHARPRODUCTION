/**
 * Order Edit Form Verification Script
 * Tests order number auto-population and product auto-selection
 */

console.log("=== ORDER EDIT FORM VERIFICATION ===");

// Function to test order number auto-population
function testOrderNumberAutoPopulation() {
    console.log("\n1. Testing Order Number Auto-Population:");
    
    const orderNumberInput = document.querySelector('input[name="order_number"]');
    if (orderNumberInput) {
        console.log("✅ Order number input found");
        console.log("   Current value:", orderNumberInput.value);
        
        if (orderNumberInput.value && orderNumberInput.value.trim() !== "") {
            console.log("✅ Order number is auto-populated with:", orderNumberInput.value);
        } else {
            console.log("❌ Order number is empty - might be a new order or data loading issue");
        }
    } else {
        console.log("❌ Order number input not found");
    }
}

// Function to test product auto-selection
function testProductAutoSelection() {
    console.log("\n2. Testing Product Auto-Selection:");
    
    // Look for product selector button
    const productSelector = document.querySelector('button[type="button"]');
    let productSelectorText = "";
    
    // Find the product selector by checking button text content
    const buttons = Array.from(document.querySelectorAll('button[type="button"]'));
    const productButton = buttons.find(btn => 
        btn.textContent && btn.textContent.includes('Choose a product') || 
        btn.textContent.includes('×') // Likely contains product dimensions
    );
    
    if (productButton) {
        productSelectorText = productButton.textContent || "";
        console.log("✅ Product selector found");
        console.log("   Current text:", productSelectorText);
        
        if (productSelectorText.includes('Choose a product template')) {
            console.log("❌ No product selected - showing placeholder text");
        } else if (productSelectorText.includes('×')) {
            console.log("✅ Product appears to be selected with dimensions:", productSelectorText);
        } else {
            console.log("✅ Product selected:", productSelectorText);
        }
    } else {
        console.log("❌ Product selector not found");
    }
}

// Function to check form data state
function testFormDataState() {
    console.log("\n3. Testing Form Data State:");
    
    // Check if React DevTools are available
    if (window.React && window.React.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        console.log("✅ React DevTools detected - check component state manually");
        console.log("   Look for 'orderDetails' state in useOrderForm hook");
        console.log("   Check if 'catalog_id' and 'order_number' fields are populated");
    } else {
        console.log("⚠️ React DevTools not available for state inspection");
    }
    
    // Check for any visible form validation errors
    const errorElements = document.querySelectorAll('.text-destructive, .border-destructive');
    if (errorElements.length > 0) {
        console.log("⚠️ Found", errorElements.length, "validation errors or warnings");
    } else {
        console.log("✅ No visible validation errors");
    }
}

// Function to check console for debugging logs
function checkConsoleForDebugging() {
    console.log("\n4. Check Browser Console for Debugging Info:");
    console.log("   Look for these debug messages:");
    console.log("   - 'OrderDetailsForm - formData.catalog_id: ...'");
    console.log("   - 'OrderDetailsForm - Setting selectedProductId to: ...'");
    console.log("   - 'Selected product: ...'");
    console.log("   - Product selector component logs");
}

// Function to provide manual testing steps
function manualTestingSteps() {
    console.log("\n5. Manual Testing Steps:");
    console.log("   1. Navigate to Orders list");
    console.log("   2. Click 'Edit' on an existing order");
    console.log("   3. Verify order number is pre-filled");
    console.log("   4. Verify product is pre-selected (not showing 'Choose a product template')");
    console.log("   5. Check that all order details are properly loaded");
    console.log("   6. Test saving the order to ensure data persists");
}

// Function to run all tests
function runAllTests() {
    console.log("Starting Order Edit Form verification...");
    
    testOrderNumberAutoPopulation();
    testProductAutoSelection();
    testFormDataState();
    checkConsoleForDebugging();
    manualTestingSteps();
    
    console.log("\n=== VERIFICATION COMPLETE ===");
    console.log("🎯 Key Fixes Applied:");
    console.log("   ✅ Order number auto-population in OrderEdit.tsx");
    console.log("   ✅ Product auto-selection logic in OrderDetailsForm.tsx");
    console.log("   ✅ catalog_id initialization in useOrderDetails.ts");
    console.log("   ✅ Improved useEffect logic for product selection");
}

// Auto-run tests when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
} else {
    runAllTests();
}

// Export for manual testing
window.orderEditVerification = {
    testOrderNumberAutoPopulation,
    testProductAutoSelection,
    testFormDataState,
    runAllTests
};

console.log("\n📝 Manual testing available via: window.orderEditVerification");
