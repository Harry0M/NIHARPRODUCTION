
import { useParams } from "react-router-dom";
import { StockForm } from "@/components/inventory/StockForm";

const StockDetail = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Stock Item</h1>
        <p className="text-muted-foreground">Modify inventory stock details</p>
      </div>
      
      {id && <StockForm stockId={id} />}
    </div>
  );
};

export default StockDetail;
