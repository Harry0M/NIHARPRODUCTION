
import { useParams } from "react-router-dom";
import { StockForm } from "@/components/inventory/StockForm";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonForm } from "@/components/ui/skeleton-loader";
import { AlertCircle } from "lucide-react";
import { useStockDetail } from "@/hooks/inventory/useStockDetail";
import { StockInfoGrid } from "@/components/inventory/stock-detail/StockInfoGrid";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const StockDetail = () => {
  const { id } = useParams<{ id: string }>();
  
  console.log("Stock detail page opened with ID:", id);
  
  const { stockItem, linkedComponents, transactions, isLoading } = useStockDetail({
    stockId: id || null,
    onClose: () => {} // Not used in this context
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Stock Item</h1>
        <p className="text-muted-foreground">Modify inventory stock details</p>
      </div>
      
      {isLoading ? (
        <SkeletonForm />
      ) : id ? (
        <Tabs defaultValue="edit">
          <TabsList>
            <TabsTrigger value="edit">Edit Details</TabsTrigger>
            <TabsTrigger value="view">View Details</TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="mt-4">
            <StockForm stockId={id} />
          </TabsContent>
          <TabsContent value="view" className="mt-4">
            <Card className="p-6">
              {stockItem ? (
                <StockInfoGrid 
                  stockItem={stockItem} 
                  linkedComponents={linkedComponents}
                  transactions={transactions}
                />
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
