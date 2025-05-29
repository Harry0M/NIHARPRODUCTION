
import { useParams } from "react-router-dom";
import { StockForm } from "@/components/inventory/StockForm";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonForm } from "@/components/ui/skeleton-loader";
import { AlertCircle, History, Plus, Database, ShoppingBag } from "lucide-react";
import { SupplierHistory } from "@/components/inventory/stock-detail/SupplierHistory";
import { useStockDetail } from "@/hooks/inventory/useStockDetail";
import { StockInfoGrid } from "@/components/inventory/stock-detail/StockInfoGrid";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockTransactionHistory } from "@/components/inventory/stock-detail/StockTransactionHistory";
import { useEffect, useState } from "react";
import { showToast } from "@/components/ui/enhanced-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const StockDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<string>("edit");
  
  console.log("Stock detail page opened with ID:", id);
  
  const { 
    stockItem, 
    linkedComponents, 
    transactions, 
    transactionLogs,
    isLoading, 
    refreshTransactions, 
    isRefreshing, 
    isTransactionsLoading,
    createTestTransaction,
    errorMessage
  } = useStockDetail({
    stockId: id || null,
    onClose: () => {} // Not used in this context
  });

  // Auto-switch to view tab if transactions are detected on load
  useEffect(() => {
    if (!isLoading && (transactions?.length > 0 || transactionLogs?.length > 0)) {
      // Check if there's a recent update in localStorage
      try {
        const lastUpdate = localStorage.getItem('last_inventory_update');
        const updatedMaterialIds = localStorage.getItem('updated_material_ids');
        
        if (lastUpdate && updatedMaterialIds) {
          const materialIds = JSON.parse(updatedMaterialIds);
          const updateTime = new Date(lastUpdate).getTime();
          const currentTime = new Date().getTime();
          const isRecent = (currentTime - updateTime) < 60000; // Within last minute
          
          if (isRecent && id && materialIds.includes(id)) {
            console.log("Recent material update detected, switching to view tab");
            setActiveTab("view");
            
            // Get specific details about this update if available
            const materialUpdateKey = `material_update_${id}`;
            const materialUpdateDetails = localStorage.getItem(materialUpdateKey);
            
            if (materialUpdateDetails) {
              try {
                const details = JSON.parse(materialUpdateDetails);
                const changeAmount = Math.abs(details.previous - details.new).toFixed(2);
                const changeDirection = details.new > details.previous ? "increased" : "decreased";
                
                showToast({
                  title: "Inventory Updated",
                  description: `Quantity ${changeDirection} by ${changeAmount} units. Transaction history available.`,
                  type: "info"
                });
                
              } catch (e) {
                console.error("Error parsing material update details:", e);
              }
            } else {
              showToast({
                title: "Transaction history available",
                description: "This material has recent transaction history",
                type: "info"
              });
            }
          }
        }
      } catch (e) {
        console.error("Error checking local storage:", e);
      }
    }
  }, [id, transactions, transactionLogs, isLoading]);

  // Function to handle manual refresh
  const handleRefreshTransactions = async () => {
    console.log("Manually refreshing transactions");
    try {
      showToast({
        title: "Refreshing transactions",
        description: "Checking for latest transaction data",
        type: "info"
      });
      
      await refreshTransactions();
    } catch (error) {
      console.error("Error refreshing transactions manually:", error);
    }
  };
  
  // Function to create a test transaction (for debugging)
  const handleCreateTestTransaction = async () => {
    if (!id) return;
    
    try {
      const result = await createTestTransaction();
      if (result) {
        setActiveTab("view");
      }
    } catch (error) {
      console.error("Error creating test transaction:", error);
    }
  };

  // Calculate if we have any transactions
  const hasTransactions = (transactions && transactions.length > 0) || 
                         (transactionLogs && transactionLogs.length > 0);
  const transactionCount = (transactions?.length || 0) + (transactionLogs?.length || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Stock Item</h1>
          <p className="text-muted-foreground">Modify inventory stock details</p>
        </div>
        
        <div className="flex items-center gap-2">
          {!hasTransactions && id && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateTestTransaction}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Test Transaction
            </Button>
          )}
          
          {hasTransactions && (
            <Badge 
              variant="outline" 
              className="flex items-center gap-1 px-3 py-1 cursor-pointer hover:bg-muted"
              onClick={() => setActiveTab("view")}
            >
              <History className="h-4 w-4" />
              {transactionCount} Transaction{transactionCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <SkeletonForm />
      ) : id ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="edit">Edit Details</TabsTrigger>
            <TabsTrigger value="view" className="relative">
              View Details
              {hasTransactions && (
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
                  
                  <div className="border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Inventory History
                      </h3>
                      {errorMessage && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {errorMessage}
                        </p>
                      )}
                    </div>
                    
                    <StockTransactionHistory 
                      materialId={id}
                      transactions={transactions || []}
                      transactionLogs={transactionLogs || []}
                      isLoading={isTransactionsLoading}
                      onRefresh={handleRefreshTransactions}
                    />
                    
                    <div className="mt-8">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          <ShoppingBag className="h-5 w-5" />
                          Supplier Management
                        </h3>
                      </div>
                      <SupplierHistory materialId={id} onUpdate={() => {}} />
                    </div>
                  </div>
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
