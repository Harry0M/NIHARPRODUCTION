
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
  label?: string;
}

export const WorkerSelection = ({
  workerType,
  serviceType,
  onWorkerSelect,
  selectedWorkerId,
  label = 'Worker'
}: WorkerSelectionProps) => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualName, setManualName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        setLoading(true);
        if (workerType === 'internal') {
          // For internal workers, fetch from vendors with matching service type
          const { data, error } = await supabase
            .from('vendors')
            .select('*')
            .eq('service_type', serviceType.toLowerCase())
            .eq('status', 'active');

          if (error) throw error;

          if (data) {
            const transformedData: Worker[] = data.map(item => ({
              id: item.id,
              name: item.name,
              type: workerType,
              service_type: item.service_type
            }));
            setWorkers(transformedData);
          }
        } else {
          // For external vendors, fetch from vendors table
          const { data, error } = await supabase
            .from('vendors')
            .select('*')
            .eq('service_type', serviceType.toLowerCase())
            .eq('status', 'active');

          if (error) throw error;

          if (data) {
            const transformedData: Worker[] = data.map(item => ({
              id: item.id,
              name: item.name,
              type: workerType,
              service_type: item.service_type
            }));
            setWorkers(transformedData);
          }
        }
      } catch (error) {
        console.error('Error fetching workers:', error);
        setWorkers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, [workerType, serviceType]);

  const toggleManualEntry = () => {
    if (!isManualEntry) {
      const selectedWorker = workers.find(w => w.id === selectedWorkerId);
      if (selectedWorker) {
        setManualName(selectedWorker.name);
      }
    } else {
      setManualName("");
    }
    setIsManualEntry(!isManualEntry);
    if (selectedWorkerId) {
      onWorkerSelect("");
    }
  };

  const handleManualNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualName(e.target.value);
    onWorkerSelect(e.target.value);
  };

  const handleWorkerSelect = (workerId: string) => {
    const selectedWorker = workers.find(w => w.id === workerId);
    if (selectedWorker) {
      onWorkerSelect(selectedWorker.id);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>{label}</Label>
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
          onValueChange={handleWorkerSelect}
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

      {loading && <p className="text-sm text-muted-foreground">Loading workers...</p>}
    </div>
  );
};
