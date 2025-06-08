
export interface SalesBill {
  id: string;
  dispatch_id?: string;
  order_id?: string;
  company_name: string;
  company_address?: string;
  catalog_name: string;
  catalog_id?: string;
  quantity: number;
  rate: number;
  gst_percentage: number;
  transport_charge: number;
  subtotal?: number;
  gst_amount?: number;
  total_amount?: number;
  bill_number: string;
  bill_date: string;
  due_date?: string;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  payment_status: 'pending' | 'partial' | 'paid' | 'overdue';
  notes?: string;
  terms_and_conditions?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface DispatchedOrder {
  id: string;
  order_number: string;
  company_name: string;
  company_address?: string;
  catalog_name?: string;
  catalog_id?: string;
  quantity: number;
  catalog_selling_rate?: number;
  dispatch_id?: string;
  dispatch_date?: string;
  order_id: string;
}

export interface SalesBillFormData {
  dispatch_id?: string;
  order_id?: string;
  company_name: string;
  company_address?: string;
  catalog_name: string;
  catalog_id?: string;
  quantity: number;
  rate: number;
  gst_percentage: number;
  transport_charge: number;
  bill_number?: string;
  bill_date: string;
  due_date?: string;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  payment_status: 'pending' | 'partial' | 'paid' | 'overdue';
  notes?: string;
  terms_and_conditions?: string;
}
