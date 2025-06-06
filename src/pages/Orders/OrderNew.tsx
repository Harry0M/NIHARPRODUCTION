import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderDetailsForm } from "@/components/orders/OrderDetailsForm";
import { StandardComponents } from "@/components/orders/StandardComponents";
import { CustomComponentSection } from "@/components/orders/CustomComponentSection";
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
import { useEffect, useState } from "react";

const componentOptions = {
  color: ["Red", "Blue", "Green", "Black", "White", "Yellow", "Brown", "Orange", "Purple", "Gray", "Custom"],
  // gsm has been removed as requested
};

const OrderNew = () => {
  const navigate = useNavigate();
  const [showAdvancedSections, setShowAdvancedSections] = useState(false);
  
  const {
    orderDetails,
    components,
    customComponents,
    submitting,
    formErrors,
    handleOrderChange,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent,
    handleProductSelect,
    handleSubmit,
    validateForm,
    updateConsumptionBasedOnQuantity,
    costCalculation, // Get the cost calculation
    updateMargin // Add function to update margin
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
  
  // Calculate total consumption for all components
  const totalConsumption = [...Object.values(components), ...customComponents]
    .reduce((total, comp) => {
      const consumption = comp?.consumption ? parseFloat(comp.consumption) : 0;
      return isNaN(consumption) ? total : total + consumption;
    }, 0);
  
  // Count number of components for debugging
  const standardComponentCount = Object.values(components).filter(Boolean).length;
  const customComponentCount = customComponents.length;
  
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
        
        {/* See More Button */}
        {!showAdvancedSections && (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAdvancedSections(true)}
              className="flex items-center gap-2"
            >
              <span>See More</span>
              <ChevronDown size={16} />
            </Button>
          </div>
        )}
          {/* Collapsible Advanced Sections */}
        {showAdvancedSections && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bag Components</CardTitle>
                  <CardDescription className="flex justify-between items-center">
                    <span>Specify the details for each component of the bag</span>
                    {totalConsumption > 0 && (
                      <span className="font-medium text-sm bg-blue-50 text-blue-800 px-3 py-1 rounded-full">
                        Total Consumption: {totalConsumption.toFixed(2)} meters
                      </span>
                    )}
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedSections(false)}
                  className="flex items-center gap-1"
                >
                  <span>Show Less</span>
                  <ChevronUp size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <StandardComponents 
                  components={components}
                  componentOptions={componentOptions}
                  onChange={handleComponentChange}
                  defaultQuantity={orderDetails.total_quantity || orderDetails.quantity}
                  showConsumption={true}
                />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium">Custom Components</h2>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={addCustomComponent}
                    >
                      + Add Custom Component
                    </Button>
                  </div>
                    <CustomComponentSection
                    customComponents={customComponents}
                    componentOptions={componentOptions}
                    handleCustomComponentChange={handleCustomComponentChange}
                    removeCustomComponent={removeCustomComponent}
                    defaultQuantity={orderDetails.total_quantity || orderDetails.quantity}
                    showConsumption={true}
                  />
                </div>
                
                {/* Add Cost Calculation Display */}
                {costCalculation && (
                  <CostCalculationDisplay 
                    costCalculation={costCalculation}
                    onMarginChange={updateMargin}
                  />
                )}
              </div>
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
