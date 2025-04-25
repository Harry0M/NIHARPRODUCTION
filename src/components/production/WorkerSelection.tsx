
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PencilIcon } from "lucide-react";
import { Database } from '@/integrations/supabase/types';

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
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        if (workerType === 'internal') {
          // Query profiles table for internal workers
          const { data, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, company_name, role')
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
            .select('*')
            .eq('service_type', serviceType as any);

          if (error) throw error;

          if (data) {
            const transformedData: Worker[] = data.map(item => ({
              id: item.id || '',
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
    
    // If we have a selectedWorkerId but it's not in the workers list,
    // it might be a manual entry - set up manual mode
    if (selectedWorkerId && 
        !workers.some(w => w.id === selectedWorkerId) && 
        selectedWorkerId !== "") {
      setIsManualMode(true);
      setManualInput(selectedWorkerId);
    }
  }, [workerType, serviceType, selectedWorkerId]);

  useEffect(() => {
    // Focus the input field when switching to manual mode
    if (isManualMode && inputRef.current) {
      // Small delay to ensure the DOM is updated
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isManualMode]);

  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setManualInput(newValue);
    onWorkerSelect(newValue);
  };

  const toggleManualMode = () => {
    const newMode = !isManualMode;
    setIsManualMode(newMode);
    
    if (newMode) {
      // If switching to manual mode, initialize with current selection
      const selectedWorker = workers.find(w => w.id === selectedWorkerId);
      setManualInput(selectedWorker?.name || selectedWorkerId || "");
    }
  };

  if (isManualMode) {
    return (
      <div className="flex gap-2">
        <Input
          value={manualInput}
          onChange={handleManualInputChange}
          placeholder={`Enter ${workerType === 'internal' ? 'worker' : 'vendor'} name`}
          className="flex-1"
          ref={inputRef}
          autoFocus
        />
        <Button 
          variant="outline" 
          size="icon"
          onClick={toggleManualMode}
          type="button"
        >
          <PencilIcon className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="flex-1">
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
      <Button 
        variant="outline" 
        size="icon"
        onClick={toggleManualMode}
        type="button"
      >
        <PencilIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};
