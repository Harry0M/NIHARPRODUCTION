
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface OrderEditHeaderProps {
  onBack: () => void;
}

export const OrderEditHeader: React.FC<OrderEditHeaderProps> = ({ onBack }) => {
  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="ghost" 
        size="sm" 
        className="gap-1"
        onClick={onBack}
      >
        <ArrowLeft size={16} />
        Back
      </Button>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Order</h1>
        <p className="text-muted-foreground">Update order details</p>
      </div>
    </div>
  );
};

export default OrderEditHeader;
