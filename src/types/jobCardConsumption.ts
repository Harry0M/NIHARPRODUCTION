/**
 * Types for Job Card Consumption tracking
 * Ensures accurate material consumption recording and reversal
 */

export interface JobCardConsumption {
  id: string;
  job_card_id: string;
  material_id: string;
  component_type: string;
  consumption_amount: number;
  unit: string;
  material_name: string;
  order_id: string;
  order_number: string;
  metadata?: {
    color?: string;
    gsm?: number;
    length?: number;
    width?: number;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface JobCardConsumptionInput {
  job_card_id: string;
  material_id: string;
  component_type: string;
  consumption_amount: number;
  unit: string;
  material_name: string;
  order_id: string;
  order_number: string;
  metadata?: Record<string, any>;
}

export interface JobCardConsumptionCreateResult {
  success: boolean;
  data?: JobCardConsumption;
  error?: string;
}

export interface JobCardConsumptionBatchResult {
  success: boolean;
  created: JobCardConsumption[];
  errors: string[];
  totalProcessed: number;
  successCount: number;
  errorCount: number;
}
