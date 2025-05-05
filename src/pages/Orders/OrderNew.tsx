
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderDetailsForm } from "@/components/orders/OrderDetailsForm";
import { StandardComponents } from "@/components/orders/StandardComponents";
import { CustomComponentSection } from "@/components/orders/CustomComponentSection";
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
    handleOrderChange,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent,
    handleProductSelect,
    handleSubmit,
    validateForm
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
        
        <Card>
          <CardHeader>
            <CardTitle>Bag Components</CardTitle>
            <CardDescription>Specify the details for each component of the bag</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <StandardComponents 
                components={components}
                componentOptions={componentOptions}
                onChange={handleComponentChange}
                defaultQuantity={orderDetails.quantity}
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
                  defaultQuantity={orderDetails.quantity}
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
      </form>
    </div>
  );
};

export default OrderNew;
