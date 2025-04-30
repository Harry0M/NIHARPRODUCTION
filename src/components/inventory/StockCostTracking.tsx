
import { Separator } from "@/components/ui/separator";

interface StockCostTrackingProps {
  inventory: {
    purchase_price?: number | string;
    selling_price?: number | string;
  };
}

export const StockCostTracking = ({ inventory }: StockCostTrackingProps) => {
  // Exit early if inventory is undefined or both prices are undefined/null
  if (!inventory || (!inventory.purchase_price && !inventory.selling_price)) {
    return null;
  }
  
  // Parse prices to numbers if they're strings
  const purchasePrice = typeof inventory.purchase_price === 'string' 
    ? parseFloat(inventory.purchase_price) 
    : inventory.purchase_price;
    
  const sellingPrice = typeof inventory.selling_price === 'string'
    ? parseFloat(inventory.selling_price)
    : inventory.selling_price;
  
  // Calculate profit margin if both prices exist
  const calculatedMargin = purchasePrice && sellingPrice 
    ? ((sellingPrice - purchasePrice) / purchasePrice) * 100 
    : null;
  
  return (
    <div>
      <h3 className="text-lg font-medium">Cost Tracking</h3>
      <Separator className="my-2" />
      <div className="space-y-2">
        {purchasePrice && (
          <div className="flex items-center">
            <span className="font-medium mr-2">Purchase Price:</span>
            <span>₹{purchasePrice.toFixed(2)}</span>
          </div>
        )}
        {sellingPrice && (
          <div className="flex items-center">
            <span className="font-medium mr-2">Selling Price:</span>
            <span>₹{sellingPrice.toFixed(2)}</span>
          </div>
        )}
        {calculatedMargin !== null && (
          <div className="flex items-center">
            <span className="font-medium mr-2">Profit Margin:</span>
            <span>{calculatedMargin.toFixed(2)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};
