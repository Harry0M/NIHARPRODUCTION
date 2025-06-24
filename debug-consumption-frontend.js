// Test script to identify where consumption values are being modified
// Run this in the browser console during the order edit/save/display cycle

// Test 1: Check consumption values at different stages
function testConsumptionValueFlow() {
    console.log("=== CONSUMPTION VALUE FLOW TEST ===");
    
    // Access React DevTools to get component state
    function getReactFiberFromElement(element) {
        const keys = Object.keys(element);
        const fiberKey = keys.find(key => key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance'));
        return element[fiberKey];
    }
    
    // Get order form data if available
    function logCurrentOrderState() {
        console.log("\n1. CURRENT ORDER FORM STATE:");
        
        // Try to find order form inputs
        const consumptionInputs = document.querySelectorAll('input[type="number"]');
        consumptionInputs.forEach((input, index) => {
            if (input.placeholder && input.placeholder.toLowerCase().includes('consumption')) {
                console.log(`Consumption input ${index}: ${input.value}`);
            }
        });
        
        // Check for any global order state
        if (window.orderComponentDebug) {
            console.log("Window order debug data:", window.orderComponentDebug);
        }
    }
    
    // Monitor network requests to see what's being sent/received
    function monitorNetworkRequests() {
        console.log("\n2. MONITORING NETWORK REQUESTS:");
        
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const [url, options] = args;
            
            if (url.includes('order') || url.includes('component')) {
                console.log("Network request:", {
                    url: url,
                    method: options?.method || 'GET',
                    body: options?.body ? JSON.parse(options.body) : null
                });
            }
            
            const response = await originalFetch.apply(this, args);
            
            if (url.includes('order') || url.includes('component')) {
                const clonedResponse = response.clone();
                try {
                    const data = await clonedResponse.json();
                    console.log("Network response:", {
                        url: url,
                        status: response.status,
                        data: data
                    });
                } catch (e) {
                    console.log("Non-JSON response:", response.status);
                }
            }
            
            return response;
        };
    }
    
    // Check local storage for any cached data
    function checkLocalStorage() {
        console.log("\n3. LOCAL STORAGE CHECK:");
        
        Object.keys(localStorage).forEach(key => {
            if (key.includes('order') || key.includes('component')) {
                console.log(`${key}:`, localStorage.getItem(key));
            }
        });
    }
    
    // Test database functions by simulating consumption calculation
    function testConsumptionCalculation() {
        console.log("\n4. TESTING CONSUMPTION CALCULATION:");
        
        // Test the calculate_consumption function logic in JavaScript
        function calculateConsumption(length, width, rollWidth, quantity = 1) {
            if (!rollWidth || rollWidth === 0) return null;
            return ((length * width) / (rollWidth * 39.39)) * quantity;
        }
        
        // Test with sample values
        const testCases = [
            { length: 10, width: 5, rollWidth: 100, quantity: 1 },
            { length: 12, width: 8, rollWidth: 120, quantity: 10 },
            { length: 15, width: 6, rollWidth: 90, quantity: 20 }
        ];
        
        testCases.forEach((test, index) => {
            const result = calculateConsumption(test.length, test.width, test.rollWidth, test.quantity);
            console.log(`Test ${index + 1}: ${test.length}×${test.width}, roll=${test.rollWidth}, qty=${test.quantity} → ${result?.toFixed(4)} meters`);
        });
    }
    
    // Initialize monitoring
    logCurrentOrderState();
    monitorNetworkRequests();
    checkLocalStorage();
    testConsumptionCalculation();
    
    // Check for any React error boundaries
    console.log("\n5. REACT ERROR BOUNDARY CHECK:");
    window.addEventListener('error', (event) => {
        if (event.error && event.error.stack && event.error.stack.includes('consumption')) {
            console.error("Consumption-related error:", event.error);
        }
    });
    
    console.log("=== MONITORING ACTIVE ===");
    console.log("Network requests and errors will be logged automatically.");
    console.log("Navigate through order edit → save → view cycle to see the data flow.");
}

// Test 2: Compare values before and after save
function compareBeforeAfterSave() {
    console.log("=== BEFORE/AFTER SAVE COMPARISON ===");
    
    // Store current consumption values
    const consumptionInputs = Array.from(document.querySelectorAll('input[type="number"]'))
        .filter(input => input.placeholder && input.placeholder.toLowerCase().includes('consumption'))
        .map(input => ({
            placeholder: input.placeholder,
            value: input.value,
            name: input.name || input.id
        }));
    
    console.log("Current consumption values:", consumptionInputs);
    
    // Store in sessionStorage for comparison after page reload
    sessionStorage.setItem('consumptionValuesBeforeSave', JSON.stringify({
        timestamp: new Date().toISOString(),
        values: consumptionInputs,
        url: window.location.href
    }));
    
    console.log("Values stored. After saving and navigating to order details, run: checkAfterSave()");
}

// Test 3: Check values after save/navigation
function checkAfterSave() {
    console.log("=== AFTER SAVE COMPARISON ===");
    
    const beforeData = sessionStorage.getItem('consumptionValuesBeforeSave');
    if (!beforeData) {
        console.log("No before-save data found. Run compareBeforeAfterSave() first.");
        return;
    }
    
    const before = JSON.parse(beforeData);
    console.log("Before save data:", before);
    
    // Get current displayed consumption values from the order detail page
    const consumptionElements = Array.from(document.querySelectorAll('td, div, span'))
        .filter(el => {
            const text = el.textContent || '';
            return text.includes('meters') || text.includes('units') || 
                   (text.match(/\d+\.\d+/) && el.parentElement?.textContent?.toLowerCase().includes('consumption'));
        })
        .map(el => ({
            text: el.textContent?.trim(),
            element: el.tagName,
            parent: el.parentElement?.textContent?.trim()
        }));
    
    console.log("Current displayed consumption values:", consumptionElements);
    
    // Try to find specific consumption values in table format
    const consumptionCells = Array.from(document.querySelectorAll('tbody tr'))
        .map(row => {
            const cells = Array.from(row.querySelectorAll('td'));
            const consumptionCell = cells.find(cell => 
                cell.textContent && (cell.textContent.includes('meters') || cell.textContent.includes('units'))
            );
            if (consumptionCell) {
                return {
                    rowData: cells.map(cell => cell.textContent?.trim()),
                    consumption: consumptionCell.textContent?.trim()
                };
            }
            return null;
        })
        .filter(Boolean);
    
    console.log("Consumption table data:", consumptionCells);
    
    // Clean up stored data
    sessionStorage.removeItem('consumptionValuesBeforeSave');
}

// Test 4: Direct database value check
async function checkDatabaseValues() {
    console.log("=== DIRECT DATABASE CHECK ===");
    
    // Try to access Supabase client if available
    if (window.supabase || window.__SUPABASE_CLIENT__) {
        const supabase = window.supabase || window.__SUPABASE_CLIENT__;
        
        // Get the current order ID from URL
        const orderIdMatch = window.location.pathname.match(/\/orders\/([^\/]+)/);
        if (orderIdMatch) {
            const orderId = orderIdMatch[1];
            console.log("Checking order ID:", orderId);
            
            try {
                const { data, error } = await supabase
                    .from('order_components')
                    .select('*')
                    .eq('order_id', orderId);
                
                if (error) {
                    console.error("Database query error:", error);
                } else {
                    console.log("Raw database component data:", data);
                    data?.forEach((component, index) => {
                        console.log(`Component ${index + 1}:`, {
                            type: component.component_type,
                            consumption: component.consumption,
                            formula: component.formula,
                            is_manual: component.is_manual_consumption
                        });
                    });
                }
            } catch (err) {
                console.error("Failed to query database:", err);
            }
        } else {
            console.log("No order ID found in URL");
        }
    } else {
        console.log("Supabase client not found in window object");
    }
}

// Export functions to global scope
window.testConsumptionValueFlow = testConsumptionValueFlow;
window.compareBeforeAfterSave = compareBeforeAfterSave;
window.checkAfterSave = checkAfterSave;
window.checkDatabaseValues = checkDatabaseValues;

console.log("=== CONSUMPTION DEBUG TOOLS LOADED ===");
console.log("Available functions:");
console.log("1. testConsumptionValueFlow() - Start monitoring");
console.log("2. compareBeforeAfterSave() - Save current values for comparison");
console.log("3. checkAfterSave() - Compare values after save/navigation");
console.log("4. checkDatabaseValues() - Check raw database values");
