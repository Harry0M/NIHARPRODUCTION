export interface JobData {
  id: string;
  jobCardId: string;
  order: string;
  product: string;
  quantity: number;
  progress: number;
  worker: string;
  daysLeft?: number;
  status?: string;
  material?: string;
  consumption?: number;
  design?: string;
  screenStatus?: string;
  parts?: string;
  handles?: string;
  finishing?: string;
}

export interface JobsData {
  cutting: JobData[];
  printing: JobData[];
  stitching: JobData[];
  dispatch: JobData[];
}

export interface TimelineJob {
  id: string;
  status: string;
  worker_name: string | null;
  created_at: string;
  job_number?: string; // Added to help identify specific jobs
  is_internal?: boolean;
}

// Added interface for detailed job selection
export interface JobSelectionOption {
  id: string;
  label: string;
  worker_name: string | null;
  status: string;
  created_at: string;
}

export type JobStatus = "pending" | "in_progress" | "completed";
