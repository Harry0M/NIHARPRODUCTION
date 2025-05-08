
import { useParams } from "react-router-dom";
import { StockForm } from "@/components/inventory/StockForm";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonForm } from "@/components/ui/skeleton-loader";
import { AlertCircle } from "lucide-react";
import { useStockDetail } from "@/hooks/inventory/useStockDetail";
import { StockInfoGrid } from "@/components/inventory/stock-detail/StockInfoGrid";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockTransactionHistory } from "@/components/inventory/stock-detail/StockTransactionHistory";
import { useEffect, useState } from "react";
import { showToast } from "@/components/ui/enhanced-toast";

const StockDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<string>("edit");
  
  console.log("Stock detail page opened with ID:", id);
  
  const { 
    stockItem, 
    linkedComponents, 
    transactions, 
    isLoading, 
    refreshTransactions, 
    isRefreshing, 
    isTransactionsLoading 
  } = useStockDetail({
    stockId: id || null,
    onClose: () => {} // Not used in this context
  });

  // Auto-switch to view tab if transactions are detected on load
  useEffect(() => {
    if (!isLoading && transactions && transactions.length > 0) {
      // Check if there's a recent update in localStorage
      try {
        const lastUpdate = localStorage.getItem('last_inventory_update');
        const updatedMaterialIds = localStorage.getItem('updated_material_ids');
        
        if (lastUpdate && updatedMaterialIds) {
          const materialIds = JSON.parse(updatedMaterialIds);
          const updateTime = new Date(lastUpdate).getTime();
          const currentTime = new Date().getTime();
          const isRecent = (currentTime - updateTime) < 60000; // Within last minute
          
          if (isRecent && materialIds.includes(id)) {
            console.log("Recent material update detected, switching to view tab");
            setActiveTab("view");
            
            showToast({
              title: "Transaction history available",
              description: "This material has recent transaction history",
              type: "info"
            });
          }
        }
      } catch (e) {
        console.error("Error checking local storage:", e);
      }
    }
  }, [id, transactions, isLoading]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Stock Item</h1>
        <p className="text-muted-foreground">Modify inventory stock details</p>
      </div>
      
      {isLoading ? (
        <SkeletonForm />
      ) : id ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="edit">Edit Details</TabsTrigger>
            <TabsTrigger value="view" className="relative">
              View Details
              {transactions && transactions.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="mt-4">
            <StockForm stockId={id} />
          </TabsContent>
          <TabsContent value="view" className="mt-4">
            <Card className="p-6">
              {stockItem ? (
                <div className="space-y-6">
                  <StockInfoGrid 
                    stockItem={stockItem} 
                    linkedComponents={linkedComponents}
                  />
                  
                  <StockTransactionHistory 
                    transactions={transactions || []}
                    onRefresh={refreshTransactions}
                    isLoading={isRefreshing || isTransactionsLoading}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 space-y-4">
                  <AlertCircle className="h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-medium">No Stock Data Found</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Cannot load stock details. Please try refreshing the page.
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 space-y-4 border rounded-md">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">No Stock ID Provided</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Cannot load stock details without a valid ID. Please go back to the inventory list and select a stock item.
          </p>
        </div>
      )}
    </div>
  );
};

export default StockDetail;
