
import { Database } from "@/integrations/supabase/types";

export type OrderStatus = Database["public"]["Enums"]["order_status"];

export interface Order {
  id: string;
  order_number: string;
  company_name: string;
  company_id: string | null;
  quantity: number;
  bag_length: number;
  bag_width: number;
  border_dimension?: number | null;
  order_date: string;
  status: OrderStatus;
  rate: number | null;
  created_at: string;
  special_instructions?: string | null;
  sales_account_id?: string | null;
  // New cost fields
  margin?: number | null;
  material_cost?: number | null;
  production_cost?: number | null;
  total_cost?: number | null;
  calculated_selling_price?: number | null;
  template_margin?: number | null;
}

export interface OrderFormData {
  company_name: string;
  company_id: string | null;
  quantity: string;
  product_quantity: string;
  total_quantity: string;
  bag_length: string;
  bag_width: string;
  border_dimension?: string;
  rate: string;
  special_instructions: string;
  order_date: string;
  sales_account_id?: string | null;
  // New cost fields
  margin?: string;
  material_cost?: string;
  production_cost?: string;
  total_cost?: string;
  calculated_selling_price?: string;
  template_margin?: string;
  // Production cost fields
  cutting_charge?: string;
  printing_charge?: string;
  stitching_charge?: string;
  transport_charge?: string;
}

export interface InventoryMaterial {
  id: string;
  material_name: string;
  color: string | null;
  gsm: string | null;
  unit: string | null;
  purchase_rate: number | null;
}

export interface Component {
  id: string;
  component_type: string;
  size: string | null;
  color: string | null;
  gsm: string | null;
  custom_name: string | null;
  order_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  material_id?: string | null;
  consumption?: string | number | null; // Allow both string and number for flexibility
  roll_width?: string | number | null; // Allow both string and number for flexibility
  inventory?: InventoryMaterial | null;
  // New field to track if component is from a template
  from_template?: boolean;
  component_cost?: number | null;
}
