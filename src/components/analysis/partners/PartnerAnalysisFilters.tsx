
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { CalendarIcon, Filter } from "lucide-react";

interface PartnerAnalysisFiltersProps {
  onJobTypeChange: (value: string) => void;
  onDateRangeChange: (range: { from: Date; to: Date } | undefined) => void;
  onPartnerFilter: (value: string) => void;
  partnerNames: string[];
}

export const PartnerAnalysisFilters = ({ 
  onJobTypeChange, 
  onDateRangeChange, 
  onPartnerFilter,
  partnerNames
}: PartnerAnalysisFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Partner Analysis</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1"
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {isOpen && (
        <div className="bg-muted/40 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Job Type</label>
              <Select onValueChange={onJobTypeChange} defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  <SelectItem value="cutting">Cutting</SelectItem>
                  <SelectItem value="printing">Printing</SelectItem>
                  <SelectItem value="stitching">Stitching</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Partner</label>
              <Select onValueChange={onPartnerFilter} defaultValue="all">
                <SelectTrigger>
                  <SelectValue placeholder="Select partner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Partners</SelectItem>
                  {partnerNames.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <DatePickerWithRange
                date={undefined}
                onChange={onDateRangeChange}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
