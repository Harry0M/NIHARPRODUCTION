import { SalesBill } from "@/types/salesBill";

/**
 * Validates sales bill data before PDF generation or submission
 * @param bill The sales bill to validate
 * @returns An object containing validation status and any error messages
 */
export const validateSalesBill = (bill: SalesBill | null | undefined): { 
  isValid: boolean; 
  errors: string[] 
} => {
  const errors: string[] = [];
  
  if (!bill) {
    errors.push('Sales bill data is missing');
    return { isValid: false, errors };
  }
  
  if (!bill.bill_number) {
    errors.push('Bill number is required');
  }
  
  if (!bill.bill_date) {
    errors.push('Bill date is required');
  }
  
  if (!bill.company_name) {
    errors.push('Company name is required');
  }
  
  if (!bill.catalog_name) {
    errors.push('Product/catalog name is required');
  }
  
  if (typeof bill.quantity !== 'number' || bill.quantity <= 0) {
    errors.push('Valid quantity is required');
  }
  
  if (typeof bill.rate !== 'number' || bill.rate < 0) {
    errors.push('Valid rate is required');
  }
  
  if (typeof bill.gst_percentage !== 'number' || bill.gst_percentage < 0) {
    errors.push('Valid GST percentage is required');
  }
  
  if (typeof bill.transport_charge !== 'number' || bill.transport_charge < 0) {
    errors.push('Valid transport charge is required');
  }
  
  if (typeof bill.total_amount !== 'number' || bill.total_amount <= 0) {
    errors.push('Valid total amount is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates and formats payment values
 * @param amount The amount to validate
 * @returns The validated amount
 */
export const validateAmount = (amount: any): number => {
  const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(parsedAmount) || parsedAmount < 0) {
    throw new Error('Invalid amount value');
  }
  
  return parsedAmount;
};
