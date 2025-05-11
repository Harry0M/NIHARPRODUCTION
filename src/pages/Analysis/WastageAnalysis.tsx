
import { useState } from "react";
import { useWastageAnalysis } from "@/hooks/analysis/useWastageAnalysis";
import { WastageFilterBar } from "@/components/analysis/wastage/WastageFilterBar";
import { WastageSummaryCards } from "@/components/analysis/wastage/WastageSummaryCards";
import { WastageCharts } from "@/components/analysis/wastage/WastageCharts";
import { WastageTable } from "@/components/analysis/wastage/WastageTable";
import { ExportWastageData } from "@/components/analysis/wastage/ExportWastageData";
import { DateRange, JobType } from "@/types/wastage";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

export default function WastageAnalysis() {
  const {
    wastageData,
    summary,
    loading,
    error,
    filters,
    setFilters,
    refetch
  } = useWastageAnalysis();

  const handleJobTypeChange = (value: string) => {
    setFilters(prev => ({ ...prev, jobType: value as JobType }));
  };

  const handleDateRangeChange = (range: DateRange) => {
    setFilters(prev => ({ ...prev, dateRange: range }));
  };

  const handleWorkerChange = (value: string) => {
    setFilters(prev => ({ ...prev, worker: value }));
  };

  const handleOrderChange = (value: string) => {
    setFilters(prev => ({ ...prev, order: value }));
  };

  const resetFilters = () => {
    setFilters({
      jobType: 'all',
      dateRange: { from: undefined, to: undefined },
      worker: '',
      order: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wastage Analysis</h1>
          <p className="text-muted-foreground">
            Track and analyze wastage across production jobs
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refetch} variant="outline" size="sm">
            <RefreshCcw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <ExportWastageData data={wastageData} />
        </div>
      </div>

      <WastageFilterBar
        onJobTypeChange={handleJobTypeChange}
        onDateRangeChange={handleDateRangeChange}
        onWorkerChange={handleWorkerChange}
        onOrderChange={handleOrderChange}
        onResetFilters={resetFilters}
        dateRange={filters.dateRange}
        jobType={filters.jobType}
        worker={filters.worker}
        order={filters.order}
      />

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Error loading wastage data: {error}
        </div>
      ) : (
        <>
          <WastageSummaryCards summary={summary} />
          
          <WastageCharts summary={summary} />
          
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Detailed Wastage Records</h2>
            <WastageTable data={wastageData} />
          </div>
        </>
      )}
    </div>
  );
}
