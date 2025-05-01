
import { StockForm } from "@/components/inventory/StockForm";

const StockNew = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add New Stock Item</h1>
        <p className="text-muted-foreground">Create a new inventory stock item</p>
      </div>
      
      <StockForm />
    </div>
  );
};

export default StockNew;
