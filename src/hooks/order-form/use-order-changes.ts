
import { OrderFormData } from "@/types/order";

interface OrderChangesProps {
  orderDetails: OrderFormData;
  setOrderDetails: React.Dispatch<React.SetStateAction<OrderFormData>>;
  formErrors: Record<string, string>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  updateComponentConsumptions: (quantity: string) => void;
  selectedProductId: string | null;
}

export function useOrderChanges({
  orderDetails,
  setOrderDetails,
  formErrors,
  setFormErrors,
  updateComponentConsumptions,
  selectedProductId
}: OrderChangesProps) {
  
  // Handle changes to the order form fields
  const handleOrderChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { 
      target: { name: string; value: string | null } 
    }
  ) => {
    const { name, value } = e.target;
    
    // Update the form data
    setOrderDetails(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear any error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Special case for quantity changes - recalculate component consumption if product is selected
    if (name === 'quantity' && selectedProductId) {
      updateComponentConsumptions(value as string);
    }
  };
  
  return { handleOrderChange };
}
