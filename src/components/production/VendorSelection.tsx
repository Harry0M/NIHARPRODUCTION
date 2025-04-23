
import { useState, useEffect } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';

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
}

export const VendorSelection = ({
  serviceType,
  value,
  onChange,
  placeholder = "Select vendor..."
}: VendorSelectionProps) => {
  const [open, setOpen] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isManualInput, setIsManualInput] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('vendors')
          .select('id, name, service_type')
          .eq('service_type', serviceType)
          .eq('status', 'active');

        if (error) {
          console.error('Error fetching vendors:', error);
          setVendors([]);
          return;
        }

        setVendors(data || []);
      } catch (error) {
        console.error('Exception when fetching vendors:', error);
        setVendors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, [serviceType]);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
  };

  if (isManualInput) {
    return (
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full"
        />
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setIsManualInput(false)}
          type="button"
        >
          <ChevronsUpDown className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            type="button"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-primary border-r-transparent animate-spin"></span>
                Loading...
              </span>
            ) : value ? (
              vendors.find((vendor) => vendor.name === value)?.name || value
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full min-w-[200px] p-0">
          {vendors.length > 0 ? (
            <Command>
              <CommandInput placeholder={`Search ${serviceType} vendors...`} />
              <CommandGroup>
                {vendors.map((vendor) => (
                  <CommandItem
                    key={vendor.id}
                    value={vendor.name}
                    onSelect={handleSelect}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === vendor.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {vendor.name}
                  </CommandItem>
                ))}
                <CommandItem
                  value="manual-input"
                  onSelect={() => {
                    setIsManualInput(true);
                    setOpen(false);
                  }}
                  className="border-t"
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  Enter manually
                </CommandItem>
              </CommandGroup>
              <CommandEmpty>
                <div className="py-3 px-2 text-center text-sm">
                  No vendor found
                  <Button
                    variant="ghost"
                    className="mt-2 w-full"
                    onClick={() => {
                      setIsManualInput(true);
                      setOpen(false);
                    }}
                  >
                    Enter manually
                  </Button>
                </div>
              </CommandEmpty>
            </Command>
          ) : (
            <div className="p-4 text-sm">
              {loading ? (
                <div className="flex justify-center items-center py-2">
                  <span className="h-4 w-4 mr-2 rounded-full border-2 border-primary border-r-transparent animate-spin"></span>
                  Loading vendors...
                </div>
              ) : (
                <>
                  <p className="text-center mb-2">No vendors found</p>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      setIsManualInput(true);
                      setOpen(false);
                    }}
                  >
                    Enter manually
                  </Button>
                </>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};
