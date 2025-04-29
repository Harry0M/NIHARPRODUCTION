
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrderForm } from "@/hooks/use-order-form";
import { OrderFormContent } from "./components/OrderFormContent";
import { PageHeader } from "./components/PageHeader";

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
      <PageHeader navigate={navigate} />
      
      <form onSubmit={onSubmit} className="space-y-6">
        <OrderFormContent 
          orderDetails={orderDetails}
          components={components}
          customComponents={customComponents}
          submitting={submitting}
          formErrors={formErrors}
          handleOrderChange={handleOrderChange}
          handleComponentChange={handleComponentChange}
          handleCustomComponentChange={handleCustomComponentChange}
          addCustomComponent={addCustomComponent}
          removeCustomComponent={removeCustomComponent}
          handleProductSelect={handleProductSelect}
          navigate={navigate}
        />
      </form>
    </div>
  );
};

export default OrderNew;
