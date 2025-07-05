
import { useState } from "react";
import { OrderFormData } from "@/types/order";

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
    rate_per_unit: "",
    special_instructions: "",
    sales_account_id: null,
    catalog_id: null, // Product catalog ID
    order_date: new Date().toISOString().split('T')[0],
    order_number: "" // Manual order number entry
  });
  
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
  };
  
  return {
    orderDetails,
    setOrderDetails,
    handleOrderChange
  };
}
