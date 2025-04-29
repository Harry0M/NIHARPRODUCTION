
import { useState } from "react";
import { OrderFormData, OrderStatus, ComponentData } from "@/types/order";

interface OrderFormState {
  orderDetails: OrderFormData;
  components: Record<string, ComponentData>;
  customComponents: ComponentData[];
  formErrors: {
    company?: string;
    quantity?: string;
    bag_length?: string;
    bag_width?: string;
    order_date?: string;
  };
  submitting: boolean;
  setOrderDetails: React.Dispatch<React.SetStateAction<OrderFormData>>;
  setComponents: React.Dispatch<React.SetStateAction<Record<string, ComponentData>>>;
  setCustomComponents: React.Dispatch<React.SetStateAction<ComponentData[]>>;
  setFormErrors: React.Dispatch<React.SetStateAction<{
    company?: string | undefined;
    quantity?: string | undefined;
    bag_length?: string | undefined;
    bag_width?: string | undefined;
    order_date?: string | undefined;
  }>>;
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useOrderFormState = (initialOrder?: OrderFormData): OrderFormState => {
  // Order details state
  const [orderDetails, setOrderDetails] = useState<OrderFormData>(initialOrder || {
    company_name: "",
    company_id: null,
    sales_account_id: null,
    quantity: "",
    bag_length: "",
    bag_width: "",
    rate: "",
    order_date: new Date().toISOString().split('T')[0],
    special_instructions: "",
    status: "pending" as OrderStatus,
  });
  
  // Form validation errors
  const [formErrors, setFormErrors] = useState<{
    company?: string;
    quantity?: string;
    bag_length?: string;
    bag_width?: string;
    order_date?: string;
  }>({});
  
  // Components state
  const [components, setComponents] = useState<Record<string, ComponentData>>({});
  
  // Custom components state
  const [customComponents, setCustomComponents] = useState<ComponentData[]>([]);
  
  // Loading/submitting state
  const [submitting, setSubmitting] = useState(false);
  
  return {
    orderDetails,
    components,
    customComponents,
    formErrors,
    submitting,
    setOrderDetails,
    setComponents,
    setCustomComponents,
    setFormErrors,
    setSubmitting
  };
};
