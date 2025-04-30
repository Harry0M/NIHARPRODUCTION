
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { OrderFormData } from "@/types/order";
import { Component } from "@/types/order";

interface FormErrors {
  company?: string;
  quantity?: string;
  bag_length?: string;
  bag_width?: string;
  order_date?: string;
}

export function useOrderFormState() {
  const [submitting, setSubmitting] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderFormData>({
    company_name: "",
    company_id: null,
    quantity: "",
    bag_length: "",
    bag_width: "",
    rate: "",
    special_instructions: "",
    sales_account_id: null,
    order_date: new Date().toISOString().split('T')[0]
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [components, setComponents] = useState<Record<string, any>>({});
  const [customComponents, setCustomComponents] = useState<Component[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [totalMaterialCost, setTotalMaterialCost] = useState<number>(0);

  return {
    submitting,
    setSubmitting,
    orderDetails,
    setOrderDetails,
    formErrors,
    setFormErrors,
    components,
    setComponents,
    customComponents,
    setCustomComponents,
    selectedProductId,
    setSelectedProductId,
    totalMaterialCost,
    setTotalMaterialCost,
    addCustomComponent: () => {
      setCustomComponents([
        ...customComponents, 
        { 
          id: uuidv4(),
          type: "custom",
          customName: "" 
        }
      ]);
    },
    removeCustomComponent: (index: number) => {
      setCustomComponents(prev => prev.filter((_, i) => i !== index));
    }
  };
}
