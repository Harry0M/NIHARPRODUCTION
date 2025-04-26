
export type JobStatus = "pending" | "in_progress" | "completed";

export interface TimelineJob {
  id: string;
  type: string;
  status: JobStatus;
  created_at: string;
  worker_name?: string;
  is_internal?: boolean;
}

export interface JobData {
  id: string;
  status: JobStatus;
  worker_name?: string;
  is_internal?: boolean;
  created_at: string;
}

export interface JobsData {
  cutting: JobData[];
  printing: JobData[];
  stitching: JobData[];
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
  material_type?: string;
  material_color?: string;
  material_gsm?: string;
  notes?: string;
}
