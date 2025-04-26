
export interface StageSummary {
  name: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  completedDate?: string;
}

export interface DispatchData {
  id: string;
  order_id: string;
  delivery_date: string;
  tracking_number?: string | null;
  recipient_name: string;
  delivery_address: string;
  notes?: string | null;
  quality_checked: boolean;
  quantity_checked: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DispatchBatch {
  id?: string;
  batch_number: number;
  quantity: number;
  delivery_date: string;
  notes?: string;
  status?: string;
}
