
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DownloadButton } from "@/components/DownloadButton";

interface OrderHeaderProps {
  onDownloadCsv: () => void;
  onDownloadPdf: () => void;
  loading: boolean;
  ordersCount: number;
}

export const OrderHeader = ({ onDownloadCsv, onDownloadPdf, loading, ordersCount }: OrderHeaderProps) => {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">Manage and track your manufacturing orders</p>
      </div>
      <div className="flex items-center gap-2">
        <DownloadButton 
          label="Download Orders"
          onCsvClick={onDownloadCsv}
          onPdfClick={onDownloadPdf}
          disabled={loading || ordersCount === 0}
        />
        <Link to="/orders/new">
          <Button className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-1" />
            New Order
          </Button>
        </Link>
      </div>
    </div>
  );
};
