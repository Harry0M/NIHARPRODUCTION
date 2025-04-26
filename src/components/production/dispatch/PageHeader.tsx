
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DownloadButton } from "@/components/DownloadButton";

interface PageHeaderProps {
  dispatchData: any;
  onDownloadCSV: () => void;
  onDownloadPDF: () => void;
}

export const PageHeader = ({ dispatchData, onDownloadCSV, onDownloadPDF }: PageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardList className="h-6 w-6" />
          Dispatch Order
        </h1>
        <p className="text-muted-foreground mb-5">
          Complete and track the dispatch for this order.
        </p>
        <Button 
          onClick={() => navigate("/dispatch")} 
          variant="outline" 
          size="sm"
        >
          Back to Dispatch List
        </Button>
      </div>
      
      {dispatchData && (
        <DownloadButton 
          label="Download Details"
          onCsvClick={onDownloadCSV}
          onPdfClick={onDownloadPDF}
        />
      )}
    </div>
  );
};
