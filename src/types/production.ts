
export type JobStatus = "pending" | "in_progress" | "completed";

export interface TimelineJob {
  id: string;
  type: string;
  status: JobStatus;
  created_at: string;
  worker_name?: string;
  is_internal?: boolean;
  job_number?: string;
  job_card_id?: string;  // Added this field to help with navigation
}

export interface JobData {
  id: string;
  jobCardId: string;
  orderId?: string;
  order: string;
  product: string;
  quantity: number;
  progress: number;
  worker: string;
  status: JobStatus;
  created_at: string;
  is_internal?: boolean;
  daysLeft?: number;
  material?: string;
  consumption?: number;
  design?: string;
  screenStatus?: string;
  parts?: string;
  handles?: string;
  finishing?: string;
  bagDimensions?: string;
}

export interface JobsData {
  cutting: JobData[];
  printing: JobData[];
  stitching: JobData[];
  dispatch: JobData[];
}

export interface CuttingComponent {
  component_id: string;
  component_type: string;
  width: string;
  height: string;
  counter: string;
  rewinding: string;
  roll_width?: string;  // Added roll_width at component level
  consumption?: string;  // Added consumption at component level
  rate: string;
  status: JobStatus;
  notes?: string;
  waste_quantity?: string;
}

export interface PrintingJobData {
  id?: string;  // Add id as an optional property
  job_card_id: string;
  pulling: string;
  gsm: string;
  sheet_length: string;  
  sheet_width: string;   
  worker_name: string;
  is_internal: boolean;
  rate: string;
  status: JobStatus;
  expected_completion_date: string;
  print_image: string;
  received_quantity?: string; // Add the received_quantity field
  created_at?: string;
  created_by?: string;
}

export interface CuttingJobData {
  id: string;
  job_card_id: string;
  roll_width: number | null;
  consumption_meters: number | null;
  worker_name: string | null;
  is_internal: boolean;
  status: JobStatus;
  received_quantity: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface JobCardData {
  id: string;
  job_name: string;
  status: JobStatus;
  created_at: string;
  order: {
    id: string;
    order_number: string;
    company_name: string;
    quantity?: number;  // Added quantity as an optional property
  };
  cutting_jobs: {
    id: string;
    status: JobStatus;
    worker_name?: string | null;
    created_at?: string;
    updated_at?: string;
  }[];
  printing_jobs: {
    id: string;
    status: JobStatus;
    worker_name?: string | null;
    created_at?: string;
    updated_at?: string;
  }[];
  stitching_jobs: {
    id: string;
    status: JobStatus;
    worker_name?: string | null;
    created_at?: string;
    updated_at?: string;
  }[];
}
