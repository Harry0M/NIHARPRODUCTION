
export type JobStatus = "pending" | "in_progress" | "completed";

export interface TimelineJob {
  id: string;
  type: string;
  status: JobStatus;
  created_at: string;
  worker_name?: string;
  is_internal?: boolean;
  job_number?: string;
}

export interface JobData {
  id: string;
  jobCardId: string;
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
  rate: string;
  status: JobStatus;
  notes?: string;
}
