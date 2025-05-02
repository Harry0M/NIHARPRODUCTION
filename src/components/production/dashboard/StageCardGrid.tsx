
import React from "react";
import { StageCard } from "@/components/production/StageCard";
import { JobsData } from "@/types/production";

interface StageCardGridProps {
  jobs: JobsData;
  activeTab: string;
}

export const StageCardGrid = ({ jobs, activeTab }: StageCardGridProps) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StageCard
        title="Cutting"
        count={jobs.cutting.length}
        path="/production?tab=cutting"
        isActive={activeTab === 'cutting'}
        description="Active jobs in cutting stage"
      />
      <StageCard
        title="Printing"
        count={jobs.printing.length}
        path="/production?tab=printing"
        isActive={activeTab === 'printing'}
        description="Active jobs in printing stage"
      />
      <StageCard
        title="Stitching"
        count={jobs.stitching.length}
        path="/production?tab=stitching"
        isActive={activeTab === 'stitching'}
        description="Active jobs in stitching stage"
      />
      <StageCard
        title="Dispatch"
        count={jobs.dispatch.length}
        path="/production?tab=dispatch"
        isActive={activeTab === 'dispatch'}
        description="Orders ready for dispatch"
      />
    </div>
  );
};
