
import { Separator } from "@/components/ui/separator";

interface StockCostTrackingProps {
  inventory: {
    purchase_price?: number;
    selling_price?: number;
  };
}

export const StockCostTracking = ({ inventory }: StockCostTrackingProps) => {
  if (!inventory.purchase_price && !inventory.selling_price) {
    return null;
  }
  
  return (
    <div>
      <h3 className="text-lg font-medium">Cost Tracking</h3>
      <Separator className="my-2" />
      <div className="space-y-2">
        {inventory.purchase_price && (
          <div className="flex items-center">
            <span className="font-medium mr-2">Purchase Price:</span>
            <span>${inventory.purchase_price.toFixed(2)}</span>
          </div>
        )}
        {inventory.selling_price && (
          <div className="flex items-center">
            <span className="font-medium mr-2">Selling Price:</span>
            <span>${inventory.selling_price.toFixed(2)}</span>
          </div>
        )}
        {inventory.purchase_price && inventory.selling_price && (
          <div className="flex items-center">
            <span className="font-medium mr-2">Profit Margin:</span>
            <span>
              {((inventory.selling_price - inventory.purchase_price) / inventory.purchase_price * 100).toFixed(2)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
