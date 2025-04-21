
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
        // For internal workers, use profiles table. For external workers, use vendors table
        const tableName = workerType === 'internal' ? 'profiles' : 'vendors';
        
        // Query the appropriate table
        const { data, error } = await supabase
          .from(tableName)
          .select('id, first_name, last_name, company_name, service_type')
          .eq(workerType === 'internal' ? 'role' : 'service_type', serviceType);

        if (error) throw error;

        if (data) {
          // Transform the data to fit our Worker interface
          const transformedData: Worker[] = data.map(item => ({
            id: item.id,
            // Use company_name for vendors or concatenate first_name and last_name for profiles
            name: workerType === 'external' 
              ? (item.company_name || 'Unnamed Vendor') 
              : (`${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unnamed Worker'),
            type: workerType,
            service_type: item.service_type
          }));
          
          setWorkers(transformedData);
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
