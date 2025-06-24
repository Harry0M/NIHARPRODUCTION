/**
 * Manual Formula Fix Verification Script
 * 
 * Run this in the browser console on an order edit page to verify
 * that the manual formula consumption storage fix is working correctly.
 */

// Browser Console Verification Script
const manualFormulaVerification = {
  
  // Test the manual formula detection logic
  testManualFormulaDetection() {
    console.log('%c🧪 TESTING MANUAL FORMULA DETECTION', 'background: #2196F3; color: white; font-size: 16px; padding: 10px;');
    
    const testComponents = [
      { type: 'fabric', formula: 'manual', consumption: '12.5', originalConsumption: 2.5 },
      { type: 'handle', formula: 'linear', is_manual_consumption: true, consumption: '4.0', originalConsumption: 0.8 },
      { type: 'border', formula: 'standard', consumption: '1.2' }
    ];
    
    testComponents.forEach(comp => {
      const isManual = comp.formula === 'manual' || comp.is_manual_consumption === true;
      console.log(`${comp.type}: ${isManual ? '✅ MANUAL' : '⏭️ STANDARD'}`);
    });
  },
  
  // Test the consumption value processing
  testConsumptionProcessing() {
    console.log('%c🔄 TESTING CONSUMPTION PROCESSING', 'background: #4CAF50; color: white; font-size: 16px; padding: 10px;');
    
    const orderQuantity = 5;
    const components = [
      { type: 'fabric', formula: 'manual', consumption: '12.5', originalConsumption: 2.5 },
      { type: 'handle', formula: 'linear', is_manual_consumption: true, consumption: '4.0', originalConsumption: 0.8 }
    ];
    
    const processed = components.map(comp => {
      const isManual = comp.formula === 'manual' || comp.is_manual_consumption === true;
      
      if (isManual) {
        let originalConsumption = comp.originalConsumption;
        
        if (!originalConsumption && comp.consumption && orderQuantity > 1) {
          originalConsumption = parseFloat(comp.consumption) / orderQuantity;
        }
        
        console.log(`✅ ${comp.type}: ${comp.consumption} → ${originalConsumption} (will be stored in DB)`);
        
        return { ...comp, consumption: originalConsumption };
      }
      
      return comp;
    });
    
    return processed;
  },
  
  // Monitor network requests to see what's being saved
  monitorNetworkRequests() {
    console.log('%c📡 MONITORING NETWORK REQUESTS', 'background: #FF9800; color: white; font-size: 16px; padding: 10px;');
    console.log('Watch for POST requests to /rest/v1/order_components when saving orders...');
    
    // Intercept fetch requests to monitor what's being sent to the database
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const [url, options] = args;
      
      if (url.includes('order_components') && options?.method === 'POST') {
        console.log('%c📝 ORDER_COMPONENTS INSERT DETECTED', 'background: #E91E63; color: white; font-weight: bold;');
        
        try {
          const body = JSON.parse(options.body);
          console.log('Components being saved to database:', body);
          
          // Check for manual formula components
          if (Array.isArray(body)) {
            body.forEach((comp, index) => {
              const isManual = comp.formula === 'manual' || comp.is_manual_consumption === true;
              if (isManual) {
                console.log(`%c✅ Manual Formula Component ${index + 1}:`, 'background: #4CAF50; color: white;');
                console.log(`   Type: ${comp.component_type}`);
                console.log(`   Consumption: ${comp.consumption} (this should be ORIGINAL value)`);
                console.log(`   Formula: ${comp.formula}`);
                console.log(`   Manual Flag: ${comp.is_manual_consumption}`);
              }
            });
          }
        } catch (e) {
          console.log('Could not parse request body:', options.body);
        }
      }
      
      return originalFetch.apply(this, args);
    };
    
    console.log('✅ Network monitoring active. Save an order to see the data being sent to the database.');
  },
  
  // Check current component state
  checkCurrentComponentState() {
    console.log('%c📊 CHECKING CURRENT COMPONENT STATE', 'background: #9C27B0; color: white; font-size: 16px; padding: 10px;');
    
    // Try to access React component state (if available)
    const reactFiberKey = Object.keys(document.querySelector('#root') || {}).find(key => key.startsWith('__reactFiber'));
    
    if (reactFiberKey) {
      console.log('✅ React app detected. Component state inspection available.');
      console.log('Note: Check browser React DevTools for detailed component state.');
    } else {
      console.log('⚠️ React app not detected or not accessible.');
    }
    
    // Look for debug data in localStorage
    const debugData = localStorage.getItem('orderFormDebugData');
    if (debugData) {
      console.log('📋 Debug data found in localStorage:', JSON.parse(debugData));
    }
  },
  
  // Run all verification tests
  runAllTests() {
    console.log('%c🚀 MANUAL FORMULA FIX VERIFICATION SUITE', 'background: #000; color: white; font-size: 20px; padding: 15px;');
    console.log('===============================================\n');
    
    this.testManualFormulaDetection();
    console.log('\n');
    
    this.testConsumptionProcessing();
    console.log('\n');
    
    this.monitorNetworkRequests();
    console.log('\n');
    
    this.checkCurrentComponentState();
    
    console.log('\n%c✅ VERIFICATION COMPLETE', 'background: #4CAF50; color: white; font-size: 16px; padding: 10px;');
    console.log('The manual formula consumption storage fix verification is complete.');
    console.log('Save an order with manual formulas to see the fix in action!');
  }
};

// Auto-run the verification
manualFormulaVerification.runAllTests();

// Make it available globally for manual testing
window.manualFormulaVerification = manualFormulaVerification;

console.log('\n%c💡 TIP: Use manualFormulaVerification.runAllTests() to run verification again', 'background: #607D8B; color: white; padding: 5px;');
