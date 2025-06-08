// Types for the sales bill feature
export interface SalesBill {
  id: string;
  dispatch_id: string | null;
  order_id: string | null;
  company_name: string;
  company_address: string | null;
  catalog_name: string;
  catalog_id: string | null;
  quantity: number;
  rate: number;
  gst_percentage: number;
  transport_charge: number;
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  bill_number: string;
  bill_date: string;
  due_date: string | null;
  status: SalesBillStatus;
  payment_status: PaymentStatus;
  notes: string | null;
  terms_and_conditions: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export type SalesBillStatus = 'draft' | 'sent' | 'paid' | 'cancelled';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue';

export interface DispatchWithOrderDetails {
  id: string;
  order_id: string;
  recipient_name: string;
  delivery_address: string;
  delivery_date: string;
  tracking_number: string | null;
  quality_checked: boolean;
  quantity_checked: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  orders: {
    id: string;
    order_number: string;
    company_name: string;
    customer_address: string | null;
    quantity: number;
    catalog_id: string | null;
    rate: number;
    transport_charge: number;
  };
  dispatch_batches: DispatchBatch[];
  catalog_name?: string;
}

export interface DispatchBatch {
  id: string;
  order_dispatch_id: string;
  batch_number: number;
  quantity: number;
  delivery_date: string;
  notes: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}
