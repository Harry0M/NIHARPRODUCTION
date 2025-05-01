
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Box, Plus } from "lucide-react";

export const EmptyStockState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Box className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">No inventory items found</h3>
      <p className="text-muted-foreground mb-4">
        Add your first stock item to get started
      </p>
      <Link to="/inventory/stock/new">
        <Button>
          <Plus className="mr-1 h-4 w-4" />
          Add Stock Item
        </Button>
      </Link>
    </div>
  );
};
