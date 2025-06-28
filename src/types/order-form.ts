import { OrderFormData } from "@/types/order";
import { ConsumptionFormulaType } from "@/components/production/ConsumptionCalculator";

export interface Component {
  id: string;
  type: string;
  customName?: string;
  color?: string;
  gsm?: string;
  length?: string;
  width?: string;
  consumption?: string;
  fetchedConsumption?: string; // Store the original fetched consumption value
  roll_width?: string;
  materialRate?: number;
  materialCost?: number;
  material_id?: string;
  // New fields for tracking final consumption values
  finalConsumptionValue?: string;
  exactConsumption?: string;  // Additional fields for cost calculation
  formula?: ConsumptionFormulaType;
  component_cost?: number;
  component_cost_breakdown?: {
    material_cost: number;
    material_rate: number;
    consumption: number | null;
  };
}

export interface FormErrors {
  company?: string;
  quantity?: string;
  bag_length?: string;
  bag_width?: string;
  order_date?: string;
  order_number?: string;
  product_quantity?: string;
  total_quantity?: string;
  product_id?: string;
}

export interface CostCalculation {
  materialCost: number;
  cuttingCharge: number;
  printingCharge: number;
  stitchingCharge: number;
  transportCharge: number;
  baseCost: number;
  gstAmount: number;
  totalCost: number;
  margin: number;
  sellingPrice: number;
  // Per unit costs
  perUnitBaseCost: number;
  perUnitTransportCost: number;
  perUnitGstCost: number;
  perUnitCost: number;
}

export interface UseOrderFormReturn {
  orderDetails: OrderFormData;
  components: Record<string, Component>;
  customComponents: Component[];
  submitting: boolean;
  formErrors: FormErrors;
  handleOrderChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { 
    target: { name: string; value: string | null } 
  }) => void;
  handleComponentChange: (type: string, field: string, value: string) => void;
  handleCustomComponentChange: (index: number, field: string, value: string) => void;
  addCustomComponent: () => void;
  removeCustomComponent: (index: number) => void;
  handleProductSelect: (components: Component[]) => void;
  handleSubmit: (e: React.FormEvent, orderId?: string) => Promise<string | undefined>;
  validateForm: () => boolean;
  updateConsumptionBasedOnQuantity: (quantity: number) => void;
  costCalculation?: CostCalculation;
  updateMargin?: (margin: number) => void;
  updateCostCalculation?: (updatedCosts: CostCalculation) => void;
}
