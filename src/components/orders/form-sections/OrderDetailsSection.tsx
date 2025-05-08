
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { OrderFormData } from "@/types/order";

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

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleOrderChange(e);
    
    // Calculate total quantity when order quantity changes
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
        
        // Update consumption based on total quantity
        if (updateConsumptionBasedOnQuantity) {
          updateConsumptionBasedOnQuantity(totalQty);
        }
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="product_quantity" className="flex items-center gap-1">
            Product Quantity
          </Label>
          <Input 
            id="product_quantity" 
            name="product_quantity"
            type="number"
            value={formData.product_quantity}
            onChange={handleOrderChange}
            placeholder="Units per product"
            className={formErrors.product_quantity ? "border-destructive" : ""}
            readOnly
            min="1"
          />
          {formErrors.product_quantity && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {formErrors.product_quantity}
            </p>
          )}
        </div>
        
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
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="total_quantity" className="flex items-center gap-1">
            Total Quantity
            <span className="text-blue-600">*</span>
          </Label>
          <Input 
            id="total_quantity" 
            name="total_quantity"
            type="number"
            value={formData.total_quantity}
            onChange={handleOrderChange}
            placeholder="Total units"
            className={formErrors.total_quantity ? "border-destructive" : "bg-blue-50"}
            readOnly
          />
          {formErrors.total_quantity && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {formErrors.total_quantity}
            </p>
          )}
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
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
