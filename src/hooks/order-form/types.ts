
import { OrderFormData, OrderStatus, ComponentData } from "@/types/order";

export interface OrderFormHookState {
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
}

export interface OrderFormHookActions {
  handleOrderChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { 
    target: { name: string; value: string | null } 
  }) => void;
  handleComponentChange: (type: string, field: string, value: string) => void;
  handleCustomComponentChange: (index: number, field: string, value: string) => void;
  addCustomComponent: () => void;
  removeCustomComponent: (index: number) => void;
  handleProductSelect: (catalogComponents: any[]) => void;
  handleSubmit: (e: React.FormEvent) => Promise<string | null>;
  validateForm: () => boolean;
}

export type UseOrderFormHook = OrderFormHookState & OrderFormHookActions;
