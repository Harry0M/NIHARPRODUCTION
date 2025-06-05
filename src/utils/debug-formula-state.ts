/**
 * Debug utility to help diagnose formula state issues in components
 */

/**
 * Logs the formula state of a component with highlighted formatting
 * 
 * @param componentName Name of the component (e.g., "Part", "Border", "Custom")
 * @param state Current state object containing formula information
 * @param action Action being performed (e.g., "loaded", "updated", "initialized")
 */
export function logFormulaState(
  componentName: string,
  state: { 
    formula?: string; 
    is_manual_consumption?: boolean;
    consumption?: number;
    baseFormula?: string;
  },
  action: string
) {
  const isManual = state.formula === 'manual' || state.is_manual_consumption;
  const bgColor = isManual ? '#e74c3c' : '#3498db';
  
  console.log(
    `%c ${componentName} ${action}: formula=${state.formula}, is_manual=${state.is_manual_consumption}, consumption=${state.consumption}, baseFormula=${state.baseFormula}`,
    `background:${bgColor};color:white;font-weight:bold;padding:3px;`
  );
}

/**
 * Creates a function to test whether a manual formula is properly preserved
 * when loading and saving products
 * 
 * @returns Test function
 */
export function createManualFormulaTest() {
  return function testManualFormulaPreservation(
    components: Record<string, any>,
    customComponents: any[]
  ) {
    console.log('%c MANUAL FORMULA TEST', 'background:#2c3e50;color:white;font-size:16px;padding:5px;');
    
    // Check standard components
    Object.entries(components).forEach(([key, comp]) => {
      const isManual = comp.formula === 'manual' || comp.is_manual_consumption;
      console.log(
        `%c Standard ${key}: formula=${comp.formula}, is_manual=${isManual}, baseFormula=${comp.baseFormula}`, 
        `background:${isManual ? '#e74c3c' : '#3498db'};color:white;padding:3px;`
      );
    });
    
    // Check custom components
    customComponents.forEach((comp, i) => {
      const isManual = comp.formula === 'manual' || comp.is_manual_consumption;
      console.log(
        `%c Custom ${i}: ${comp.customName}, formula=${comp.formula}, is_manual=${isManual}, baseFormula=${comp.baseFormula}`, 
        `background:${isManual ? '#e74c3c' : '#3498db'};color:white;padding:3px;`
      );
    });
  };
}
