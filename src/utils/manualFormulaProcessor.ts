/**
 * Manual Formula Processor Utility
 * 
 * This utility handles the identification and processing of manual formulas in order forms.
 * Manual formulas require special handling where the consumption value needs to be multiplied
 * by the order quantity before saving to ensure proper material consumption calculations.
 */

export interface ProcessedComponent {
  id?: string;
  type: string;
  formula?: string;
  is_manual_consumption?: boolean;
  consumption?: string | number;
  originalConsumption?: string | number;
  order_id?: string;
  component_type?: string;
  [key: string]: unknown;
}

/**
 * Identifies if a component has a manual formula
 * @param component - The component to check
 * @returns boolean - True if the component uses a manual formula
 */
export function isManualFormula(component: ProcessedComponent): boolean {
  if (!component) return false;
  
  // Check both formula field and is_manual_consumption flag
  const hasManualFormula = component.formula === 'manual';
  const hasManualConsumption = component.is_manual_consumption === true;
  
  // Log for debugging
  console.log(`Manual formula check for ${component.type || 'unknown'}:`, {
    formula: component.formula,
    is_manual_consumption: component.is_manual_consumption,
    isManual: hasManualFormula || hasManualConsumption
  });
  
  return hasManualFormula || hasManualConsumption;
}

/**
 * Processes manual formula consumption by multiplying with order quantity
 * @param component - The component to process
 * @param orderQuantity - The order quantity to multiply with
 * @returns ProcessedComponent - The component with processed consumption
 */
export function processManualFormulaConsumption(
  component: ProcessedComponent, 
  orderQuantity: number
): ProcessedComponent {
  if (!component || !isManualFormula(component)) {
    return component;
  }
  
  const currentConsumption = parseFloat(String(component.consumption || 0));
  
  // Store original consumption before processing
  if (!component.originalConsumption) {
    component.originalConsumption = currentConsumption;
  }
  
  // Calculate new consumption by multiplying with order quantity
  const processedConsumption = currentConsumption * orderQuantity;
  
  console.log(`Processing manual formula for ${component.type}:`, {
    originalConsumption: currentConsumption,
    orderQuantity,
    processedConsumption,
    formula: component.formula
  });
  
  return {
    ...component,
    consumption: processedConsumption,
    originalConsumption: currentConsumption
  };
}

/**
 * Processes all components in an order, handling manual formulas appropriately
 * @param components - Array of components to process
 * @param orderQuantity - The order quantity for multiplication
 * @returns ProcessedComponent[] - Array of processed components
 */
export function processOrderComponents(
  components: ProcessedComponent[], 
  orderQuantity: number
): ProcessedComponent[] {
  if (!components || components.length === 0) {
    console.log("No components to process");
    return components;
  }
  
  if (!orderQuantity || orderQuantity <= 0) {
    console.warn("Invalid order quantity for manual formula processing:", orderQuantity);
    return components;
  }
  
  console.log(`Processing ${components.length} components with order quantity: ${orderQuantity}`);
  
  const processedComponents = components.map(component => {
    if (isManualFormula(component)) {
      return processManualFormulaConsumption(component, orderQuantity);
    }
    return component;
  });
  
  // Log summary of processed components
  const manualComponents = processedComponents.filter(comp => isManualFormula(comp));
  console.log(`Manual formula processing complete:`, {
    totalComponents: processedComponents.length,
    manualComponents: manualComponents.length,
    processedManualComponents: manualComponents.map(comp => ({
      type: comp.type,
      originalConsumption: comp.originalConsumption,
      processedConsumption: comp.consumption,
      formula: comp.formula
    }))
  });
  
  return processedComponents;
}

/**
 * Validates that manual formula processing was applied correctly
 * @param components - Components to validate
 * @param orderQuantity - Expected order quantity
 * @returns boolean - True if validation passes
 */
export function validateManualFormulaProcessing(
  components: ProcessedComponent[], 
  orderQuantity: number
): boolean {
  let validationPassed = true;
  
  components.forEach(component => {
    if (isManualFormula(component)) {
      const expectedConsumption = (component.originalConsumption as number || 0) * orderQuantity;
      const actualConsumption = parseFloat(String(component.consumption || 0));
      
      if (Math.abs(expectedConsumption - actualConsumption) > 0.001) {
        console.error(`Manual formula validation failed for ${component.type}:`, {
          expected: expectedConsumption,
          actual: actualConsumption,
          originalConsumption: component.originalConsumption,
          orderQuantity
        });
        validationPassed = false;
      }
    }
  });
  
  if (validationPassed) {
    console.log("Manual formula processing validation passed");
  } else {
    console.error("Manual formula processing validation failed");
  }
  
  return validationPassed;
}

/**
 * Utility function to get manual formula components from a list
 * @param components - Components to filter
 * @returns ProcessedComponent[] - Only components with manual formulas
 */
export function getManualFormulaComponents(components: ProcessedComponent[]): ProcessedComponent[] {
  return components.filter(isManualFormula);
}

/**
 * Utility function to get the total consumption of manual formula components
 * @param components - Components to analyze
 * @returns number - Total consumption of manual formula components
 */
export function getTotalManualFormulaConsumption(components: ProcessedComponent[]): number {
  const manualComponents = getManualFormulaComponents(components);
  return manualComponents.reduce((total, component) => {
    return total + parseFloat(String(component.consumption || 0));
  }, 0);
}
