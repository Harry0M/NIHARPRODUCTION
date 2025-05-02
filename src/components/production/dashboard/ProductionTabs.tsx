
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CuttingStageList } from "@/components/production/stages/CuttingStageList";
import { PrintingStageList } from "@/components/production/stages/PrintingStageList";
import { StitchingStageList } from "@/components/production/stages/StitchingStageList";
import { DispatchStageList } from "@/components/production/stages/DispatchStageList";
import { JobsData } from "@/types/production";

interface ProductionTabsProps {
  jobs: JobsData;
  activeTab: string;
  onTabChange: (value: string) => void;
}

export const ProductionTabs = ({ jobs, activeTab, onTabChange }: ProductionTabsProps) => {
  return (
    <Tabs defaultValue={activeTab} className="space-y-4" onValueChange={onTabChange}>
      <TabsList>
        <TabsTrigger value="cutting">Cutting</TabsTrigger>
        <TabsTrigger value="printing">Printing</TabsTrigger>
        <TabsTrigger value="stitching">Stitching</TabsTrigger>
        <TabsTrigger value="dispatch">Dispatch</TabsTrigger>
      </TabsList>
      
      <TabsContent value="cutting">
        <CuttingStageList jobs={jobs.cutting} />
      </TabsContent>
      
      <TabsContent value="printing">
        <PrintingStageList jobs={jobs.printing} />
      </TabsContent>
      
      <TabsContent value="stitching">
        <StitchingStageList jobs={jobs.stitching} />
      </TabsContent>
      
      <TabsContent value="dispatch">
        <DispatchStageList jobs={jobs.dispatch} />
      </TabsContent>
    </Tabs>
  );
};
