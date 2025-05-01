
import { Separator } from "@/components/ui/separator";

interface StockCostTrackingProps {
  inventory: {
    purchase_price?: number | string;
    selling_price?: number | string;
  };
}

export const StockCostTracking = ({ inventory }: StockCostTrackingProps) => {
  // Since we're not using cost tracking anymore, this component returns null
  return null;
};
