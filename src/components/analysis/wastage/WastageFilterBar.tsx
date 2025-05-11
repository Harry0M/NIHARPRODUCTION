
import { useState } from 'react';
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRange } from "@/types/wastage";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { format } from "date-fns";

interface WastageFilterBarProps {
  onJobTypeChange: (value: string) => void;
  onDateRangeChange: (range: DateRange) => void;
  onWorkerChange: (value: string) => void;
  onOrderChange: (value: string) => void;
  onResetFilters: () => void;
  dateRange: DateRange;
  jobType: string;
  worker: string;
  order: string;
}

export function WastageFilterBar({
  onJobTypeChange,
  onDateRangeChange,
  onWorkerChange,
  onOrderChange,
  onResetFilters,
  dateRange,
  jobType,
  worker,
  order
}: WastageFilterBarProps) {
  const [workerFilter, setWorkerFilter] = useState(worker);
  const [orderFilter, setOrderFilter] = useState(order);

  const handleWorkerSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onWorkerChange(workerFilter);
    }
  };

  const handleOrderSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onOrderChange(orderFilter);
    }
  };

  return (
    <div className="bg-card rounded-lg p-4 mb-6 space-y-4">
      <h2 className="font-medium text-lg">Filter Wastage Data</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="job-type">
            Job Type
          </label>
          <Select
            value={jobType}
            onValueChange={onJobTypeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select job type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              <SelectItem value="printing_jobs">Printing</SelectItem>
              <SelectItem value="stitching_jobs">Stitching</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="date-range">
            Date Range
          </label>
          <DateRangePicker
            value={dateRange}
            onChange={onDateRangeChange}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="worker-filter">
            Worker/Vendor
          </label>
          <Input
            id="worker-filter"
            placeholder="Search worker/vendor"
            value={workerFilter}
            onChange={(e) => setWorkerFilter(e.target.value)}
            onKeyDown={handleWorkerSearch}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="order-filter">
            Order/Company
          </label>
          <Input
            id="order-filter"
            placeholder="Search order or company"
            value={orderFilter}
            onChange={(e) => setOrderFilter(e.target.value)}
            onKeyDown={handleOrderSearch}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={onResetFilters}
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
