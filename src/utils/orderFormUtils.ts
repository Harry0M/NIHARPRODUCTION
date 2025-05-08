
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
  
  // Check for required type field (using either type or component_type)
  if (!component.type && !component.component_type) {
    console.warn("Invalid component data: missing type/component_type", component);
    return false;
  }
  
  // Validate numeric fields to ensure they're not NaN when parsed
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
  
  return true;
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
