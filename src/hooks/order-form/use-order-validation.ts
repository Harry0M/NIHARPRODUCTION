
import { OrderFormData, FormErrors } from "@/types/order";

export function useOrderValidation(
  orderDetails: OrderFormData,
  setFormErrors: React.Dispatch<React.SetStateAction<FormErrors>>
) {
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    // Check for empty company name
    if (!orderDetails.company_name && !orderDetails.company_id) {
      errors.company = "Company name is required";
      isValid = false;
    }

    // Validate quantity
    if (!orderDetails.quantity || parseInt(orderDetails.quantity) <= 0) {
      errors.quantity = "Quantity must be greater than 0";
      isValid = false;
    }

    // Validate bag dimensions
    if (!orderDetails.bag_length || parseFloat(orderDetails.bag_length) <= 0) {
      errors.bag_length = "Length must be greater than 0";
      isValid = false;
    }

    if (!orderDetails.bag_width || parseFloat(orderDetails.bag_width) <= 0) {
      errors.bag_width = "Width must be greater than 0";
      isValid = false;
    }
    
    // Validate order date
    if (!orderDetails.order_date) {
      errors.order_date = "Order date is required";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  return { validateForm };
}
