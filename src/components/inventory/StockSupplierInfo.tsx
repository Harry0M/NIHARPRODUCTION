
import { Separator } from "@/components/ui/separator";

interface StockSupplierInfoProps {
  supplier?: {
    name?: string;
    contact_person?: string;
    phone?: string;
    email?: string;
  };
}

export const StockSupplierInfo = ({ supplier }: StockSupplierInfoProps) => {
  if (!supplier || !supplier.name) {
    return (
      <div>
        <h3 className="text-lg font-medium">Supplier Information</h3>
        <Separator className="my-2" />
        <div className="text-muted-foreground italic">No supplier information available</div>
      </div>
    );
  }
  
  return (
    <div>
      <h3 className="text-lg font-medium">Supplier Information</h3>
      <Separator className="my-2" />
      <div className="space-y-2">
        <div className="flex items-center">
          <span className="font-medium mr-2">Supplier:</span>
          <span>{supplier.name}</span>
        </div>
        {supplier.contact_person && (
          <div className="flex items-center">
            <span className="font-medium mr-2">Contact Person:</span>
            <span>{supplier.contact_person}</span>
          </div>
        )}
        {supplier.phone && (
          <div className="flex items-center">
            <span className="font-medium mr-2">Phone:</span>
            <span>{supplier.phone}</span>
          </div>
        )}
        {supplier.email && (
          <div className="flex items-center">
            <span className="font-medium mr-2">Email:</span>
            <span>{supplier.email}</span>
          </div>
        )}
      </div>
    </div>
  );
};
