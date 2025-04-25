
import { createContext, useContext } from 'react';
import { Database } from '@/integrations/supabase/types';

type JobStatus = Database["public"]["Enums"]["job_status"];

interface PrintingJobData {
  pulling: string;
  gsm: string;
  sheet_length: number;
  sheet_width: number;
  print_image: string | null;
  worker_name: string | null;
  is_internal: boolean;
  status: JobStatus;
  rate: number | null;
  expected_completion_date: Date | null;
}

interface PrintingJobContextType {
  printingData: PrintingJobData;
  setPrintingData: React.Dispatch<React.SetStateAction<PrintingJobData>>;
  printImage: string | null;
  setPrintImage: React.Dispatch<React.SetStateAction<string | null>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const PrintingJobContext = createContext<PrintingJobContextType | undefined>(undefined);

export function usePrintingJob() {
  const context = useContext(PrintingJobContext);
  if (context === undefined) {
    throw new Error('usePrintingJob must be used within a PrintingJobProvider');
  }
  return context;
}
