
import { InventoryValueCard } from "@/components/analysis/inventory/InventoryValueCard";
import { MaterialConsumptionCard } from "@/components/analysis/inventory/MaterialConsumptionCard";
import { OrderConsumptionCard } from "@/components/analysis/order/OrderConsumptionCard";
import { PartnersAnalysisCard } from "@/components/analysis/partners/PartnersAnalysisCard";
import { RefillAnalysisCard } from "@/components/analysis/refill/RefillAnalysisCard";
import { TransactionHistoryCard } from "@/components/analysis/transactions/TransactionHistoryCard";
import { WastageAnalysisCard } from "@/components/analysis/wastage/WastageAnalysisCard";

export default function AnalysisDashboard() {
  return (
    <div>
      <div className="flex flex-col space-y-1.5 mb-6">
        <h1 className="font-semibold text-3xl tracking-tight">Analysis Dashboard</h1>
        <p className="text-muted-foreground">
          Analyze your business performance across multiple dimensions
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <InventoryValueCard />
        <MaterialConsumptionCard />
        <OrderConsumptionCard />
        <WastageAnalysisCard />
        <PartnersAnalysisCard />
        <RefillAnalysisCard />
        <TransactionHistoryCard />
      </div>
    </div>
  );
}
