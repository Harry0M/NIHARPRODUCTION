
import { useState } from "react";
import { usePartnerPerformance } from "@/hooks/analysis/usePartnerPerformance";
import { PartnerAnalysisFilters } from "@/components/analysis/partners/PartnerAnalysisFilters";
import { PartnerPerformanceSummary } from "@/components/analysis/partners/PartnerPerformanceSummary";
import { PartnerEfficiencyCard } from "@/components/analysis/partners/PartnerEfficiencyCard";
import { PartnerJobsTable } from "@/components/analysis/partners/PartnerJobsTable";
import { filterJobsByType, sortPartnersByEfficiency } from "@/utils/partnerAnalysisUtils";
import { PartnerJobData, PartnerPerformanceData } from "@/types/production";
import { DateRange } from "react-day-picker";

export default function PartnerAnalysis() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [jobTypeFilter, setJobTypeFilter] = useState<string>("all");
  const [partnerFilter, setPartnerFilter] = useState<string>("all");
  const [selectedPartner, setSelectedPartner] = useState<PartnerPerformanceData | null>(null);
  
  const { loading, partnerPerformance, partnerJobs } = usePartnerPerformance(dateRange);
  
  // Get unique partner names for the filter
  const partnerNames = Array.from(new Set(partnerPerformance.map(p => p.partner_name)));
  
  // Apply filters
  const filteredPartners = partnerPerformance.filter(partner => {
    if (jobTypeFilter !== "all" && partner.job_type !== jobTypeFilter) {
      return false;
    }
    if (partnerFilter !== "all" && partner.partner_name !== partnerFilter) {
      return false;
    }
    return true;
  });
  
  // Sort partners by efficiency
  const sortedPartners = sortPartnersByEfficiency(filteredPartners);
  
  // Filter jobs by selected criteria
  const filteredJobs: PartnerJobData[] = partnerJobs.filter(job => {
    // Filter by job type if selected
    if (jobTypeFilter !== "all" && job.job_type !== jobTypeFilter) {
      return false;
    }
    
    // Filter by partner if selected
    if (partnerFilter !== "all" && job.partner_name !== partnerFilter) {
      return false;
    }
    
    // Filter by selected partner if any
    if (selectedPartner && job.partner_name !== selectedPartner.partner_name) {
      return false;
    }
    
    return true;
  });
  
  const handlePartnerSelect = (partner: PartnerPerformanceData) => {
    if (selectedPartner?.partner_name === partner.partner_name) {
      setSelectedPartner(null); // Deselect if already selected
    } else {
      setSelectedPartner(partner);
    }
  };
  
  const handleJobTypeChange = (value: string) => {
    setJobTypeFilter(value);
    // Reset selected partner when changing job type
    setSelectedPartner(null);
  };
  
  const handlePartnerFilter = (value: string) => {
    setPartnerFilter(value);
    // Reset selected partner when changing partner filter
    setSelectedPartner(null);
  };
  
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    // Reset selected partner when changing date range
    setSelectedPartner(null);
  };

  return (
    <div className="space-y-6">
      <PartnerAnalysisFilters 
        onJobTypeChange={handleJobTypeChange}
        onDateRangeChange={handleDateRangeChange}
        onPartnerFilter={handlePartnerFilter}
        partnerNames={partnerNames}
      />
      
      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <PartnerPerformanceSummary partnerData={filteredPartners} />
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {selectedPartner ? `${selectedPartner.partner_name}'s Performance` : 'Partner Efficiency'}
            </h3>
            
            {filteredPartners.length === 0 ? (
              <div className="bg-muted/50 p-8 rounded-md text-center text-muted-foreground">
                No partner data available for the selected filters.
              </div>
            ) : !selectedPartner ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedPartners.map((partner) => (
                  <PartnerEfficiencyCard
                    key={`${partner.partner_name}-${partner.job_type}`}
                    partnerData={partner}
                    onClick={() => handlePartnerSelect(partner)}
                  />
                ))}
              </div>
            ) : null}
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {selectedPartner 
                ? `${selectedPartner.partner_name}'s Job Details` 
                : 'Job Details'}
            </h3>
            <PartnerJobsTable jobs={filteredJobs} />
          </div>
        </>
      )}
    </div>
  );
}
