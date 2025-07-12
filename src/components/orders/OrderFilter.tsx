
import { useState, useEffect, useRef } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { type OrderStatus } from "@/types/order";

// Simple debounce utility function
function debounce<T extends (...args: any[]) => void>(func: T, delay: number) {
  let timeoutId: NodeJS.Timeout;
  const debouncedFunction = (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
  debouncedFunction.cancel = () => clearTimeout(timeoutId);
  return debouncedFunction;
}

export interface OrderFilters {
  searchTerm: string;
  status: string; // Can be 'all' or one of OrderStatus values
  dateRange: {
    from: string;
    to: string;
  };
  sortBy: string; // New field for sorting/filtering options
}

interface OrderFilterProps {
  filters: OrderFilters;
  setFilters: React.Dispatch<React.SetStateAction<OrderFilters>>;
}

export const OrderFilter = ({ filters, setFilters }: OrderFilterProps) => {
  const [tempSearchTerm, setTempSearchTerm] = useState(filters.searchTerm);
  
  // Create a stable debounced function using useRef to avoid infinite re-renders
  const debouncedSearchRef = useRef(
    debounce((searchTerm: string) => {
      setFilters(prev => ({ ...prev, searchTerm }));
    }, 300)
  );

  // Update the debounced function when setFilters changes
  useEffect(() => {
    debouncedSearchRef.current = debounce((searchTerm: string) => {
      setFilters(prev => ({ ...prev, searchTerm }));
    }, 300);
  }, [setFilters]);

  // Handle real-time search as user types
  useEffect(() => {
    debouncedSearchRef.current(tempSearchTerm);
    
    // Cleanup function to cancel pending debounced calls
    return () => {
      debouncedSearchRef.current.cancel?.();
    };
  }, [tempSearchTerm]);

  // Update temp search term when filters change externally (e.g., clear filters)
  useEffect(() => {
    setTempSearchTerm(filters.searchTerm);
  }, [filters.searchTerm]);
  
  const handleStatusChange = (value: string) => {
    setFilters(prev => ({ ...prev, status: value }));
  };

  const handleSortByChange = (value: string) => {
    setFilters(prev => ({ ...prev, sortBy: value }));
  };

  const handleDateChange = (field: 'from' | 'to', value: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value
      }
    }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      status: 'all',
      dateRange: { from: '', to: '' },
      sortBy: 'default'
    });
    setTempSearchTerm('');
  };

  const isFiltersApplied = filters.searchTerm || 
    filters.status !== 'all' || 
    filters.dateRange.from || 
    filters.dateRange.to ||
    filters.sortBy !== 'default';

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="flex-1 min-w-[200px] relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by order number, company... (real-time)"
          className="pl-8"
          value={tempSearchTerm}
          onChange={(e) => setTempSearchTerm(e.target.value)}
        />
      </div>
      
      <Select
        value={filters.status}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="in_production">In Production</SelectItem>
          <SelectItem value="cutting">Cutting</SelectItem>
          <SelectItem value="printing">Printing</SelectItem>
          <SelectItem value="stitching">Stitching</SelectItem>
          <SelectItem value="ready_for_dispatch">Ready for Dispatch</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
          <SelectItem value="dispatched">Dispatched</SelectItem>
        </SelectContent>
      </Select>
      
      <Select
        value={filters.sortBy}
        onValueChange={handleSortByChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort/Filter By" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Default Order</SelectItem>
          <SelectItem value="highest_material_cost">Highest Material Cost</SelectItem>
          <SelectItem value="highest_wastage">Highest Wastage</SelectItem>
          <SelectItem value="latest_date">Latest Date</SelectItem>
          <SelectItem value="oldest_date">Oldest Date</SelectItem>
          <SelectItem value="company_name">Company Name</SelectItem>
        </SelectContent>
      </Select>
      
      <div className="flex items-center gap-2">
        <div>
          <Input
            type="date"
            placeholder="From"
            value={filters.dateRange.from}
            onChange={(e) => handleDateChange('from', e.target.value)}
            className="w-[150px]"
          />
        </div>
        <span>to</span>
        <div>
          <Input
            type="date"
            placeholder="To"
            value={filters.dateRange.to}
            onChange={(e) => handleDateChange('to', e.target.value)}
            className="w-[150px]"
          />
        </div>
      </div>
      
      {isFiltersApplied && (
        <Button variant="outline" onClick={clearFilters} className="whitespace-nowrap">
          <X className="mr-1 h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );
};
