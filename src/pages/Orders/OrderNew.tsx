import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { OrderDetailsForm } from "@/components/orders/OrderDetailsForm";
import { useOrderForm } from "@/hooks/use-order-form";
import { OrderFormOptimizer } from "@/components/optimization/OrderFormOptimizer";

const OrderNew = () => {
  const navigate = useNavigate();
  
  const {
    orderDetails,
    handleOrderChange,
    handleProductSelect,
    formErrors,
    updateConsumptionBasedOnQuantity,
    handleSubmit,
    submitting
  } = useOrderForm();
  
  const onSubmit = async (e: React.FormEvent) => {
    console.log("Order submission started...");
    const orderId = await handleSubmit(e);
    console.log("Order submission completed, returned orderId:", orderId);
    
    if (orderId) {
      // Navigate to the order detail page instead of dashboard
      console.log("Navigating to order detail page:", `/orders/${orderId}`);
      navigate(`/orders/${orderId}`);
    } else {
      // If order creation failed, stay on the form page
      console.error("Order creation failed - no order ID returned");
    }
  };
  
  return (
    <OrderFormOptimizer>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = "/orders"}
            className="gap-1"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Order</h1>
            <p className="text-muted-foreground">Create a new order for production</p>
          </div>
        </div>
      </div>
      
      <form onSubmit={onSubmit} className="space-y-6">
        <OrderDetailsForm 
          formData={orderDetails}
          handleOrderChange={handleOrderChange}
          onProductSelect={handleProductSelect}
          formErrors={formErrors}
          updateConsumptionBasedOnQuantity={updateConsumptionBasedOnQuantity}
        />
        
        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate("/orders")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating Order..." : "Create Order"}
          </Button>
        </div>
      </form>
    </div>
    </OrderFormOptimizer>
  );
};

export default OrderNew;
