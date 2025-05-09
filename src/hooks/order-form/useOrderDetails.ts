
import { useState } from "react";
import { OrderFormData } from "@/types/order";
import { useOrderFormValidation } from "./useOrderFormValidation";

export function useOrderDetails() {
  const [orderDetails, setOrderDetails] = useState<OrderFormData>({
    company_name: "",
    company_id: null,
    quantity: "",
    product_quantity: "1", // Default to 1 for product quantity
    total_quantity: "", // Will be calculated as product_quantity * quantity
    bag_length: "",
    bag_width: "",
    border_dimension: "",
    rate: "",
    special_instructions: "",
    sales_account_id: null,
    order_date: new Date().toISOString().split('T')[0],
    // Cost calculation fields
    margin: "",
    material_cost: "",
    production_cost: "",
    total_cost: "",
    calculated_selling_price: "",
    template_margin: "",
    // Production costs - these need to be stored for calculation purposes
    cutting_charge: "",
    printing_charge: "",
    stitching_charge: "",
    transport_charge: ""
  });
  
  const { clearFieldError } = useOrderFormValidation();
  
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

      // If quantity or product_quantity changed, calculate total quantity
      if ((name === 'quantity' || name === 'product_quantity') && value) {
        const orderQty = name === 'quantity' ? parseFloat(value as string) : parseFloat(orderDetails.quantity || "1");
        const productQty = name === 'product_quantity' ? parseFloat(value as string) : parseFloat(orderDetails.product_quantity || "1");
        
        if (!isNaN(orderQty) && !isNaN(productQty)) {
          const totalQty = orderQty * productQty;
          
          // Update total_quantity in orderDetails
          setOrderDetails(prev => ({
            ...prev,
            total_quantity: totalQty.toString()
          }));
        }
      }
    }
    
    // Clear validation error when field is changed
    clearFieldError(name as any);
  };
  
  return {
    orderDetails,
    setOrderDetails,
    handleOrderChange
  };
}
