
import { Button } from "@/components/ui/button";
import { WastageData } from "@/types/wastage";
import { downloadAsCSV, downloadAsPDF } from "@/utils/downloadUtils";
import { FileDown } from "lucide-react";
import { useState } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface ExportWastageDataProps {
  data: WastageData[];
}

export function ExportWastageData({ data }: ExportWastageDataProps) {
  const [exporting, setExporting] = useState(false);

  const formatDataForExport = () => {
    return data.map(item => ({
      order_number: item.order_number,
      company_name: item.company_name,
      job_number: item.job_number || 'N/A',
      job_type: item.job_type === 'printing_jobs' ? 'Printing' : 
                item.job_type === 'stitching_jobs' ? 'Stitching' : 
                item.job_type === 'cutting_jobs' ? 'Cutting' : item.job_type,
      worker_name: item.worker_name || 'N/A',
      provided_quantity: item.provided_quantity,
      received_quantity: item.received_quantity,
      wastage_quantity: item.wastage_quantity,
      wastage_percentage: `${item.wastage_percentage.toFixed(2)}%`,
      created_at: new Date(item.created_at).toLocaleDateString(),
    }));
  };

  const handleExportCSV = () => {
    setExporting(true);
    try {
      const formattedData = formatDataForExport();
      downloadAsCSV(formattedData, 'wastage-report');
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = () => {
    setExporting(true);
    try {
      const formattedData = formatDataForExport();
      downloadAsPDF(formattedData, 'wastage-report', 'Wastage Analysis Report');
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={exporting || data.length === 0}>
          <FileDown className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
