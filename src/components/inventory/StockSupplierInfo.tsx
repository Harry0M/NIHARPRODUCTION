
import { Separator } from "@/components/ui/separator";

interface StockSupplierInfoProps {
  suppliers?: {
    name: string;
  };
}

export const StockSupplierInfo = ({ suppliers }: StockSupplierInfoProps) => {
  if (!suppliers) {
    return null;
  }
  
  return (
    <div>
      <h3 className="text-lg font-medium">Supplier Information</h3>
      <Separator className="my-2" />
      <div className="space-y-2">
        <div className="flex items-center">
          <span className="font-medium mr-2">Supplier:</span>
          <span>{suppliers.name}</span>
        </div>
      </div>
    </div>
  );
};
