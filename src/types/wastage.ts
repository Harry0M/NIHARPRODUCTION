
export interface WastageData {
  id: string;
  order_id: string;
  order_number: string;
  company_name: string;
  job_number: string | null;
  job_type: string;
  worker_name: string | null;
  provided_quantity: number;
  received_quantity: number;
  wastage_quantity: number;
  wastage_percentage: number;
  notes: string | null;
  created_at: string;
}

export interface WastageSummary {
  total_wastage_quantity: number;
  total_wastage_percentage: number;
  total_jobs: number;
  by_type: {
    [key: string]: {
      wastage_quantity: number;
      wastage_percentage: number;
      jobs_count: number;
    }
  };
  worst_workers: {
    worker_name: string | null;
    wastage_percentage: number;
    jobs_count: number;
  }[];
  worst_orders: {
    order_number: string;
    company_name: string;
    wastage_percentage: number;
    wastage_quantity: number;
  }[];
}

export type JobType = 'all' | 'printing' | 'stitching' | 'cutting';
export type DateRange = { from: Date | undefined; to: Date | undefined };
