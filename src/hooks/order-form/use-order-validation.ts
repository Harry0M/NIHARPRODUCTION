
import { OrderFormData } from "@/types/order";

interface FormErrors {
  company?: string;
  quantity?: string;
  bag_length?: string;
  bag_width?: string;
  order_date?: string;
}

export function useOrderValidation(
  orderDetails: OrderFormData,
  setFormErrors: React.Dispatch<React.SetStateAction<FormErrors>>
) {
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    // Validate company information
    if (!orderDetails.company_name && !orderDetails.company_id) {
      errors.company = "Company name is required";
      isValid = false;
    }

    // Validate quantity
    if (!orderDetails.quantity || parseFloat(orderDetails.quantity) <= 0) {
      errors.quantity = "Valid quantity is required";
      isValid = false;
    }

    // Validate bag length
    if (!orderDetails.bag_length || parseFloat(orderDetails.bag_length) <= 0) {
      errors.bag_length = "Valid bag length is required";
      isValid = false;
    }

    // Validate bag width
    if (!orderDetails.bag_width || parseFloat(orderDetails.bag_width) <= 0) {
      errors.bag_width = "Valid bag width is required";
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
