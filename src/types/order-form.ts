
import { OrderFormData } from "@/types/order";

export interface Component {
  id: string;
  type: string;
  customName?: string;
  color?: string;
  gsm?: string;
  length?: string;
  width?: string;
  consumption?: string;
  baseConsumption?: string;
  roll_width?: string;
  materialRate?: number;
  materialCost?: number;
  material_id?: string;
  // New field to track if component is from a template
  fromTemplate?: boolean;
  componentCost?: number;
}

export interface FormErrors {
  company?: string;
  quantity?: string;
  bag_length?: string;
  bag_width?: string;
  order_date?: string;
  product_quantity?: string;
  total_quantity?: string;
}

export interface UseOrderFormReturn {
  orderDetails: OrderFormData;
  components: Record<string, any>;
  customComponents: Component[];
  submitting: boolean;
  formErrors: FormErrors;
  costData: {
    materialCost: number;
    productionCost: number;
    totalCost: number;
    sellingPrice: number;
    margin: number | null;
  };
  handleOrderChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { 
    target: { name: string; value: string | null } 
  }) => void;
  handleComponentChange: (type: string, field: string, value: string) => void;
  handleCustomComponentChange: (index: number, field: string, value: string) => void;
  addCustomComponent: () => void;
  removeCustomComponent: (index: number) => void;
  handleProductSelect: (components: any[]) => void;
  handleSubmit: (e: React.FormEvent) => Promise<string | undefined>;
  validateForm: () => boolean;
  updateConsumptionBasedOnQuantity: (quantity: number) => void;
  updateCostCalculations: () => void;
}
