
import { useState, useEffect, useRef } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PencilIcon } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";

interface Vendor {
  id: string;
  name: string;
  service_type: string | null;
}

interface VendorSelectionProps {
  serviceType: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const VendorSelection = ({
  serviceType,
  value,
  onChange,
  placeholder = "Select vendor...",
  className
}: VendorSelectionProps) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Initialize manualInput with value if it's not in vendors
  useEffect(() => {
    if (value && !isManualMode && !vendors.some(v => v.name === value)) {
      setManualInput(value);
    }
  }, [value, vendors, isManualMode]);

  useEffect(() => {
    const fetchVendors = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('vendors')
          .select('id, name, service_type')
          .eq('service_type', serviceType)
          .eq('status', 'active');

        if (error) {
          console.error('Error fetching vendors:', error);
          toast({
            title: "Failed to load vendors",
            description: error.message,
            variant: "destructive"
          });
          setVendors([]);
        } else {
          setVendors(data || []);
          
          // If we have a value but it's not in the vendors list, switch to manual mode
          if (value && !data?.some(vendor => vendor.name === value)) {
            setIsManualMode(true);
            setManualInput(value);
          }
        }
      } catch (error) {
        console.error('Exception when fetching vendors:', error);
        setVendors([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendors();
  }, [serviceType, value]);

  // Focus input when switching to manual mode
  useEffect(() => {
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
    onChange(newValue);
  };

  const handleSelectChange = (selectedValue: string) => {
    onChange(selectedValue);
  };

  const toggleManualMode = () => {
    if (!isManualMode) {
      setManualInput(value);
    }
    setIsManualMode(!isManualMode);
  };

  if (isManualMode) {
    return (
      <div className={`flex gap-2 ${className}`}>
        <Input
          value={manualInput}
          onChange={handleManualInputChange}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1"
          ref={inputRef}
          autoFocus
        />
        <Button 
          variant="outline" 
          size="icon"
          onClick={toggleManualMode}
          type="button"
          disabled={isLoading}
        >
          <PencilIcon className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <div className="flex-1">
        <Select
          value={vendors.some(v => v.name === value) ? value : ""}
          onValueChange={handleSelectChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {vendors.map((vendor) => (
              <SelectItem key={vendor.id} value={vendor.name}>
                {vendor.name}
              </SelectItem>
            ))}
            {vendors.length === 0 && !isLoading && (
              <div className="p-2 text-center text-sm text-muted-foreground">
                No vendors found
              </div>
            )}
            {isLoading && (
              <div className="p-2 text-center text-sm text-muted-foreground">
                Loading vendors...
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
      <Button 
        variant="outline" 
        size="icon"
        onClick={toggleManualMode}
        type="button"
        disabled={isLoading}
      >
        <PencilIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};
