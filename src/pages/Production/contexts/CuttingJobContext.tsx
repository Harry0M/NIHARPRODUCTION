
import { createContext, useContext } from 'react';
import { Database } from '@/integrations/supabase/types';

type JobStatus = Database["public"]["Enums"]["job_status"];

interface CuttingJobData {
  roll_width: string;
  consumption_meters: string;
  worker_name: string;
  is_internal: boolean;
  status: JobStatus;
  received_quantity: string;
}

interface CuttingJobContextType {
  cuttingData: CuttingJobData;
  setCuttingData: React.Dispatch<React.SetStateAction<CuttingJobData>>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: JobStatus) => void;
  handleCheckboxChange: (checked: boolean) => void;
  handleWorkerSelect: (value: string) => void;
  validationError: string | null;
}

export const CuttingJobContext = createContext<CuttingJobContextType | undefined>(undefined);

export function useCuttingJob() {
  const context = useContext(CuttingJobContext);
  if (context === undefined) {
    throw new Error('useCuttingJob must be used within a CuttingJobProvider');
  }
  return context;
}
