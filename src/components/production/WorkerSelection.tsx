
import { useState, useEffect } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

interface Worker {
  id: string;
  name: string;
  type: string;
}

interface WorkerSelectionProps {
  workerType: 'vendor' | 'supplier';
  onWorkerSelect: (workerId: string, workerName: string, isInternal: boolean) => void;
  defaultInternal?: boolean;
  defaultWorkerName?: string;
  className?: string;
}

export const WorkerSelection = ({ 
  workerType, 
  onWorkerSelect,
  defaultInternal = true,
  defaultWorkerName = '',
  className = ''
}: WorkerSelectionProps) => {
  const [isInternal, setIsInternal] = useState<boolean>(defaultInternal);
  const [workerName, setWorkerName] = useState<string>(defaultWorkerName);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');

  // When the component mounts, fetch vendors or suppliers based on type
  useEffect(() => {
    const fetchWorkers = async () => {
      const table = workerType === 'vendor' ? 'vendors' : 'suppliers';
      
      const { data, error } = await supabase
        .from(table)
        .select('id, name, service_type')
        .order('name');
        
      if (!error && data) {
        setWorkers(data);
      }
    };
    
    // Only fetch external workers when needed
    if (!isInternal) {
      fetchWorkers();
    }
  }, [workerType, isInternal]);

  // When internal/external status changes, update the worker selection
  useEffect(() => {
    if (isInternal) {
      onWorkerSelect('', workerName, true);
    } else {
      onWorkerSelect(selectedWorkerId, workers.find(w => w.id === selectedWorkerId)?.name || '', false);
    }
  }, [isInternal, workerName, selectedWorkerId, workers, onWorkerSelect]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="is_internal" 
          checked={isInternal}
          onCheckedChange={(checked) => setIsInternal(checked === true)} 
        />
        <Label htmlFor="is_internal">In-house {workerType === 'vendor' ? 'service' : 'supplier'}</Label>
      </div>
      
      {isInternal ? (
        <div className="space-y-2">
          <Label htmlFor="worker_name">Worker Name</Label>
          <Input 
            id="worker_name"
            value={workerName}
            onChange={(e) => {
              setWorkerName(e.target.value);
              onWorkerSelect('', e.target.value, true);
            }}
            placeholder={`Enter ${workerType === 'vendor' ? 'worker' : 'supplier'} name`}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="external_worker">{workerType === 'vendor' ? 'Vendor' : 'Supplier'}</Label>
          <Select
            value={selectedWorkerId}
            onValueChange={(value) => {
              setSelectedWorkerId(value);
              const selectedWorker = workers.find(w => w.id === value);
              onWorkerSelect(value, selectedWorker?.name || '', false);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${workerType === 'vendor' ? 'vendor' : 'supplier'}`} />
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
      )}
    </div>
  );
};
