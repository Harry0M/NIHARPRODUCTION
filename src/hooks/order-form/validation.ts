
import { OrderFormData } from "@/types/order";

export interface FormErrors {
  company?: string;
  quantity?: string;
  bag_length?: string;
  bag_width?: string;
  order_date?: string;
}

export const validateOrderForm = (orderDetails: OrderFormData): FormErrors => {
  const errors: FormErrors = {};
  
  // Validate required fields
  if (!orderDetails.company_name?.trim()) {
    errors.company = "Company name is required";
  }
  
  if (!orderDetails.quantity) {
    errors.quantity = "Quantity is required";
  } else if (parseInt(orderDetails.quantity) <= 0) {
    errors.quantity = "Quantity must be greater than 0";
  }
  
  if (!orderDetails.bag_length) {
    errors.bag_length = "Bag length is required";
  } else if (parseFloat(orderDetails.bag_length) <= 0) {
    errors.bag_length = "Length must be greater than 0";
  }
  
  if (!orderDetails.bag_width) {
    errors.bag_width = "Bag width is required";
  } else if (parseFloat(orderDetails.bag_width) <= 0) {
    errors.bag_width = "Width must be greater than 0";
  }
  
  if (!orderDetails.order_date) {
    errors.order_date = "Order date is required";
  }
  
  return errors;
};
