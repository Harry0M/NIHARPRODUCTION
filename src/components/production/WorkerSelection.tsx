
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export interface Worker {
  id: string;
  name: string;
  type: string;
  service_type?: string;
}

interface WorkerSelectionProps {
  workerType: 'internal' | 'external';
  serviceType: string;
  onWorkerSelect: (workerId: string) => void;
  selectedWorkerId?: string;
}

export const WorkerSelection = ({
  workerType,
  serviceType,
  onWorkerSelect,
  selectedWorkerId
}: WorkerSelectionProps) => {
  const [workers, setWorkers] = useState<Worker[]>([]);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const { data, error } = await supabase
          .from(workerType === 'internal' ? 'workers' : 'vendors')
          .select('id, name, type')
          .eq('type', serviceType);

        if (error) throw error;

        if (data) {
          setWorkers(data as Worker[]);
        }
      } catch (error) {
        console.error('Error fetching workers:', error);
        setWorkers([]);
      }
    };

    fetchWorkers();
  }, [workerType, serviceType]);

  return (
    <div className="space-y-2">
      <Label>{workerType === 'internal' ? 'Worker' : 'Vendor'}</Label>
      <Select
        value={selectedWorkerId}
        onValueChange={onWorkerSelect}
      >
        <SelectTrigger>
          <SelectValue placeholder={`Select ${workerType === 'internal' ? 'worker' : 'vendor'}...`} />
        </SelectTrigger>
        <SelectContent>
          {workers.map((worker) => (
            <SelectItem key={worker.id} value={worker.id}>
              {worker.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
