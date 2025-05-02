
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
    
    // Update consumption values when quantity changes
    if (updateConsumptionBasedOnQuantity && e.target.value) {
      const quantity = parseFloat(e.target.value);
      if (!isNaN(quantity)) {
        updateConsumptionBasedOnQuantity(quantity);
      }
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
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
          placeholder="Number of bags"
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
  );
};
