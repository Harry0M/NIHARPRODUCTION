
export interface DispatchFormData {
  recipient_name: string;
  tracking_number: string;
  delivery_address: string;
  notes: string;
  confirm_quality_check: boolean;
  confirm_quantity_check: boolean;
  batches: BatchData[];
}

export interface BatchData {
  quantity: number;
  delivery_date: string;
  notes?: string;
}

export interface DispatchFormProps {
  jobCardId: string;
  orderNumber: string;
  companyName: string;
  companyAddress?: string;
  quantity: number;
  stages: {
    name: string;
    status: "pending" | "in_progress" | "completed" | "cancelled";
    completedDate?: string;
  }[];
  onDispatchSubmit: (data: DispatchFormData) => Promise<void>;
}
