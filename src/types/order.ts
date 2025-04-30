export interface OrderFormData {
  company_name: string;
  company_id: string | null;
  quantity: string;
  bag_length: string;
  bag_width: string;
  rate: string;
  special_instructions?: string;
  sales_account_id: string | null;
  order_date: string;
}

export type OrderStatus = 
  | 'pending'
  | 'in_production'
  | 'cutting'
  | 'printing'
  | 'stitching'
  | 'ready_for_dispatch'
  | 'dispatched'
  | 'completed'
  | 'cancelled';

export interface Order {
  id: string;
  order_number: string;
  company_name: string;
  company_id?: string | null;
  quantity: number;
  bag_length: number;
  bag_width: number;
  rate?: number | null;
  status: OrderStatus;
  order_date: string;
  created_at: string;
  special_instructions?: string | null;
  sales_account_id?: string | null;
}

export interface Component {
  id: string;
  component_type?: string;
  type?: string;
  size?: string;
  color?: string | null;
  gsm?: string | null;
  custom_name?: string | null;
  customName?: string;
  details?: string | null;
  material_id?: string | null;
  roll_width?: string | number | null;
  consumption?: string | number | null;
  order_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  length?: string;
  width?: string;
}

export interface ComponentData {
  id?: string;
  type: string;
  customName?: string;
  color?: string;
  gsm?: string;
  width?: string;
  length?: string;
  material_id?: string;
  roll_width?: string;
  consumption?: string;
}
