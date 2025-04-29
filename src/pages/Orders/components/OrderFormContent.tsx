
import { NavigateFunction } from "react-router-dom";
import { OrderDetailsForm } from "@/components/orders/OrderDetailsForm";
import { OrderComponentsCard } from "./OrderComponentsCard";
import { OrderFormData, ComponentData } from "@/types/order";

interface OrderFormContentProps {
  orderDetails: OrderFormData;
  components: Record<string, ComponentData>;
  customComponents: ComponentData[];
  submitting: boolean;
  formErrors: {
    company?: string;
    quantity?: string;
    bag_length?: string;
    bag_width?: string;
    order_date?: string;
  };
  handleOrderChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { 
    target: { name: string; value: string | null } 
  }) => void;
  handleComponentChange: (type: string, field: string, value: string) => void;
  handleCustomComponentChange: (index: number, field: string, value: string) => void;
  addCustomComponent: () => void;
  removeCustomComponent: (index: number) => void;
  handleProductSelect: (catalogComponents: any[]) => void;
  navigate: NavigateFunction;
}

export const OrderFormContent = ({
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
  navigate
}: OrderFormContentProps) => {
  return (
    <>
      <OrderDetailsForm 
        formData={orderDetails}
        handleOrderChange={handleOrderChange}
        onProductSelect={handleProductSelect}
        formErrors={formErrors}
      />
      
      <OrderComponentsCard 
        components={components}
        customComponents={customComponents}
        handleComponentChange={handleComponentChange}
        handleCustomComponentChange={handleCustomComponentChange}
        addCustomComponent={addCustomComponent}
        removeCustomComponent={removeCustomComponent}
        navigate={navigate}
        submitting={submitting}
      />
    </>
  );
};
