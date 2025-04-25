
import { useState, ReactNode } from 'react';
import { Database } from '@/integrations/supabase/types';
import { CuttingJobContext } from '../contexts/CuttingJobContext';

type JobStatus = Database["public"]["Enums"]["job_status"];

interface CuttingJobData {
  roll_width: string;
  consumption_meters: string;
  worker_name: string;
  is_internal: boolean;
  status: JobStatus;
  received_quantity: string;
}

interface CuttingJobProviderProps {
  children: ReactNode;
  initialData?: Partial<CuttingJobData>;
}

export function CuttingJobProvider({ children, initialData }: CuttingJobProviderProps) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [cuttingData, setCuttingData] = useState<CuttingJobData>({
    roll_width: initialData?.roll_width || "",
    consumption_meters: initialData?.consumption_meters || "",
    worker_name: initialData?.worker_name || "",
    is_internal: initialData?.is_internal ?? true,
    status: initialData?.status || "pending",
    received_quantity: initialData?.received_quantity || ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCuttingData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'roll_width' && validationError) {
      setValidationError(null);
    }
  };

  const handleSelectChange = (name: string, value: JobStatus) => {
    setCuttingData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setCuttingData(prev => ({ ...prev, is_internal: checked }));
  };

  const handleWorkerSelect = (value: string) => {
    setCuttingData(prev => ({ ...prev, worker_name: value }));
  };

  return (
    <CuttingJobContext.Provider value={{
      cuttingData,
      setCuttingData,
      handleInputChange,
      handleSelectChange,
      handleCheckboxChange,
      handleWorkerSelect,
      validationError
    }}>
      {children}
    </CuttingJobContext.Provider>
  );
}
