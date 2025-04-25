
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';

interface VendorSelectionProps {
  serviceType: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

interface Vendor {
  id: string;
  name: string;
}

export const VendorSelection = ({
  serviceType,
  value,
  onChange,
  placeholder = "Select vendor...",
  label
}: VendorSelectionProps) => {
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isManualEntry, setIsManualEntry] = useState(false);

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      try {
        // Fetch vendors with the given service type
        const { data: vendorsData, error: vendorsError } = await supabase
          .from('vendors')
          .select('id, name')
          .eq('service_type', serviceType);
        
        if (vendorsError) throw vendorsError;
        
        // Also fetch workers (profiles) with the given role
        const { data: workersData, error: workersError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('role', serviceType);
        
        if (workersError) throw workersError;

        // Transform vendors data
        const vendorOptions = vendorsData?.map(vendor => ({
          label: vendor.name,
          value: vendor.name, // Use name directly instead of ID for simplicity
          type: 'vendor'
        })) || [];

        // Transform workers data
        const workerOptions = workersData?.map(worker => ({
          label: `${worker.first_name || ''} ${worker.last_name || ''}`.trim() || 'Unknown Worker',
          value: `${worker.first_name || ''} ${worker.last_name || ''}`.trim() || 'Unknown Worker',
          type: 'worker'
        })) || [];

        // Combine both lists
        setOptions([...vendorOptions, ...workerOptions]);
      } catch (error) {
        console.error('Error fetching vendors/workers:', error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, [serviceType]);

  // Check if current value matches any option to determine if it's manual entry
  useEffect(() => {
    // If there's a value and it's not in the options, it's likely manual entry
    if (value && options.length > 0 && !options.some(option => option.value === value)) {
      setIsManualEntry(true);
    }
  }, [value, options]);

  const toggleManualEntry = () => {
    setIsManualEntry(!isManualEntry);
    if (!isManualEntry) {
      // Clear the value when switching to manual entry
      onChange('');
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="space-y-2">
        {isManualEntry ? (
          <div className="space-y-2">
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full"
            />
            <Button
              type="button"
              variant="link"
              className="text-xs p-0 h-auto"
              onClick={toggleManualEntry}
            >
              Select from list
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Input
              type="text"
              list="vendor-options"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full"
            />
            <datalist id="vendor-options">
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </datalist>
            <Button
              type="button"
              variant="link"
              className="text-xs p-0 h-auto"
              onClick={toggleManualEntry}
            >
              Enter manually
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
