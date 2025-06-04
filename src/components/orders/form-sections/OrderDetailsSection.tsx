
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { OrderFormData } from "@/types/order";
import { useRef } from "react";

interface OrderDetailsSectionProps {
  formData: OrderFormData;
  handleOrderChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  formErrors: {
    quantity?: string;
    order_date?: string;
    product_quantity?: string;
    total_quantity?: string;
  };
  updateConsumptionBasedOnQuantity?: (quantity: number) => void;
}

export const OrderDetailsSection = ({
  formData,
  handleOrderChange,
  formErrors,
  updateConsumptionBasedOnQuantity
}: OrderDetailsSectionProps) => {
  // Use ref to track and clear timeout between renders
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // First handle the basic order change to update the form data
    handleOrderChange(e);
    
    // Set order_quantity to the same value as quantity when quantity changes
    if (e.target.name === "quantity") {
      const orderQty = parseFloat(e.target.value);
      const productQty = parseFloat(formData.product_quantity || "1");
      
      if (!isNaN(orderQty) && !isNaN(productQty)) {
        const totalQty = orderQty * productQty;
        
        // Set total quantity
        const totalQtyEvent = {
          target: {
            name: "total_quantity",
            value: totalQty.toString()
          }
        } as React.ChangeEvent<HTMLInputElement>;
        
        handleOrderChange(totalQtyEvent);
        
        // Also set order_quantity to the same value as quantity
        const orderQtyEvent = {
          target: {
            name: "order_quantity",
            value: e.target.value
          }
        } as React.ChangeEvent<HTMLInputElement>;
        
        handleOrderChange(orderQtyEvent);
        
        // For updating consumption, use a more substantial delay
        // This ensures all component data is properly loaded before calculation
        if (updateConsumptionBasedOnQuantity) {
          // When the quantity is 1, we need to be extra careful
          // as this could be the initial state setup
          const delay = orderQty === 1 ? 200 : 50;
          
          console.log(`Scheduling consumption update with quantity ${totalQty} after ${delay}ms delay`);
          
          // Clear any existing timeout to prevent multiple rapid updates
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          
          // Set a new timeout with appropriate delay
          timeoutRef.current = setTimeout(() => {
            console.log("Now updating consumption with quantity:", totalQty);
            updateConsumptionBasedOnQuantity(totalQty);
          }, delay);
        }
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden fields - necessary for functionality but not shown in UI */}
      <input 
        type="hidden" 
        name="product_quantity"
        value={formData.product_quantity || "1"}
        id="product_quantity"
      />
      <input 
        type="hidden" 
        name="total_quantity"
        value={formData.total_quantity || ""}
        id="total_quantity"
      />
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* Order Quantity Field */}
        <div className="space-y-2">
          <Label htmlFor="quantity" className="flex items-center gap-1">
            Order Quantity
            <span className="text-destructive">*</span>
          </Label>
          <Input 
            id="quantity" 
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleQuantityChange}
            placeholder="Number of products"
            required
            className={formErrors.quantity ? "border-destructive" : ""}
            min="1"
          />
          {formErrors.quantity && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {formErrors.quantity}
            </p>
          )}
          {formErrors.product_quantity && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {formErrors.product_quantity}
            </p>
          )}
          {formErrors.total_quantity && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {formErrors.total_quantity}
            </p>
          )}
        </div>

        {/* Order Quantity (Database) - Hidden but included in form data */}
        <div className="hidden">
          <Input 
            id="order_quantity" 
            name="order_quantity"
            type="number"
            value={formData.order_quantity || formData.quantity || "1"}
            onChange={handleOrderChange}
            min="1"
          />
        </div>

        {/* Order Date Field */}
        <div className="space-y-2">
          <Label htmlFor="order_date" className="flex items-center gap-1">
            Order Date
            <span className="text-destructive">*</span>
          </Label>
          <Input 
            id="order_date"
            name="order_date"
            type="date"
            value={formData.order_date}
            onChange={handleOrderChange}
            required
            className={formErrors.order_date ? "border-destructive" : ""}
          />
          {formErrors.order_date && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {formErrors.order_date}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
