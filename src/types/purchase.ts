
export interface Purchase {
  id: string;
  supplier_id: string | null;
  purchase_date: string;
  transport_charge: number;
  subtotal: number;
  total_amount: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  status: string;
  notes: string | null;
  purchase_number: string;
  supplier?: {
    id: string;
    name: string;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
  };
  purchase_items?: PurchaseItem[];
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
  material?: {
    id: string;
    material_name: string;
    unit: string;
    color: string | null;
    gsm: string | null;
  };
}

export interface CreatePurchaseData {
  supplier_id: string | null;
  purchase_date: string;
  transport_charge: number;
  subtotal: number;
  total_amount: number;
  notes: string | null;
  status: string;
  items: CreatePurchaseItemData[];
}

export interface CreatePurchaseItemData {
  material_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}
