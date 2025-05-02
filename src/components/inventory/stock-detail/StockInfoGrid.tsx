
interface StockInfoGridProps {
  stockItem: any;
}

export const StockInfoGrid = ({ stockItem }: StockInfoGridProps) => {
  if (!stockItem) return null;
  
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium text-sm">Material Type</h3>
          <p>{stockItem.material_type}</p>
        </div>
        
        <div>
          <h3 className="font-medium text-sm">Color</h3>
          <p>{stockItem.color || "N/A"}</p>
        </div>
        
        <div>
          <h3 className="font-medium text-sm">GSM</h3>
          <p>{stockItem.gsm || "N/A"}</p>
        </div>
        
        <div>
          <h3 className="font-medium text-sm">Quantity</h3>
          <p>{stockItem.quantity} {stockItem.unit}</p>
        </div>
        
        {stockItem.alternate_unit && (
          <div>
            <h3 className="font-medium text-sm">Alternate Unit</h3>
            <p>
              {(stockItem.quantity * (stockItem.conversion_rate || 1)).toFixed(2)} {stockItem.alternate_unit}
            </p>
          </div>
        )}
        
        {stockItem.track_cost && (
          <>
            <div>
              <h3 className="font-medium text-sm">Purchase Price</h3>
              <p>{stockItem.purchase_price ? `₹${stockItem.purchase_price}` : "N/A"}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm">Selling Price</h3>
              <p>{stockItem.selling_price ? `₹${stockItem.selling_price}` : "N/A"}</p>
            </div>
          </>
        )}
        
        <div>
          <h3 className="font-medium text-sm">Supplier</h3>
          <p>{stockItem.suppliers?.name || "N/A"}</p>
        </div>
        
        {stockItem.reorder_level && (
          <div>
            <h3 className="font-medium text-sm">Reorder Level</h3>
            <p>{stockItem.reorder_level}</p>
          </div>
        )}
      </div>
    </div>
  );
};
