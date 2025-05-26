
export interface Purchase {
  id: string;
  supplier_id: string | null;
  purchase_number: string;
  purchase_date: string;
  transport_charge: number;
  subtotal: number;
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  material_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
  updated_at: string;
}

export interface PurchaseWithItems extends Purchase {
  purchase_items: PurchaseItem[];
  supplier?: {
    id: string;
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
  };
}

export interface PurchaseFormData {
  supplier_id: string;
  purchase_date: string;
  transport_charge: number;
  notes: string;
  items: PurchaseItemFormData[];
}

export interface PurchaseItemFormData {
  material_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}
