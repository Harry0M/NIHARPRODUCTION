
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
  metadata: any | null;
}
