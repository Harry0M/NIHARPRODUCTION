
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package2Icon, Plus } from "lucide-react";

interface EmptyOrdersStateProps {
  isFiltering: boolean;  // Changed from "hasFilters" to "isFiltering" to match usage
}

export const EmptyOrdersState = ({ isFiltering }: EmptyOrdersStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Package2Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium">No orders found</h3>
      <p className="text-muted-foreground mb-4">
        {isFiltering
          ? "Try changing your search or filter"
          : "Create your first order to get started"}
      </p>
      <Link to="/orders/new">
        <Button>
          <Plus className="mr-1 h-4 w-4" />
          New Order
        </Button>
      </Link>
    </div>
  );
};
