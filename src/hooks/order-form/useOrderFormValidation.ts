
import { useState } from "react";
import { OrderFormData } from "@/types/order";
import { FormErrors } from "@/types/order-form";

export function useOrderFormValidation() {
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  const validateForm = (orderDetails: OrderFormData): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    // Validate company information
    if (!orderDetails.company_name) {
      errors.company = "Company name is required";
      isValid = false;
    }

    // Validate quantity
    if (!orderDetails.quantity || parseFloat(orderDetails.quantity) <= 0) {
      errors.quantity = "Valid quantity is required";
      isValid = false;
    }

    // Validate product quantity
    if (!orderDetails.product_quantity || parseFloat(orderDetails.product_quantity) <= 0) {
      errors.product_quantity = "Valid product quantity is required";
      isValid = false;
    }

    // Validate total quantity
    if (!orderDetails.total_quantity || parseFloat(orderDetails.total_quantity) <= 0) {
      errors.total_quantity = "Valid total quantity is required";
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

  const clearFieldError = (fieldName: keyof FormErrors) => {
    if (formErrors[fieldName]) {
      setFormErrors(prev => ({
        ...prev,
        [fieldName]: undefined
      }));
    }
  };
  
  return {
    formErrors,
    setFormErrors,
    validateForm,
    clearFieldError
  };
}
