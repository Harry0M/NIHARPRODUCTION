
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Package, FileDown } from "lucide-react";
import { DownloadButton } from "@/components/DownloadButton";
import { Badge } from "@/components/ui/badge";

interface OrderHeaderProps {
  onDownloadCsv: () => void;
  onDownloadPdf: () => void;
  loading: boolean;
  ordersCount: number;
}

export const OrderHeader = ({ onDownloadCsv, onDownloadPdf, loading, ordersCount }: OrderHeaderProps) => {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between slide-in">
      <div className="fade-in">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <span className="h-6 w-1.5 rounded-full bg-primary inline-block"></span>
            Orders
          </h1>
          <Badge 
            variant="outline" 
            className="ml-2 bg-muted/50 text-foreground/80 hover:bg-muted transition-colors border-border/40 shadow-sm"
          >
            <Package className="h-3 w-3 mr-1 text-primary" />
            {ordersCount} {ordersCount === 1 ? 'order' : 'orders'}
          </Badge>
        </div>
        <p className="text-muted-foreground">Manage and track your manufacturing orders</p>
      </div>
      <div className="flex items-center gap-3 scale-in" style={{animationDelay: '0.1s'}}>
        <DownloadButton 
          label="Download"
          onCsvClick={onDownloadCsv}
          onPdfClick={onDownloadPdf}
          disabled={loading || ordersCount === 0}
        />
        <Link to="/orders/new">
          <Button 
            className="shadow-sm transition-all font-medium"
            size="default"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Order
          </Button>
        </Link>
      </div>
    </div>
  );
};
