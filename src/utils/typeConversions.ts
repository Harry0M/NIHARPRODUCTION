
/**
 * This utility provides functions for safely converting between string and number types
 * to prevent TypeScript errors when dealing with form inputs and API data.
 */

/**
 * Converts a value to string, handling null/undefined
 */
export const toStringValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

/**
 * Converts a value to number, handling null/undefined/empty strings
 */
export const toNumberValue = (value: string | number | null | undefined): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? undefined : num;
};

/**
 * Safely converts a component property that might be a number to a string
 * for use in form inputs or API calls requiring string types
 */
export const componentValueToString = (prop: string | number | null | undefined): string => {
  return toStringValue(prop);
};

/**
 * Safely converts a component property that might be a string to a number
 * for use in calculations or API calls requiring number types
 */
export const componentValueToNumber = (prop: string | number | null | undefined): number | undefined => {
  return toNumberValue(prop);
};

/**
 * Type guard to check if a value exists (not null or undefined)
 */
export const valueExists = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};
