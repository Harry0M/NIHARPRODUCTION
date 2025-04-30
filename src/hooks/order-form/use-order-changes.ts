
import React from "react";
import { OrderFormData } from "@/types/order";

interface UseOrderChangesProps {
  orderDetails: OrderFormData;
  setOrderDetails: React.Dispatch<React.SetStateAction<OrderFormData>>;
  formErrors: Record<string, string | undefined>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string | undefined>>>;
  updateComponentConsumptions: (quantityStr: string) => void;
  selectedProductId: string | null;
}

export function useOrderChanges({
  orderDetails,
  setOrderDetails,
  formErrors,
  setFormErrors,
  updateComponentConsumptions,
  selectedProductId
}: UseOrderChangesProps) {
  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { 
    target: { name: string; value: string | null } 
  }) => {
    const { name, value } = e.target;
    
    // Handle special case for sales_account_id
    if (name === 'sales_account_id') {
      setOrderDetails(prev => ({
        ...prev,
        [name]: value === 'none' ? null : value
      }));
    } else {
      setOrderDetails(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // If we're changing the quantity, update component consumption values if BOM is selected
    if (name === 'quantity' && selectedProductId) {
      updateComponentConsumptions(value as string);
    }
    
    // Clear validation error when field is changed
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  return { handleOrderChange };
}
