
import { AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface StockInventoryManagementProps {
  inventory: {
    quantity: number;
    reorder_level?: number;
    unit: string;
  };
}

export const StockInventoryManagement = ({ inventory }: StockInventoryManagementProps) => {
  // Check if inventory and reorder_level exist
  if (!inventory || !inventory.reorder_level) {
    return null;
  }
  
  return (
    <div>
      <h3 className="text-lg font-medium">Inventory Management</h3>
      <Separator className="my-2" />
      <div className="space-y-2">
        <div className="flex items-center">
          <AlertCircle className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="font-medium mr-2">Reorder Level:</span>
          <span>{inventory.reorder_level} {inventory.unit}</span>
        </div>
        <div className="flex items-center">
          <span className="font-medium mr-2">Status:</span>
          {inventory.quantity <= inventory.reorder_level ? (
            <Badge variant="destructive">Reorder Required</Badge>
          ) : (
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">In Stock</Badge>
          )}
        </div>
        <div className="flex items-center">
          <span className="font-medium mr-2">Stock Quantity:</span>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${inventory.quantity <= inventory.reorder_level ? 'bg-red-500' : 'bg-primary'}`}
              style={{ width: `${Math.min(inventory.quantity / (inventory.reorder_level * 2) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
