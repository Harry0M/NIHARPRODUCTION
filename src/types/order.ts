
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
  order_date: string;
  status: OrderStatus;
  rate: number | null;
  created_at: string;
  special_instructions?: string | null;
  sales_account_id?: string | null;
}

export interface OrderFormData {
  company_name: string;
  company_id: string | null;
  quantity: string;
  bag_length: string;
  bag_width: string;
  rate: string;
  special_instructions: string;
  order_date: string;
  status?: OrderStatus;
  sales_account_id?: string | null;
  order_number?: string; // Make order_number optional in form data since it's auto-generated
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
  roll_width?: number | null;
  consumption?: number | null;
}

export interface MaterialUsage {
  material_id: string;
  consumption: number;
}
