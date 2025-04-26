
import type { Database } from "@/integrations/supabase/types";

export type OrderStatus = Database['public']['Enums']['order_status'] | "dispatched";

export interface OrderWithJobStatus {
  id: string;
  order_number: string;
  company_name: string;
  quantity: number;
  rate: number | null;
  status: OrderStatus;
  created_at: string;
  job_cards: {
    id: string;
    job_name: string;
    status: string;
    cutting_jobs: {
      status: string;
    }[] | null;
    printing_jobs: {
      status: string;
    }[] | null;
    stitching_jobs: {
      status: string;
    }[] | null;
  }[] | null;
}
