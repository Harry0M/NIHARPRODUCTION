
import { useState, ReactNode } from 'react';
import { Database } from '@/integrations/supabase/types';
import { PrintingJobContext } from '../contexts/PrintingJobContext';

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

interface PrintingJobProviderProps {
  children: ReactNode;
  initialData?: Partial<PrintingJobData>;
}

export function PrintingJobProvider({ children, initialData }: PrintingJobProviderProps) {
  const [loading, setLoading] = useState(false);
  const [printImage, setPrintImage] = useState<string | null>(null);
  const [printingData, setPrintingData] = useState<PrintingJobData>({
    pulling: initialData?.pulling || "",
    gsm: initialData?.gsm || "",
    sheet_length: initialData?.sheet_length || 0,
    sheet_width: initialData?.sheet_width || 0,
    print_image: initialData?.print_image || null,
    worker_name: initialData?.worker_name || null,
    is_internal: initialData?.is_internal ?? true,
    status: initialData?.status || "pending",
    rate: initialData?.rate || null,
    expected_completion_date: initialData?.expected_completion_date || null
  });

  return (
    <PrintingJobContext.Provider value={{
      printingData,
      setPrintingData,
      printImage,
      setPrintImage,
      loading,
      setLoading
    }}>
      {children}
    </PrintingJobContext.Provider>
  );
}
