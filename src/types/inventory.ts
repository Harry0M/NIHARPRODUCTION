
export interface StockTransaction {
  id: string;
  material_id: string;
  inventory_id: string;
  quantity: number;
  created_at: string;
  reference_id: string | null;
  reference_number: string | null;
  reference_type: string | null;
  notes: string | null;
  unit_price: number | null;
  transaction_type: string;
  location_id: string | null;
  batch_id: string | null;
  roll_width: number | null;
  updated_at: string | null;
  unit?: string | null;
}

// Updated TransactionLog interface with proper metadata typing
export interface TransactionLog {
  id: string;
  material_id: string;
  transaction_type: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reference_id: string | null;
  reference_number: string | null;
  reference_type: string | null;
  transaction_date: string;
  notes: string | null;
  // Modified to accept both Json type from database and our specific structure
  metadata: {
    material_name?: string;
    unit?: string;
    company_name?: string;
    component_type?: string;
    order_id?: string;
    order_number?: string;
    manual?: boolean;
    update_source?: string;
    [key: string]: any;
  } | null | any; // Added any to handle Json type from the database
}
