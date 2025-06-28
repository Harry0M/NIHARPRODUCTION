import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderDetailsForm } from "@/components/orders/OrderDetailsForm";
import { CostCalculationDisplay } from "@/components/orders/CostCalculationDisplay";
import { useOrderForm } from "@/hooks/use-order-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { OrderFormOptimizer, setupCacheInterceptor, optimizeComponentRendering } from "@/components/optimization/OrderFormOptimizer";
import { useEffect } from "react";

const OrderNew = () => {
  const navigate = useNavigate();
  
  const {
    orderDetails,
    components,
    customComponents,
    submitting,
    formErrors,
    handleOrderChange,
    handleProductSelect,
    handleSubmit,
    validateForm,
    updateConsumptionBasedOnQuantity,
    costCalculation, // Get the cost calculation
    updateMargin, // Add function to update margin
    updateCostCalculation // Add function to update cost calculation
  } = useOrderForm();
  
  // Initialize performance optimizations when component mounts
  useEffect(() => {
    // Set up the cache interceptor for API requests
    setupCacheInterceptor();
    
    // Apply rendering optimizations after component is mounted
    const timer = setTimeout(() => {
      optimizeComponentRendering();
    }, 500); // Wait for the component to fully render
    
    return () => {
      clearTimeout(timer);
    };
  }, []);
  
  const onSubmit = async (e: React.FormEvent) => {
    if (!validateForm()) {
      return;
    }
    
    const orderId = await handleSubmit(e);
    if (orderId) {
      // Use window.location.href instead of navigate for reliable page refresh
      window.location.href = `/orders/${orderId}`;
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
      
      {/* Debug information card removed */}      <form onSubmit={onSubmit} className="space-y-6">
        <OrderDetailsForm 
          formData={orderDetails}
          handleOrderChange={handleOrderChange}
          onProductSelect={handleProductSelect}
          formErrors={formErrors}
          updateConsumptionBasedOnQuantity={updateConsumptionBasedOnQuantity}
        />
        
        {/* Component sections removed - will be handled at save time */}
        
        {/* Cost Calculation Display */}
        {costCalculation && (
          <Card>
            <CardHeader>
              <CardTitle>Cost Calculation</CardTitle>
              <CardDescription>Order cost breakdown and pricing</CardDescription>
            </CardHeader>
            <CardContent>
              <CostCalculationDisplay 
                costCalculation={costCalculation}
                onMarginChange={updateMargin}
                onCostCalculationUpdate={updateCostCalculation}
                orderQuantity={parseInt(orderDetails.quantity || '1')}
                components={components}
                customComponents={customComponents}
              />
            </CardContent>
          </Card>
        )}
        
        {/* Form Actions - Always visible, moved outside of collapsible section */}
        <Card>
          <CardFooter>
            <div className="flex justify-end gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.location.href = "/orders"}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Order"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
    </OrderFormOptimizer>
  );
};

export default OrderNew;
