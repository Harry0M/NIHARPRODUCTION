
import { useSearchParams } from "react-router-dom";
import { LoadingSpinner } from "@/components/production/LoadingSpinner";
import { ProductionHeader } from "@/components/production/dashboard/ProductionHeader";
import { StageCardGrid } from "@/components/production/dashboard/StageCardGrid";
import { ProductionTabs } from "@/components/production/dashboard/ProductionTabs";
import { useProductionData } from "@/hooks/production/useProductionData";

const ProductionDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "cutting";
  const { jobs, loading } = useProductionData();

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <ProductionHeader />
      <StageCardGrid jobs={jobs} activeTab={initialTab} />
      <ProductionTabs 
        jobs={jobs} 
        activeTab={initialTab} 
        onTabChange={handleTabChange} 
      />
    </div>
  );
};

export default ProductionDashboard;
