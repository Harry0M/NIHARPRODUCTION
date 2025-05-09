
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderDetailsForm } from "@/components/orders/OrderDetailsForm";
import { StandardComponents } from "@/components/orders/StandardComponents";
import { CustomComponentSection } from "@/components/orders/CustomComponentSection";
import { CostSummaryCard } from "@/components/orders/CostSummaryCard";
import { useOrderForm } from "@/hooks/use-order-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const componentOptions = {
  color: ["Red", "Blue", "Green", "Black", "White", "Yellow", "Brown", "Orange", "Purple", "Gray", "Custom"],
  // gsm has been removed as requested
};

const OrderNew = () => {
  const navigate = useNavigate();
  const {
    orderDetails,
    components,
    customComponents,
    submitting,
    formErrors,
    costData,
    handleOrderChange,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent,
    handleProductSelect,
    handleSubmit,
    validateForm,
    updateConsumptionBasedOnQuantity,
    updateCostCalculations
  } = useOrderForm();
  
  const onSubmit = async (e: React.FormEvent) => {
    if (!validateForm()) {
      return;
    }
    
    const orderId = await handleSubmit(e);
    if (orderId) {
      navigate(`/orders/${orderId}`);
    }
  };
  
  // Handle margin change from cost summary card
  const handleMarginChange = (margin: string) => {
    handleOrderChange({ target: { name: 'margin', value: margin } });
    setTimeout(updateCostCalculations, 100);
  };
  
  // Calculate total consumption for all components
  const totalConsumption = [...Object.values(components), ...customComponents]
    .reduce((total, comp) => {
      const consumption = comp.consumption ? parseFloat(comp.consumption) : 0;
      return isNaN(consumption) ? total : total + consumption;
    }, 0);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => navigate("/orders")}
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Bag Components</CardTitle>
                <CardDescription className="flex justify-between items-center">
                  <span>Specify the details for each component of the bag</span>
                  {totalConsumption > 0 && (
                    <span className="font-medium text-sm bg-blue-50 text-blue-800 px-3 py-1 rounded-full">
                      Total Consumption: {totalConsumption.toFixed(2)} meters
                    </span>
                  )}
                </CardDescription>
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
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/orders")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Creating..." : "Create Order"}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
          
          <div className="md:col-span-1">
            <CostSummaryCard 
              costData={costData}
              orderDetails={orderDetails}
              onMarginChange={handleMarginChange}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default OrderNew;
