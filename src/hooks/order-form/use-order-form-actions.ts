
import { toast } from "sonner";
import { OrderFormData, ComponentData } from "@/types/order";
import { validateOrderForm } from "./validation";
import { submitOrder } from "./submit";

interface OrderFormActionsProps {
  orderDetails: OrderFormData;
  formErrors: {
    company?: string;
    quantity?: string;
    bag_length?: string;
    bag_width?: string;
    order_date?: string;
  };
  setOrderDetails: React.Dispatch<React.SetStateAction<OrderFormData>>;
  setFormErrors: React.Dispatch<React.SetStateAction<{
    company?: string | undefined;
    quantity?: string | undefined;
    bag_length?: string | undefined;
    bag_width?: string | undefined;
    order_date?: string | undefined;
  }>>;
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  components: Record<string, ComponentData>;
  customComponents: ComponentData[];
}

interface OrderFormActions {
  handleOrderChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { 
    target: { name: string; value: string | null } 
  }) => void;
  validateForm: () => boolean;
  handleSubmit: (e: React.FormEvent) => Promise<string | null>;
}

export const useOrderFormActions = ({
  orderDetails,
  formErrors,
  setOrderDetails,
  setFormErrors,
  setSubmitting,
  components,
  customComponents
}: OrderFormActionsProps): OrderFormActions => {
  
  // Handle changes to order details
  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { 
    target: { name: string; value: string | null } 
  }) => {
    const { name, value } = e.target;
    
    setOrderDetails(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when field is updated
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  // Validate form before submission
  const validateForm = () => {
    const errors = validateOrderForm(orderDetails);
    
    // Update error state and return validation result
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      toast.error("Please correct the errors in the form");
      return null;
    }
    
    setSubmitting(true);
    
    try {
      const orderId = await submitOrder(orderDetails, components, customComponents);
      return orderId;
    } finally {
      setSubmitting(false);
    }
  };
  
  return {
    handleOrderChange,
    validateForm,
    handleSubmit
  };
};
