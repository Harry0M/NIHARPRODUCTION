
import { useState } from "react";
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

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, searchTerm: tempSearchTerm }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
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
          placeholder="Search by order number, company..."
          className="pl-8"
          value={tempSearchTerm}
          onChange={(e) => setTempSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
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
          <SelectItem value="highest_profit">Highest Profit</SelectItem>
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
      
      <div className="flex gap-2">
        <Button variant="default" onClick={handleSearch} className="whitespace-nowrap">
          <Search className="mr-1 h-4 w-4" />
          Search
        </Button>
        
        {isFiltersApplied && (
          <Button variant="outline" onClick={clearFilters} className="whitespace-nowrap">
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};
