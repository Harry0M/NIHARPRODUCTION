-- TypeScript type definition for sales_invoices table
-- Add this to your Supabase types.ts file in the Tables section

export interface SalesInvoice {
  id: string;
  order_id: string;
  invoice_number: string;
  company_name: string;
  product_name: string;
  quantity: number;
  rate: number;
  transport_included: boolean;
  transport_charge: number;
  gst_percentage: number;
  gst_amount: number;
  other_expenses: number;
  subtotal: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  notes: string | null;
}

-- Database schema type definition for adding to Database.public.Tables:
sales_invoices: {
  Row: {
    id: string;
    order_id: string;
    invoice_number: string;
    company_name: string;
    product_name: string;
    quantity: number;
    rate: number;
    transport_included: boolean;
    transport_charge: number;
    gst_percentage: number;
    gst_amount: number;
    other_expenses: number;
    subtotal: number;
    total_amount: number;
    created_at: string;
    updated_at: string;
    created_by: string | null;
    notes: string | null;
  };
  Insert: {
    id?: string;
    order_id: string;
    invoice_number: string;
    company_name: string;
    product_name: string;
    quantity: number;
    rate: number;
    transport_included?: boolean;
    transport_charge?: number;
    gst_percentage?: number;
    gst_amount: number;
    other_expenses?: number;
    subtotal: number;
    total_amount: number;
    created_at?: string;
    updated_at?: string;
    created_by?: string | null;
    notes?: string | null;
  };
  Update: {
    id?: string;
    order_id?: string;
    invoice_number?: string;
    company_name?: string;
    product_name?: string;
    quantity?: number;
    rate?: number;
    transport_included?: boolean;
    transport_charge?: number;
    gst_percentage?: number;
    gst_amount?: number;
    other_expenses?: number;
    subtotal?: number;
    total_amount?: number;
    created_at?: string;
    updated_at?: string;
    created_by?: string | null;
    notes?: string | null;
  };
  Relationships: [
    {
      foreignKeyName: "sales_invoices_order_id_fkey";
      columns: ["order_id"];
      isOneToOne: false;
      referencedRelation: "orders";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "sales_invoices_created_by_fkey";
      columns: ["created_by"];
      isOneToOne: false;
      referencedRelation: "users";
      referencedColumns: ["id"];
    }
  ];
};
