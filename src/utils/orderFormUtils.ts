/**
 * Converts a string value to a numeric value, returning null if the conversion fails
 */
export const convertStringToNumeric = (value: string | undefined | null): number | null => {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const numValue = parseFloat(value);
  return isNaN(numValue) ? null : numValue;
};

/**
 * Validates component data to ensure required fields exist and numeric fields are valid
 */
export const validateComponentData = (component: any): boolean => {
  if (!component) {
    console.warn("Invalid component data: component is null or undefined");
    return false;
  }
  
  // Log the component being validated
  console.log("Validating component:", component);
  
  // Debug component type
  debugComponentType(component);
  
  // Check for required type field (using either type or component_type)
  if (!component.type && !component.component_type) {
    console.warn("Invalid component data: missing type/component_type", component);
    return false;
  }
  
  // We'll make validation less strict - only validate numeric fields if they exist
  // but don't require them to exist
  if (component.length && isNaN(parseFloat(component.length))) {
    console.warn("Invalid component data: length is not a valid number", component);
    return false;
  }
  
  if (component.width && isNaN(parseFloat(component.width))) {
    console.warn("Invalid component data: width is not a valid number", component);
    return false;
  }
  
  if (component.roll_width && isNaN(parseFloat(component.roll_width))) {
    console.warn("Invalid component data: roll_width is not a valid number", component);
    return false;
  }
  
  if (component.consumption && isNaN(parseFloat(component.consumption))) {
    console.warn("Invalid component data: consumption is not a valid number", component);
    return false;
  }
  
  if (component.gsm && isNaN(parseFloat(component.gsm))) {
    console.warn("Invalid component data: gsm is not a valid number", component);
    return false;
  }
  
  // Component passed validation
  console.log("Component validation passed for:", component.type || component.component_type);
  return true;
};

/**
 * Helper function to debug component type issues
 */
export const debugComponentType = (component: any): void => {
  if (!component) return;
  
  const type = component.type || component.component_type;
  const typeToString = String(type || '');
  const typeLower = typeToString.toLowerCase();
  
  // Valid types for database
  const validTypes = ['part', 'border', 'chain', 'piping', 'runner', 'handle', 'custom'];
  const isValidType = validTypes.includes(typeLower);
  
  console.log("Component type debug:", {
    originalType: type,
    typeAsString: typeToString,
    typeLower,
    isValidType,
    component_type: component.component_type,
    hasFormula: !!component.formula
  });
};

/**
 * Helper function to check all components for potential issues
 * This can be called from the browser console to debug component issues
 */
export const debugAllComponents = (components: Record<string, any>, customComponents: any[]): void => {
  // First, create a global variable for easy access in browser console
  (window as any).orderComponentDebug = {
    timestamp: new Date().toISOString(),
    standardComponents: components,
    customComponents
  };
  
  console.log("%c ORDER SUBMISSION COMPONENT DATA", "background: blue; color: white; font-size: 16px; padding: 5px;");
  
  // Log specific consumption values that will be saved to the database
  console.log("%c CONSUMPTION VALUES BEING SAVED TO DATABASE", "background: red; color: white; font-size: 14px; padding: 3px;");
  
  // Standard components consumption values
  Object.entries(components).forEach(([type, comp]) => {
    if (comp && comp.consumption) {
      console.log(`${type} consumption: ${comp.consumption} (${typeof comp.consumption})`);
    }
  });
  
  // Custom components consumption values
  customComponents.forEach((comp, index) => {
    if (comp && comp.consumption) {
      console.log(`Custom ${index} consumption: ${comp.consumption} (${typeof comp.consumption})`);
    }
  });
  console.log("Debug data saved to window.orderComponentDebug");
  console.log("To inspect in console: console.log(window.orderComponentDebug)");
  
  // Log summary
  const allComponents = [
    ...Object.values(components).filter(Boolean),
    ...customComponents
  ].filter(Boolean);
  
  console.log(`Total components: ${allComponents.length} (${Object.values(components).filter(Boolean).length} standard, ${customComponents.length} custom)`);
  
  // Check for common issues
  const componentsWithoutFormula = allComponents.filter(c => !c.formula);
  const componentsWithInvalidType = allComponents.filter(c => {
    const type = (c.type || '').toLowerCase();
    return !['part', 'border', 'chain', 'piping', 'runner', 'handle', 'custom'].includes(type);
  });
  
  if (componentsWithoutFormula.length > 0) {
    console.warn(`Found ${componentsWithoutFormula.length} components without formula field`);
    console.warn(componentsWithoutFormula);
  }
  
  if (componentsWithInvalidType.length > 0) {
    console.error(`Found ${componentsWithInvalidType.length} components with invalid type`);
    console.error(componentsWithInvalidType);
  }
  
  return;
};

/**
 * Calculates consumption based on dimensions and quantity
 */
export const calculateConsumption = (
  length: string | number,
  width: string | number,
  rollWidth: string | number
): number | null => {
  const lengthVal = typeof length === 'string' ? parseFloat(length) : length;
  const widthVal = typeof width === 'string' ? parseFloat(width) : width;
  const rollWidthVal = typeof rollWidth === 'string' ? parseFloat(rollWidth) : rollWidth;
  
  if (isNaN(lengthVal) || isNaN(widthVal) || isNaN(rollWidthVal) || rollWidthVal <= 0) {
    return null;
  }
  
  // Formula: (length * width) / (roll_width * 39.39)
  return (lengthVal * widthVal) / (rollWidthVal * 39.39);
};
