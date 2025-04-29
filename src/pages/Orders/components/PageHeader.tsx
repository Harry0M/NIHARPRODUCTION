
import { NavigateFunction } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  navigate: NavigateFunction;
}

export const PageHeader = ({ navigate }: PageHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost"
          size="sm"
          onClick={() => navigate("/orders")}
          className="gap-1"
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Order</h1>
          <p className="text-muted-foreground">Create a new order for production</p>
        </div>
      </div>
    </div>
  );
};
