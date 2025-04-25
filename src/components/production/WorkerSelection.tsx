
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Database } from '@/integrations/supabase/types';
import { Input } from '@/components/ui/input';

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
  // Add state to track if we're using manual entry
  const [isManualEntry, setIsManualEntry] = useState(false);
  // Add state to track manual input value
  const [manualName, setManualName] = useState("");

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        if (workerType === 'internal') {
          // Query profiles table for internal workers
          const { data, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, company_name, role')
            // Cast as any to bypass TypeScript strict checking
            .eq('role', serviceType as any);

          if (error) throw error;

          if (data) {
            const transformedData: Worker[] = data.map(item => ({
              id: item.id || '',
              name: `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Unnamed Worker',
              type: workerType,
              service_type: item.role || undefined
            }));
            
            setWorkers(transformedData);
          }
        } else {
          // Query vendors table for external workers
          const { data, error } = await supabase
            .from('vendors')
            .select('*')  // Select all columns to avoid column name mismatches
            // Cast as any to bypass TypeScript strict checking
            .eq('service_type', serviceType as any);

          if (error) throw error;

          if (data) {
            const transformedData: Worker[] = data.map(item => ({
              id: item.id || '',
              // Use only the name property for vendors as company_name doesn't exist
              name: item.name || 'Unnamed Vendor',
              type: workerType,
              service_type: item.service_type || undefined
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

  // Handle toggle between selection and manual entry
  const toggleManualEntry = () => {
    if (!isManualEntry) {
      // If switching to manual entry, check if there's a selected worker to use as initial value
      const selectedWorker = workers.find(w => w.id === selectedWorkerId);
      if (selectedWorker) {
        setManualName(selectedWorker.name);
      }
    } else {
      // If switching back to selection, clear the manual name
      setManualName("");
    }
    setIsManualEntry(!isManualEntry);
    // Clear selection when toggling
    if (selectedWorkerId) {
      onWorkerSelect("");
    }
  };

  // Handle manual name input change
  const handleManualNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualName(e.target.value);
    // Pass the manual name as the "worker ID" to the parent component
    onWorkerSelect(e.target.value);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>{workerType === 'internal' ? 'Worker' : 'Vendor'}</Label>
        <button 
          type="button"
          onClick={toggleManualEntry}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          {isManualEntry ? "Choose from list" : "Enter manually"}
        </button>
      </div>

      {isManualEntry ? (
        <Input
          placeholder={`Enter ${workerType === 'internal' ? 'worker' : 'vendor'} name`}
          value={manualName}
          onChange={handleManualNameChange}
        />
      ) : (
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
      )}
    </div>
  );
};
