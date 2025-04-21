
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
        if (workerType === 'internal') {
          // Query profiles table for internal workers
          const { data, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, company_name, role')
            .eq('role', serviceType);

          if (error) throw error;

          if (data) {
            const transformedData: Worker[] = data.map(item => ({
              id: item.id,
              name: `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unnamed Worker',
              type: workerType,
              service_type: item.role
            }));
            
            setWorkers(transformedData);
          }
        } else {
          // Query vendors table for external workers
          const { data, error } = await supabase
            .from('vendors')
            .select('id, name, company_name, service_type')
            .eq('service_type', serviceType);

          if (error) throw error;

          if (data) {
            const transformedData: Worker[] = data.map(item => ({
              id: item.id,
              name: item.company_name || item.name || 'Unnamed Vendor',
              type: workerType,
              service_type: item.service_type
            }));
            
            setWorkers(transformedData);
          }
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
