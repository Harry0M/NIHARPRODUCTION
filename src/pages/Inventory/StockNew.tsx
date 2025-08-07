
import { StockForm } from "@/components/inventory/StockForm";

const StockNew = () => {
  const handleStockCreated = (stockId: string) => {
    // Navigate to stock list using the same technique as catalog
    window.location.href = `${window.location.origin}/#/inventory/stock`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add New Stock Item</h1>
        <p className="text-muted-foreground">Create a new inventory stock item</p>
      </div>
      
      <StockForm onSuccess={handleStockCreated} />
    </div>
  );
};

export default StockNew;
