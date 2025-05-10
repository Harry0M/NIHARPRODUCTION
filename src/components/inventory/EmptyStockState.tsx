
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, Plus, Layers } from "lucide-react";

export const EmptyStockState = () => {
  return (
    <div className="flex flex-col items-center justify-center p-16 text-center bg-muted/20 dark:bg-muted/10 rounded-xl border border-dashed border-border/60 slide-up" style={{animationDelay: '0.1s'}}>
      <div className="w-20 h-20 mb-6 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center animate-in fade-in zoom-in duration-500">
        <Layers className="h-10 w-10 text-primary" />
      </div>
      
      <h3 className="text-2xl font-semibold mb-3">
        Your inventory is empty
      </h3>
      
      <p className="text-muted-foreground max-w-md mb-8">
        Keep track of your materials, track quantities, and manage stock levels by adding items to your inventory.
      </p>
      
      <Link to="/inventory/stock/new">
        <Button className="gap-2 px-4 py-6 h-auto text-base rounded-lg shadow-sm bg-primary hover:bg-primary/90 dark:shadow-lg dark:shadow-primary/20 transition-all">
          <Plus className="h-5 w-5" />
          Add Your First Stock Item
        </Button>
      </Link>
    </div>
  );
};
