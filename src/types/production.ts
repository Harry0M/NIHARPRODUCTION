
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
