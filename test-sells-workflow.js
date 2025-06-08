// Test script to verify the Sells workflow
// Run this in the browser console at http://localhost:8093/

console.log('Testing Sells workflow...');

// Function to navigate to Sells page
function navigateToSells() {
    console.log('1. Navigating to Sells page...');
    window.location.href = '/sells';
}

// Function to check if completed orders are loaded
function checkCompletedOrders() {
    console.log('2. Checking for completed orders...');
    const orderRows = document.querySelectorAll('[data-testid="order-row"], .order-row, table tbody tr');
    console.log(`Found ${orderRows.length} order rows`);
    
    if (orderRows.length > 0) {
        console.log('✓ Orders are displaying');
        return true;
    } else {
        console.log('✗ No orders found');
        return false;
    }
}

// Function to click on an order to test navigation
function testOrderClick() {
    console.log('3. Testing order click navigation...');
    const firstOrder = document.querySelector('table tbody tr');
    if (firstOrder) {
        console.log('✓ Found first order, clicking...');
        firstOrder.click();
        return true;
    } else {
        console.log('✗ No orders to click');
        return false;
    }
}

// Function to verify form loads
function verifyFormLoaded() {
    console.log('4. Verifying form loaded...');
    const form = document.querySelector('form');
    const invoiceNumber = document.querySelector('input[name="invoiceNumber"]');
    const companyName = document.querySelector('input[name="companyName"]');
    
    if (form && invoiceNumber && companyName) {
        console.log('✓ Sells creation form loaded successfully');
        return true;
    } else {
        console.log('✗ Form not loaded properly');
        return false;
    }
}

// Function to test form calculations
function testFormCalculations() {
    console.log('5. Testing form calculations...');
    const quantity = document.querySelector('input[name="quantity"]');
    const rate = document.querySelector('input[name="rate"]');
    
    if (quantity && rate) {
        quantity.value = '100';
        rate.value = '50';
        quantity.dispatchEvent(new Event('input', { bubbles: true }));
        rate.dispatchEvent(new Event('input', { bubbles: true }));
        
        setTimeout(() => {
            const subtotal = document.querySelector('[data-testid="subtotal"]');
            if (subtotal && subtotal.textContent.includes('5000')) {
                console.log('✓ Calculations working correctly');
            } else {
                console.log('✗ Calculations not working');
            }
        }, 100);
    }
}

// Export functions for manual testing
window.sellsTest = {
    navigateToSells,
    checkCompletedOrders,
    testOrderClick,
    verifyFormLoaded,
    testFormCalculations,
    
    // Run complete test
    runFullTest: async function() {
        console.log('🚀 Starting complete Sells workflow test...');
        
        // Step 1: Navigate to sells
        navigateToSells();
        
        // Wait for navigation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Step 2: Check orders
        if (checkCompletedOrders()) {
            // Step 3: Test clicking
            if (testOrderClick()) {
                // Wait for navigation to form
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Step 4: Verify form
                if (verifyFormLoaded()) {
                    // Step 5: Test calculations
                    testFormCalculations();
                    console.log('✅ Complete workflow test passed!');
                } else {
                    console.log('❌ Form verification failed');
                }
            } else {
                console.log('❌ Order click test failed');
            }
        } else {
            console.log('❌ No completed orders found');
        }
    }
};

console.log('Test functions loaded. Use sellsTest.runFullTest() to run the complete test.');
console.log('Available functions: navigateToSells, checkCompletedOrders, testOrderClick, verifyFormLoaded, testFormCalculations');
